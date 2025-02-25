#!/bin/bash

echo "🌟 n8n Setup & Update Script 🌟"
echo "This script handles both initial setup and updates for n8n with custom nodes"

# Check if docker-compose.yml exists to determine if this is an initial setup
INITIAL_SETUP=false
if [ ! -f "docker-compose.yml" ]; then
  INITIAL_SETUP=true
  echo "📋 Initial setup detected - creating necessary files..."
  
  # Create docker-compose.yml
  cat > docker-compose.yml << 'EOF'
version: '3'

services:
  n8n:
    container_name: n8n-for-custom-nodes
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
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
EOF

  # Create directories
  mkdir -p data
  mkdir -p data/custom
fi

# Temporarily clean node_modules to avoid permission issues on Windows
echo "🧹 Cleaning up node_modules to avoid permission issues..."
for node_dir in ./custom-nodes/*; do
  if [ -d "$node_dir" ] && [ -f "$node_dir/package.json" ]; then
    node_modules_dir="$node_dir/node_modules"
    if [ -d "$node_modules_dir" ]; then
      rm -rf "$node_modules_dir"
    fi
  fi
done

# Build custom nodes locally
echo "📦 Building custom nodes locally..."
for node_dir in ./custom-nodes/*; do
  if [ -d "$node_dir" ] && [ -f "$node_dir/package.json" ]; then
    echo "🔨 Processing $node_dir..."
    cd "$node_dir"
    pnpm install --no-frozen-lockfile
    pnpm build
    cd - > /dev/null
  fi
done

# Create dependency extraction and installation script
echo "📄 Creating dynamic dependency update script..."
cat > update-container.sh << 'EOF'
#!/bin/sh

echo "🔎 Looking for custom nodes and their dependencies..."

# Ensure directory structure exists
mkdir -p /home/node/.n8n/custom

# Process each custom node directory
for dir in /home/node/.n8n/custom/*; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    NODE_NAME=$(node -e "console.log(require('$dir/package.json').name || 'unknown')")
    echo "📦 Processing custom node: $NODE_NAME"
    
    # Extract all dependencies from package.json
    DEPS=$(node -e "const pkg = require('$dir/package.json'); console.log(Object.entries(pkg.dependencies || {}).map(([name, version]) => name + '@' + version.replace(/[^0-9.]/g, '')).join(' '))")
    
    if [ -n "$DEPS" ]; then
      echo "🔧 Installing dependencies for $NODE_NAME: $DEPS"
      npm install -g $DEPS
      
      # Create directory structure for each dependency
      echo "$DEPS" | tr ' ' '\n' | while read -r dep; do
        if [ -n "$dep" ]; then
          PKG_NAME=$(echo "$dep" | cut -d '@' -f 1)
          echo "🔄 Setting up symlink for $PKG_NAME..."
          
          # Create the target directory structure
          mkdir -p "$dir/node_modules/$(dirname "$PKG_NAME")"
          
          # Create symlink from global modules to custom node's node_modules
          ln -sf "/usr/local/lib/node_modules/$PKG_NAME" "$dir/node_modules/$PKG_NAME"
        fi
      done
    else
      echo "ℹ️ No dependencies found for $NODE_NAME"
    fi
  fi
done

# Fix permissions to ensure n8n can access everything
echo "🔧 Setting correct permissions..."
chown -R node:node /usr/local/lib/node_modules
chown -R node:node /home/node/.n8n

echo "✅ Dependencies updated successfully!"
EOF

# Synchronize custom nodes to container
echo "🔄 Synchronizing custom nodes to n8n container..."
CONTAINER_RUNNING=$(docker ps --format '{{.Names}}' | grep n8n-for-custom-nodes || echo "")

if [ "$INITIAL_SETUP" = true ] || [ -z "$CONTAINER_RUNNING" ]; then
  echo "🚀 Starting n8n container for the first time..."
  docker-compose up -d
  echo "⏳ Waiting for container to initialize (15 seconds)..."
  sleep 15
fi

# Copy custom nodes to n8n container
for node_dir in ./custom-nodes/*; do
  if [ -d "$node_dir" ]; then
    NODE_NAME=$(basename "$node_dir")
    echo "📂 Copying $NODE_NAME to container..."
    docker exec -u root n8n-for-custom-nodes mkdir -p /home/node/.n8n/custom
    docker cp "$node_dir" n8n-for-custom-nodes:/home/node/.n8n/custom/
  fi
done

# Copy and execute the dependency update script
echo "🔄 Updating dependencies inside the container..."
docker cp update-container.sh n8n-for-custom-nodes:/tmp/
docker exec -u root n8n-for-custom-nodes sh -c "chmod +x /tmp/update-container.sh && /tmp/update-container.sh"

# Cleanup
rm update-container.sh

echo "🔄 Restarting n8n to apply changes..."
docker-compose restart

echo "✅ Done! n8n with custom nodes is now ready."
echo "💡 Access n8n at http://localhost:5678"
