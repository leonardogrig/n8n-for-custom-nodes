#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const os = require("os");

// Configuration
const N8N_PORT = 5678;

// Helper functions
function log(message, emoji = "📋") {
  console.log(`${emoji} ${message}`);
}

function executeCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
  } catch (error) {
    if (options.ignoreError) {
      return "";
    }
    log(`Error executing command: ${command}`, "❌");
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    throw error;
  }
}

function dockerCommandExists() {
  try {
    execSync("docker --version", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

function dockerComposeCommandExists() {
  // Try both 'docker-compose' and 'docker compose'
  try {
    execSync("docker-compose --version", { stdio: "pipe" });
    return "docker-compose";
  } catch (error) {
    try {
      execSync("docker compose version", { stdio: "pipe" });
      return "docker compose";
    } catch (error) {
      return false;
    }
  }
}

function isContainerRunning(containerName) {
  try {
    const output = execSync(
      `docker ps --filter "name=${containerName}" --format "{{.Names}}"`,
      { encoding: "utf8", stdio: "pipe" }
    );
    return output.includes(containerName);
  } catch (error) {
    return false;
  }
}

function createDockerComposeFile() {
  const composeContent = `version: '3'

services:
  n8n:
    container_name: n8n-for-custom-nodes
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "${N8N_PORT}:5678"
    environment:
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - N8N_LOG_LEVEL=verbose
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_HIRING_BANNER_ENABLED=false
      - GENERIC_TIMEZONE=Etc/UTC
    volumes:
      - ./data:/home/node/.n8n
    command: /bin/sh -c "n8n start"
`;

  fs.writeFileSync("docker-compose.yml", composeContent, "utf8");
  log("Created docker-compose.yml file", "✅");
}

function createDependencyExtractScript() {
  const scriptContent = `#!/bin/sh

echo "🔎 Looking for custom nodes and their dependencies..."

# Ensure directory structure exists
mkdir -p /home/node/.n8n/custom

# Fix permissions on custom directory first
chown -R node:node /home/node/.n8n/custom || true

# Process each custom node directory
for dir in /home/node/.n8n/custom/*; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    NODE_NAME=$(node -e "console.log(require('$dir/package.json').name || 'unknown')")
    echo "📦 Processing custom node: $NODE_NAME"
    
    # Extract all dependencies from package.json
    DEPS=$(node -e "const pkg = require('$dir/package.json'); console.log(Object.entries(pkg.dependencies || {}).map(([name, version]) => name + '@' + (version.replace(/[^0-9.]/g, '') || version)).join(' '))")
    
    if [ -n "$DEPS" ]; then
      echo "🔧 Installing dependencies for $NODE_NAME: $DEPS"
      npm install -g $DEPS
      
      # Create directory structure for each dependency
      echo "$DEPS" | tr ' ' '\\n' | while read -r dep; do
        if [ -n "$dep" ]; then
          PKG_NAME=$(echo "$dep" | cut -d '@' -f 1)
          echo "🔄 Setting up symlink for $PKG_NAME..."
          
          # Create the target directory structure
          DIRNAME=$(dirname "$PKG_NAME")
          if [ "$DIRNAME" != "." ]; then
            mkdir -p "$dir/node_modules/$DIRNAME"
          else
            mkdir -p "$dir/node_modules"
          fi
          
          # Create symlink from global modules to custom node's node_modules
          ln -sf "/usr/local/lib/node_modules/$PKG_NAME" "$dir/node_modules/$PKG_NAME"
        fi
      done
    else
      echo "ℹ️ No dependencies found for $NODE_NAME"
    fi
    
    # Always ensure the node_modules directory has correct permissions
    mkdir -p "$dir/node_modules"
    chown -R node:node "$dir/node_modules" || true
  fi
done

# Fix permissions to ensure n8n can access everything
echo "🔧 Setting correct permissions..."
chown -R node:node /usr/local/lib/node_modules || true
chown -R node:node /home/node/.n8n || true

echo "✅ Dependencies updated successfully!"
`;

  fs.writeFileSync("update-container.sh", scriptContent, "utf8");
  log("Created container update script", "✅");
}

// Main functions
async function buildCustomNodesLocally() {
  log("Building custom nodes locally...", "📦");

  // Ensure custom-nodes directory exists
  if (!fs.existsSync("./custom-nodes")) {
    fs.mkdirSync("./custom-nodes", { recursive: true });
    log("Created custom-nodes directory", "✅");
  }

  const customNodeDirs = fs
    .readdirSync("./custom-nodes", { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join("./custom-nodes", dirent.name));

  let anyChanges = false;

  for (const nodeDir of customNodeDirs) {
    const packageJsonPath = path.join(nodeDir, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      log(`Processing ${nodeDir}...`, "🔨");

      // Clean node_modules to avoid permission issues
      const nodeModulesDir = path.join(nodeDir, "node_modules");
      if (fs.existsSync(nodeModulesDir)) {
        log(`Cleaning ${nodeModulesDir}...`, "🧹");
        try {
          fs.rmSync(nodeModulesDir, { recursive: true, force: true });
        } catch (error) {
          log(
            `Warning: Could not remove ${nodeModulesDir}. You might need to delete it manually.`,
            "⚠️"
          );
        }
      }

      // Execute commands from the node directory
      const currentDir = process.cwd();
      process.chdir(nodeDir);

      // Install dependencies
      try {
        executeCommand("pnpm install --no-frozen-lockfile");
        executeCommand("pnpm build");
        anyChanges = true;
      } catch (error) {
        log(`Error building custom node ${nodeDir}`, "❌");
      } finally {
        process.chdir(currentDir);
      }
    }
  }

  return anyChanges;
}

async function setupN8n() {
  log("Starting n8n setup & update...", "🌟");

  // Check if Docker is installed
  if (!dockerCommandExists()) {
    log("Docker is not installed. Please install Docker first.", "❌");
    process.exit(1);
  }

  // Check if Docker Compose is installed
  const dockerComposeCmd = dockerComposeCommandExists();
  if (!dockerComposeCmd) {
    log(
      "Docker Compose is not installed. Please install Docker Compose first.",
      "❌"
    );
    process.exit(1);
  }

  // Check if this is initial setup
  const isInitialSetup = !fs.existsSync("docker-compose.yml");
  const containerName = "n8n-for-custom-nodes";
  const containerExists = isContainerRunning(containerName);

  // If the container already exists and this is not the initial setup,
  // we can just do a quick restart after rebuilding the custom nodes
  if (!isInitialSetup && containerExists) {
    // Build custom nodes locally and check if there were any changes
    const anyChanges = await buildCustomNodesLocally();

    // If there were no changes to the custom nodes, just restart the container
    if (!anyChanges) {
      log(
        "No changes detected in custom nodes, performing quick restart...",
        "🔄"
      );
      executeCommand(`docker restart ${containerName}`);
      log("n8n with custom nodes is now ready.", "✅");
      log(`Access n8n at http://localhost:${N8N_PORT}`, "💡");
      return;
    }

    // If there were changes, continue with the normal update process
    log("Changes detected in custom nodes, performing full update...", "🔄");
  } else {
    // Initial setup flow
    if (isInitialSetup) {
      log("Initial setup detected - creating necessary files...", "📋");

      // Create docker-compose.yml
      createDockerComposeFile();

      // Create data directories
      if (!fs.existsSync("./data")) {
        fs.mkdirSync("./data", { recursive: true });
      }
      if (!fs.existsSync("./data/custom")) {
        fs.mkdirSync("./data/custom", { recursive: true });
      }
    }

    // Build custom nodes locally
    await buildCustomNodesLocally();
  }

  // Create dependency extraction script
  createDependencyExtractScript();

  // Start or ensure container is running
  if (isInitialSetup || !containerExists) {
    log("Starting n8n container...", "🚀");
    executeCommand(`${dockerComposeCmd} up -d`);

    log("Waiting for container to initialize (15 seconds)...", "⏳");
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }

  // Copy custom nodes to the container - with proper permissions handling
  log("Copying custom nodes to container...", "📂");

  // First create directories with correct permissions
  executeCommand(
    `docker exec -u root ${containerName} mkdir -p /home/node/.n8n/custom`,
    { ignoreError: true }
  );
  executeCommand(
    `docker exec -u root ${containerName} chown -R node:node /home/node/.n8n/custom`,
    { ignoreError: true }
  );

  const customNodeDirs = fs
    .readdirSync("./custom-nodes", { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join("./custom-nodes", dirent.name));

  for (const nodeDir of customNodeDirs) {
    const nodeName = path.basename(nodeDir);
    log(`Copying ${nodeName} to container...`, "📂");

    // Create a temporary directory with just the source code (no node_modules)
    const tempDir = path.join(os.tmpdir(), `n8n-custom-node-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Copy only necessary files (exclude node_modules)
    const filesToCopy = [
      "package.json",
      "tsconfig.json",
      "README.md",
      "LICENSE",
      "src",
      "dist",
      "nodes",
      "credentials",
    ];

    // Copy each file/directory if it exists
    for (const file of filesToCopy) {
      const sourcePath = path.join(nodeDir, file);
      const destPath = path.join(tempDir, file);

      if (fs.existsSync(sourcePath)) {
        if (fs.statSync(sourcePath).isDirectory()) {
          // For directories like src, dist, etc.
          fs.mkdirSync(destPath, { recursive: true });
          executeCommand(
            `robocopy "${sourcePath}" "${destPath}" /E /COPY:DAT`,
            { ignoreError: true }
          );
          // For non-Windows systems
          if (os.platform() !== "win32") {
            executeCommand(`cp -r "${sourcePath}" "${destPath}"`, {
              ignoreError: true,
            });
          }
        } else {
          // For single files
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }

    // Copy the sanitized directory to the container
    try {
      executeCommand(
        `docker cp "${tempDir}/." ${containerName}:/home/node/.n8n/custom/${nodeName}/`
      );

      // Fix permissions inside the container
      executeCommand(
        `docker exec -u root ${containerName} chown -R node:node /home/node/.n8n/custom/${nodeName}`,
        { ignoreError: true }
      );
    } catch (error) {
      log(
        `Warning: Error copying ${nodeName} to container. Will try fixing permissions and retrying.`,
        "⚠️"
      );

      // Try to fix permissions and retry one more time
      executeCommand(
        `docker exec -u root ${containerName} rm -rf /home/node/.n8n/custom/${nodeName}`,
        { ignoreError: true }
      );
      executeCommand(
        `docker exec -u root ${containerName} mkdir -p /home/node/.n8n/custom/${nodeName}`,
        { ignoreError: true }
      );
      executeCommand(
        `docker exec -u root ${containerName} chown -R node:node /home/node/.n8n/custom/${nodeName}`,
        { ignoreError: true }
      );

      try {
        executeCommand(
          `docker cp "${tempDir}/." ${containerName}:/home/node/.n8n/custom/${nodeName}/`
        );
        executeCommand(
          `docker exec -u root ${containerName} chown -R node:node /home/node/.n8n/custom/${nodeName}`,
          { ignoreError: true }
        );
      } catch (retryError) {
        log(
          `Error copying ${nodeName} to container after retry. You may need to manually copy it.`,
          "❌"
        );
      }
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      log(`Warning: Could not remove temp directory ${tempDir}`, "⚠️");
    }
  }

  // Execute the dependency update script in the container
  log("Updating dependencies inside the container...", "🔄");
  executeCommand(`docker cp update-container.sh ${containerName}:/tmp/`);
  executeCommand(
    `docker exec -u root ${containerName} sh -c "chmod +x /tmp/update-container.sh && /tmp/update-container.sh"`
  );

  // Cleanup
  fs.unlinkSync("update-container.sh");

  // Restart n8n to apply changes
  log("Restarting n8n to apply changes...", "🔄");
  executeCommand(`${dockerComposeCmd} restart`);

  log("n8n with custom nodes is now ready.", "✅");
  log(`Access n8n at http://localhost:${N8N_PORT}`, "💡");
}

// Execute the main function
setupN8n().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
