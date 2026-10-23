@echo off
rem Orkhon Valley app - start kiosk (server + full-screen browser)
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0start-kiosk.ps1" %*
