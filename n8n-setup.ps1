# N8n Setup & Update PowerShell script
Write-Host "🌟 Running n8n Setup & Update Script 🌟" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Found Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in your PATH. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Run the JavaScript script
Write-Host "🚀 Starting setup process..." -ForegroundColor Yellow
node n8n-setup.js

# Done
Write-Host "✅ Setup completed!" -ForegroundColor Green 