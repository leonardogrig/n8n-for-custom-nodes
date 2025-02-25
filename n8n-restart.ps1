# N8n Quick Restart Script
Write-Host "🔄 n8n Quick Restart Script" -ForegroundColor Cyan

# Check if n8n container exists
$containerExists = docker ps -a --filter "name=n8n-for-custom-nodes" --format "{{.Names}}" | Select-String -Pattern "n8n-for-custom-nodes"

if (-not $containerExists) {
    Write-Host "❌ n8n container not found! Please run n8n-setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Function to build custom nodes without copying them
function Build-CustomNodes {
    Write-Host "🔨 Building custom nodes..." -ForegroundColor Yellow
    
    # Ensure custom-nodes directory exists
    if (-not (Test-Path -Path "./custom-nodes")) {
        Write-Host "❌ Custom nodes directory not found! Please run n8n-setup.ps1 first." -ForegroundColor Red
        exit 1
    }
    
    # Process each custom node directory
    Get-ChildItem -Path "./custom-nodes" -Directory | ForEach-Object {
        $nodeDir = $_.FullName
        $packageJsonPath = Join-Path -Path $nodeDir -ChildPath "package.json"
        
        if (Test-Path -Path $packageJsonPath) {
            Write-Host "🔨 Processing $($_.Name)..." -ForegroundColor Yellow
            
            # Execute commands from the node directory
            Push-Location -Path $nodeDir
            try {
                # Just build without reinstalling dependencies
                pnpm build
            } catch {
                Write-Host "❌ Error building custom node $($_.Name)" -ForegroundColor Red
                Write-Host $_.Exception.Message -ForegroundColor Red
            } finally {
                Pop-Location
            }
        }
    }
}

# Define health check function
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

# Build the custom nodes
Build-CustomNodes

# Restart the container
Write-Host "🔄 Restarting n8n container..." -ForegroundColor Yellow
docker restart n8n-for-custom-nodes

# Wait for n8n to be ready
Write-Host "⏳ Waiting for n8n to initialize (30 seconds max)..." -ForegroundColor Yellow
$healthy = Test-N8nHealth -timeoutSeconds 30

if ($healthy) {
    Write-Host "✅ n8n is now running and healthy!" -ForegroundColor Green
    Write-Host "💡 Access n8n at http://localhost:5678" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ n8n is taking longer than expected to start up." -ForegroundColor Yellow
    Write-Host "Do you want to run the full setup script to fix potential issues? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "🔧 Running full setup script..." -ForegroundColor Yellow
        & "./n8n-setup.ps1"
    } else {
        Write-Host "⚠️ n8n might not be fully operational. Check the logs with 'docker logs n8n-for-custom-nodes'" -ForegroundColor Yellow
    }
} 