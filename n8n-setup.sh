#!/bin/bash

echo "🌟 Running n8n Setup & Update Script 🌟"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in your PATH. Please install Node.js first."
    exit 1
fi

# Run the JavaScript script
echo "🚀 Starting setup process..."
node n8n-setup.js

echo "✅ Setup completed!" 