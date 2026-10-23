# Orkhon Valley app - stop the kiosk (browser + local server). ASCII-only (PowerShell 5.1).
param([int]$Port = 3000)

New-Item -ItemType File -Force (Join-Path $PSScriptRoot 'STOP') | Out-Null

# Kiosk browser windows (only the dedicated OrkhonKiosk profile, not the user's own browser)
Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*OrkhonKiosk*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Local server listening on the kiosk port
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host 'Kiosk stopped.'
