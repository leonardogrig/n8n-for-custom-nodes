@echo off
echo 🌟 Running n8n Setup & Update Script 🌟

:: Check if Node.js is installed
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js is not installed or not in your PATH. Please install Node.js first.
  exit /b 1
)

:: Run the JavaScript script
echo 🚀 Starting setup process...
node n8n-setup.js

echo ✅ Setup completed! 