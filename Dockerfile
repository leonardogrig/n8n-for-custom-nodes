FROM n8nio/n8n

# Install dependencies for custom nodes
WORKDIR /home/node/.n8n/custom
COPY ./custom-nodes /home/node/.n8n/custom/

USER root

# Environment variables for non-interactive installation
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

# Install the required package globally to ensure it's available
RUN npm install -g @mendable/firecrawl-js@1.18.2

# Ensure pnpm is available
RUN if ! command -v pnpm &> /dev/null; then npm install -g pnpm@9.1.4; else echo "pnpm is already installed"; fi

# Install dependencies and build custom nodes
RUN for dir in /home/node/.n8n/custom/*; do \
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then \
        echo "Installing dependencies in $dir"; \
        cd "$dir" && \
        # Configure pnpm and install dependencies
        pnpm config set auto-install-peers true && \
        NODE_ENV=development pnpm install --no-frozen-lockfile && \
        # Build the node
        ./node_modules/.bin/tsc && ./node_modules/.bin/gulp build:icons && \
        # Create system-level symlink for dependencies
        ln -sf "$(pwd)/node_modules" /usr/local/lib/node_modules/$(node -e "console.log(require('./package.json').name)"); \
    fi \
done

# Ensure custom nodes are properly linked
RUN ln -sf /home/node/.n8n/custom /home/node/.n8n/nodes

# Fix permissions
RUN chown -R node:node /home/node/.n8n

USER node
WORKDIR /home/node
