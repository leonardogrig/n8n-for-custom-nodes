# n8n Custom Nodes Development Environment

This repository provides a cross-platform development environment for creating, testing, and deploying custom n8n nodes.

## Overview

This setup uses Docker to run n8n with your custom nodes, handling all dependencies and configurations automatically. The Node-based setup script works seamlessly on Windows, macOS, and Linux.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- [Node.js](https://nodejs.org/) (v16 or higher) installed
- [pnpm](https://pnpm.io/installation) package manager installed

## Getting Started

### Initial Setup

Run the setup script from the repository root using Node.js:

```bash
node n8n-setup.js
```

### Updating After Changes

After making changes to your custom nodes, rerun the same command to update your n8n installation:

```bash
node n8n-setup.js
```

## How It Works

The setup script (`node n8n-setup.js`):

1. Builds your custom nodes locally
2. Copies them to the n8n Docker container
3. Dynamically extracts and installs all dependencies from your custom nodes' package.json files
4. Sets up the necessary symlinks and permissions
5. Restarts n8n to apply changes

## Custom Nodes Development

Place your custom node packages in the `./custom-nodes/` directory:

```
./custom-nodes/
  ├── my-first-custom-node/
  │   ├── package.json
  │   ├── src/
  │   └── ...
  └── my-second-custom-node/
      ├── package.json
      └── ...
```

Each custom node package should follow the [n8n custom node structure](https://docs.n8n.io/integrations/creating-nodes/build/create-first-node/).

## Access n8n

After running the setup script, access n8n at:

http://localhost:5678

## Troubleshooting

### Permission Issues

- If you encounter permission issues, rerun `node n8n-setup.js` so it can clean and rebuild permissions
- If `node_modules` directories cause problems, the script automatically removes and recreates them during each run

### Container Issues

- To check container logs: `docker logs n8n-for-custom-nodes`
- To restart the container: `docker-compose restart`
- To rebuild from scratch: `docker-compose down && docker-compose up -d`

## Development Tips

1. Make changes to your custom nodes in the `./custom-nodes/` directory
2. Run `node n8n-setup.js` to apply changes
3. Test your changes in the n8n UI
4. Repeat until satisfied

## Important Notes

- The setup handles dependencies dynamically, extracting them from your package.json files
- Global dependencies are installed in the container and symlinked to your node's node_modules
- Node modules are cleaned and rebuilt to avoid permission issues
