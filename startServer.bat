@echo off
setlocal
set "PORT=4174"
cd /d "%~dp0"
echo Starting PM Tools app on http://localhost:%PORT%
node app/server.js --port %PORT%
