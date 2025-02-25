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

# Define functions for error handling
function Test-N8nHealth {
    param (
        [int]$timeoutSeconds = 30
    )
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($timeoutSeconds)
    
    while ((Get-Date) -lt $endTime) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            # Wait a bit before retrying
            Start-Sleep -Seconds 2
        }
    }
    
    return $false
}

function Restart-N8nContainer {
    Write-Host "🔄 Attempting to restart the n8n container..." -ForegroundColor Yellow
    docker restart n8n-for-custom-nodes
    
    Write-Host "⏳ Waiting for n8n to initialize (30 seconds)..." -ForegroundColor Yellow
    $healthy = Test-N8nHealth -timeoutSeconds 30
    
    if (-not $healthy) {
        Write-Host "⚠️ n8n container is still not responding. Attempting to recreate it..." -ForegroundColor Yellow
        docker-compose down
        docker-compose up -d
        
        Write-Host "⏳ Waiting for container to initialize after recreation (45 seconds)..." -ForegroundColor Yellow
        $healthy = Test-N8nHealth -timeoutSeconds 45
        
        if (-not $healthy) {
            Write-Host "❌ Failed to start n8n container properly. Please check the logs with 'docker logs n8n-for-custom-nodes'." -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "✅ n8n container is healthy and responding!" -ForegroundColor Green
}

# Run the JavaScript script
Write-Host "🚀 Starting setup process..." -ForegroundColor Yellow
node n8n-setup.js

# If the container is running but n8n is not responsive, restart it
if ((docker ps -q -f name=n8n-for-custom-nodes) -and -not (Test-N8nHealth -timeoutSeconds 5)) {
    Write-Host "⚠️ n8n is running but not responding. Attempting recovery..." -ForegroundColor Yellow
    Restart-N8nContainer
}

# Done
Write-Host "✅ Setup completed!" -ForegroundColor Green
Write-Host "💡 Access n8n at http://localhost:5678" -ForegroundColor Cyan 