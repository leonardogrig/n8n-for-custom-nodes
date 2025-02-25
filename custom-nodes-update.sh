#!/bin/bash

# Save the current working directory
current_dir=$(pwd)

echo "Processing custom nodes..."

# Loop over each subdirectory in ./custom-nodes
for node_dir in ./custom-nodes/*; do
  if [ -d "$node_dir" ]; then
    echo "Entering $node_dir"
    cd "$node_dir" || { echo "Failed to enter $node_dir"; exit 1; }
    
    echo "Running pnpm install in $node_dir..."
    pnpm i

    echo "Running pnpm build in $node_dir..."
    pnpm build

    # Return to the original directory
    cd "$current_dir" || { echo "Failed to return to $current_dir"; exit 1; }
  fi
done

echo "Restarting n8n to apply changes..."
docker-compose restart
echo "Done! Your changes should now be visible in n8n."
