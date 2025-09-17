FROM n8nio/n8n

USER root

# Create the custom extensions directory
RUN mkdir -p /home/node/.n8n/custom

# Copy the entire custom node package (pre-built)
COPY ./custom-nodes/n8n-nodes-starter /home/node/.n8n/custom/n8n-nodes-starter

# Remove any node_modules to avoid conflicts
RUN rm -rf /home/node/.n8n/custom/n8n-nodes-starter/node_modules

# Set proper permissions
RUN chown -R node:node /home/node/.n8n

# Set environment to point to custom nodes
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom

USER node
WORKDIR /home/node