#!/bin/sh

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
      echo "$DEPS" | tr ' ' '\n' | while read -r dep; do
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
