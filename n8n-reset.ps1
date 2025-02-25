# N8n Complete Reset Script
Write-Host "⚠️ n8n Complete Reset Script ⚠️" -ForegroundColor Yellow
Write-Host "This will completely reset n8n by removing and recreating the container." -ForegroundColor Yellow
Write-Host "Your workflows and data will be preserved." -ForegroundColor Yellow
Write-Host ""

# Confirm with user
Write-Host "Are you sure you want to continue? (Y/N)" -ForegroundColor Red
$confirmation = Read-Host

if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "❌ Reset cancelled." -ForegroundColor Green
    exit 0
}

# Check if container exists
$containerExists = docker ps -a -q -f name=n8n-for-custom-nodes
if ($containerExists) {
    Write-Host "🛑 Stopping n8n container..." -ForegroundColor Yellow
    docker stop n8n-for-custom-nodes
    
    Write-Host "🗑️ Removing n8n container..." -ForegroundColor Yellow
    docker rm n8n-for-custom-nodes
} else {
    Write-Host "ℹ️ No n8n container found to remove." -ForegroundColor Cyan
}

# Run the setup script to create a fresh container
Write-Host "🔧 Running setup script to create a fresh n8n container..." -ForegroundColor Yellow
& "./n8n-setup.ps1"

Write-Host "✅ n8n has been reset and should now be operational!" -ForegroundColor Green 