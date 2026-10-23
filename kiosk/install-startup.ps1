# Orkhon Valley app - start the kiosk automatically when this Windows user signs in.
# Creates (or with -Remove deletes) a shortcut in the user's Startup folder. ASCII-only (PowerShell 5.1).
param([switch]$Remove)

$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Orkhon Kiosk.lnk'
if ($Remove) {
    Remove-Item $lnk -ErrorAction SilentlyContinue
    Write-Host "Removed: $lnk"
    exit 0
}

$shell = New-Object -ComObject WScript.Shell
$s = $shell.CreateShortcut($lnk)
$s.TargetPath = Join-Path $PSScriptRoot 'start-kiosk.bat'
$s.WorkingDirectory = $PSScriptRoot
$s.WindowStyle = 7   # minimized
$s.Description = 'Orkhon Valley heritage app - kiosk'
$s.Save()
Write-Host "Created: $lnk"
