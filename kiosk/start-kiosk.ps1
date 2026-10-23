# Orkhon Valley app - kiosk launcher (Windows).
# 1) builds the app if needed, 2) starts the local production server (hidden),
# 3) opens Edge (or Chrome) in full-screen kiosk mode, 4) re-opens the browser if it is closed.
# Stop: run stop-kiosk.bat (or create the file kiosk\STOP).
# NOTE: keep this file ASCII-only (Windows PowerShell 5.1 reads it as ANSI).

param(
    [int]$Port = 3000,
    [ValidateSet('auto', 'edge', 'chrome')][string]$Browser = 'auto',
    [double]$Scale = 0,          # 0 = auto from the screen size; e.g. 2.25 for a 1080x1920 portrait screen
    [switch]$NoWatchdog
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $PSScriptRoot 'logs'
$StopFile = Join-Path $PSScriptRoot 'STOP'
$BrowserProfile = Join-Path $env:LOCALAPPDATA 'OrkhonKiosk\browser'
$Url = "http://localhost:$Port/?kiosk=1"
New-Item -ItemType Directory -Force $LogDir | Out-Null
Remove-Item $StopFile -ErrorAction SilentlyContinue
Set-Location $Root

function Log($msg) {
    $line = "{0:yyyy-MM-dd HH:mm:ss}  {1}" -f (Get-Date), $msg
    Add-Content -Path (Join-Path $LogDir 'kiosk.log') -Value $line
}

function Test-Server {
    try { (Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch { $false }
}

# 1. Build (first run or after an update)
$distDir = if ($env:NEXT_DIST_DIR) { $env:NEXT_DIST_DIR } else { '.next' }
if (-not (Test-Path (Join-Path $Root "$distDir\BUILD_ID"))) {
    Log 'No production build found - running npm run build (this takes a few minutes)'
    & cmd /c "npm run build > `"$LogDir\build.log`" 2>&1"
    if ($LASTEXITCODE -ne 0) { Log "Build failed - see logs\build.log"; exit 1 }
}

# 2. Local server
function Start-Server {
    if (Test-Server) { return $true }
    Log "Starting server on port $Port"
    $next = Join-Path $Root 'node_modules\next\dist\bin\next'
    Start-Process -FilePath 'node' -ArgumentList "`"$next`" start -p $Port" -WorkingDirectory $Root -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogDir 'server.log') -RedirectStandardError (Join-Path $LogDir 'server.err.log') | Out-Null
    $deadline = (Get-Date).AddSeconds(90)
    while (-not (Test-Server)) {
        if ((Get-Date) -gt $deadline) { Log 'Server did not start within 90 s - see logs\server.err.log'; return $false }
        Start-Sleep -Seconds 1
    }
    Log 'Server is up'
    return $true
}
if (-not (Start-Server)) { exit 1 }

# 3. Browser
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$exe = switch ($Browser) { 'edge' { $edge } 'chrome' { $chrome } default { if ($edge) { $edge } else { $chrome } } }
if (-not $exe) { Log 'Neither Edge nor Chrome was found'; exit 1 }

# The app is a phone-width layout (max 480 CSS px). On a big kiosk screen it would look tiny,
# so the whole page is scaled like a high-DPI display: portrait -> fill the width,
# landscape -> about 900 CSS px tall.
function Get-KioskScale {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -Namespace Win32 -Name Dpi -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();' -ErrorAction SilentlyContinue
        [void][Win32.Dpi]::SetProcessDPIAware()   # physical pixels, not Windows-scaled ones
        $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $s = if ($b.Height -ge $b.Width) { $b.Width / 480 } else { $b.Height / 900 }
        Log ("Screen {0}x{1}" -f $b.Width, $b.Height)
        [math]::Round([math]::Min([double]5,[math]::Max([double]1, [double]$s)), 2)   # [double]: int overload would truncate 1.2 -> 1
    } catch { 1.0 }
}
if ($Scale -le 0) { $Scale = Get-KioskScale }
Log "Page scale $Scale"

$browserArgs = @(
    '--kiosk', $Url,
    "--user-data-dir=`"$BrowserProfile`"",
    '--no-first-run', '--no-default-browser-check',
    '--disable-pinch',                    # no page zoom by pinch (map/panorama still get touch events)
    '--overscroll-history-navigation=0',  # no swipe-back
    '--noerrdialogs', '--disable-session-crashed-bubble', '--disable-infobars',
    '--disable-features=Translate,TranslateUI',
    '--autoplay-policy=no-user-gesture-required',
    "--force-device-scale-factor=$Scale"
)
if ($exe -eq $edge) { $browserArgs += '--edge-kiosk-type=fullscreen' }

function Test-Browser {
    $p = Get-CimInstance Win32_Process -Filter "Name='$(Split-Path $exe -Leaf)'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like "*OrkhonKiosk*" }
    [bool]$p
}

do {
    if (-not (Test-Path $StopFile) -and -not (Test-Browser)) {
        Log "Opening $(Split-Path $exe -Leaf) -> $Url"
        Start-Process -FilePath $exe -ArgumentList $browserArgs | Out-Null
        Start-Sleep -Seconds 8
    }
    if ($NoWatchdog) { break }
    Start-Sleep -Seconds 5
    if (-not (Test-Path $StopFile) -and -not (Test-Server)) {
        Log 'Server stopped - restarting'
        [void](Start-Server)   # on failure: logged, retried on the next round
    }
} until (Test-Path $StopFile)
Log 'Kiosk stopped'
