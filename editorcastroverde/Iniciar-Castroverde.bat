@echo off
cd /d "%~dp0"
start "" "chrome.exe" --app="%~dp0index.html" --start-maximized
