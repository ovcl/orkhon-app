@echo off
rem Orkhon Valley app - stop kiosk
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-kiosk.ps1" %*
pause
