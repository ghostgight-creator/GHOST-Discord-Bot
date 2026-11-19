@echo off
title Stop GHOST Bot
echo Stopping GHOST bot...
taskkill /F /FI "WINDOWTITLE eq GHOST Discord Bot" /IM node.exe >nul 2>&1
echo Bot has been stopped.
pause
