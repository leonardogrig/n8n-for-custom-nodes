#!/bin/bash

set -e  # Exit on any error

echo "Stopping and removing the existing 'n8n' container (but not 'n8n-for-custom-nodes')..."
docker-compose down

echo "Removing all unused Docker volumes..."
docker volume prune -f

echo "Removing any dangling Docker networks..."
docker network prune -f

# Ensure ./custom-nodes exists
mkdir -p ./custom-nodes

# Save current directory
current_dir=$(pwd)

# Loop over each subdirectory in ./custom-nodes and run pnpm install & build
echo "Processing custom nodes..."
for node_dir in ./custom-nodes/*; do
  if [ -d "$node_dir" ]; then
    echo "Entering $node_dir"
    cd "$node_dir" || { echo "Failed to enter $node_dir"; exit 1; }
    
    if [ -f "package.json" ]; then
      echo "Running pnpm install in $node_dir..."
      pnpm install --no-frozen-lockfile

      echo "Running pnpm build in $node_dir..."
      pnpm build
    else
      echo "Skipping $node_dir (no package.json found)"
    fi

    cd "$current_dir" || { echo "Failed to return to $current_dir"; exit 1; }
  fi
done

cat > docker-compose.yml << 'EOF'
version: "3"
services:
  n8n:
    image: n8nio/n8n
    container_name: n8n-for-custom-nodes
    ports:
      - "5678:5678"
    volumes:
      - ./n8n-data:/home/node/.n8n
      - ./custom-nodes:/home/node/.n8n/custom
      - ./.env:/home/node/.env
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
      - DOTENV_CONFIG_PATH=/home/node/.env
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
    restart: always
EOF

echo "Pulling the latest n8n image..."
docker pull n8nio/n8n
docker image prune -f  # Remove any old or dangling images to free up space

echo "Building and starting n8n..."
docker-compose up --build --force-recreate -d

echo "Done! Access n8n at http://localhost:5678"
