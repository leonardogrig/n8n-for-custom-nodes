#!/bin/bash

# Stop and remove existing container
echo "Stopping and removing existing n8n container..."
docker-compose down

# Clean up volumes - optional step
echo "Cleaning up Docker volumes..."
docker volume prune -f

# Use the default docker-compose.yml - don't try to build a custom image
cat > docker-compose.yml << 'EOF'
version: "3"
services:
  n8n:
    image: n8nio/n8n
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

# Start n8n without trying to build
echo "Starting n8n..."
docker-compose up -d

echo "Done! Access n8n at http://localhost:5678"