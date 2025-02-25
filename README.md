# n8n Custom Nodes Testing Environment

This project provides an easy way to test custom n8n nodes locally using Docker. It simplifies the process of setting up a local n8n instance and testing your custom nodes without complex configuration.

[![YouTube Channel](https://img.shields.io/badge/YouTube-@leonardogrig-red)](https://youtube.com/@leonardogrig)

## Overview

This environment allows you to:

- Quickly set up a local n8n instance using Docker
- Test your custom n8n nodes in a controlled environment
- Easily update and rebuild your custom nodes as you develop them
- Use a pre-configured environment with sensible defaults

## Prerequisites

Before you begin, you need to install:

1. Docker and Docker Compose
2. pnpm (via npm)

### Installing Docker

#### Windows

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. During installation, enable WSL 2 if prompted
3. After installation, start Docker Desktop

#### macOS

1. Install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. Choose the appropriate version for your Mac (Intel or Apple Silicon)
3. After installation, start Docker Desktop

#### Linux

1. Install Docker using your distribution's package manager:

   For Ubuntu/Debian:

   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```

   For Fedora/RHEL:

   ```bash
   sudo dnf install docker docker-compose
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```

2. Log out and log back in for the group changes to take effect

### Installing pnpm

#### Windows (using Chocolatey, NVM, and npm)

1. Install Chocolatey (Windows package manager):

   - Open PowerShell as Administrator and run:

   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. Install NVM for Windows using Chocolatey:

   ```powershell
   choco install nvm
   ```

3. Install Node.js using NVM:

   ```powershell
   nvm install latest
   nvm use latest
   ```

4. Install pnpm globally:
   ```powershell
   npm install -g pnpm
   ```

#### macOS and Linux

1. Install NVM:

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   ```

2. Install Node.js using NVM:

   ```bash
   nvm install --lts
   nvm use --lts
   ```

3. Install pnpm globally:
   ```bash
   npm install -g pnpm
   ```

## Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/yourusername/n8n-for-custom-nodes.git
cd n8n-for-custom-nodes
```

### 2. Place your custom nodes in the `custom-nodes` directory

Each custom node should be in its own directory inside the `custom-nodes` folder:

```
custom-nodes/
  ├── my-first-node/
  │   ├── package.json
  │   ├── src/
  │   └── ...
  ├── my-second-node/
  │   ├── package.json
  │   ├── src/
  │   └── ...
  └── ...
```

### 3. Set up n8n

Run the setup script to create and start the n8n Docker container:

```bash
./setup-n8n.sh
```

This script:

- Stops and removes any existing n8n container
- Cleans up Docker volumes
- Creates a new docker-compose.yml file
- Starts n8n in a Docker container

### 4. Build your custom nodes

Run the update script to install dependencies and build all custom nodes:

```bash
./custom-nodes-update.sh
```

This script:

- Enters each directory in `custom-nodes/`
- Runs `pnpm install` to install dependencies
- Runs `pnpm build` to build the node
- Restarts the n8n container to apply changes

### 5. Access n8n

Once the setup is complete, you can access n8n at:

```
http://localhost:5678
```

Default login credentials (configured in .env):

- Username: admin
- Password: supersecurepassword

## Updating Custom Nodes

Whenever you make changes to your custom nodes:

1. Save your changes in the appropriate directory under `custom-nodes/`
2. Run the update script to rebuild and apply changes:
   ```bash
   ./custom-nodes-update.sh
   ```
3. Refresh your n8n browser window to see the changes

## Environment Configuration

The project includes a `.env` file that is passed to the n8n instance. This file contains:

```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=supersecurepassword
WEBHOOK_URL=http://localhost:5678/
```

You can modify these values to change the authentication settings or other n8n configurations.

## Project Structure

```
n8n-for-custom-nodes/
  ├── .env                     # Environment variables for n8n
  ├── custom-nodes/            # Directory for your custom nodes
  ├── custom-nodes-update.sh   # Script to build custom nodes
  ├── docker-compose.yml       # Docker Compose configuration
  ├── Dockerfile               # Docker image configuration
  ├── n8n-data/                # Persistent n8n data
  └── setup-n8n.sh             # Script to set up n8n
```

## Troubleshooting

### Docker Issues

- **Docker container not starting**: Make sure Docker is running on your system
- **Port conflicts**: If port 5678 is already in use, modify the port mapping in `docker-compose.yml`

### Custom Node Issues

- **Node not appearing in n8n**: Make sure the node is properly built and the n8n container has been restarted
- **Build errors**: Check the output of `custom-nodes-update.sh` for specific error messages

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Creating n8n Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [Docker Documentation](https://docs.docker.com/)
- [YouTube Channel: @leonardogrig](https://youtube.com/@leonardogrig) - For more tutorials and information about this project

## License

This project is licensed under the MIT License - see the LICENSE file for details.
