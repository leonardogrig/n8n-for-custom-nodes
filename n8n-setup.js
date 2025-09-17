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
  const composeContent = `services:
  n8n:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: n8n-for-custom-nodes
    ports:
      - "${N8N_PORT}:5678"
    volumes:
      - ./n8n-data:/home/node/.n8n/data
    environment:
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - N8N_LOG_LEVEL=info
      - DB_SQLITE_POOL_SIZE=2
      - N8N_RUNNERS_ENABLED=true
      - N8N_USER_FOLDER=/home/node/.n8n/data
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - NODE_NO_WARNINGS=1
    restart: unless-stopped
`;

  fs.writeFileSync("docker-compose.yml", composeContent, "utf8");
  log("Created docker-compose.yml file", "✅");
}

// Dependency extraction is now handled by the Dockerfile during build

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

        // Check for duplicate nodes/nodes structure after build and fix it
        const nodesPath = path.join(nodeDir, "nodes");
        const nestedNodesPath = path.join(nodesPath, "nodes");
        if (fs.existsSync(nestedNodesPath) && fs.statSync(nestedNodesPath).isDirectory()) {
          log(`Fixing duplicate nodes/nodes structure in ${path.basename(nodeDir)}...`, "🔧");
          // Move contents from nodes/nodes to nodes
          const nestedContents = fs.readdirSync(nestedNodesPath);
          for (const item of nestedContents) {
            const itemSrc = path.join(nestedNodesPath, item);
            const itemDest = path.join(nodesPath, item);
            if (!fs.existsSync(itemDest)) {
              if (fs.statSync(itemSrc).isDirectory()) {
                fs.cpSync(itemSrc, itemDest, { recursive: true });
              } else {
                fs.copyFileSync(itemSrc, itemDest);
              }
            }
          }
          // Remove the nested nodes directory
          fs.rmSync(nestedNodesPath, { recursive: true, force: true });
        }
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

  // Ensure .env file exists (not a directory)
  if (fs.existsSync("./.env") && fs.statSync("./.env").isDirectory()) {
    log("Found .env directory, converting to file...", "🔧");
    fs.rmSync("./.env", { recursive: true, force: true });
  }
  if (!fs.existsSync("./.env")) {
    fs.writeFileSync("./.env", "", "utf8");
    log("Created .env file", "✅");
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
      if (!fs.existsSync("./n8n-data")) {
        fs.mkdirSync("./n8n-data", { recursive: true });
      }
    }

    // Build custom nodes locally
    await buildCustomNodesLocally();
  }

  // Start or ensure container is running
  if (isInitialSetup || !containerExists) {
    log("Building and starting n8n container with custom nodes...", "🚀");
    executeCommand(`${dockerComposeCmd} up -d --build`);

    log("Waiting for container to initialize (20 seconds)...", "⏳");
    await new Promise((resolve) => setTimeout(resolve, 20000));
  } else {
    log("Rebuilding container with updated custom nodes...", "🔄");
    executeCommand(`${dockerComposeCmd} down`);
    executeCommand(`${dockerComposeCmd} up -d --build`);

    log("Waiting for container to initialize (20 seconds)...", "⏳");
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }

  log("n8n with custom nodes is now ready.", "✅");
  log(`Access n8n at http://localhost:${N8N_PORT}`, "💡");
}

// Execute the main function
setupN8n().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
