@echo off
cd /d "%~dp0"
node tools/pnpm/dist/pnpm.mjs build
if errorlevel 1 goto :end
node tools/pnpm/dist/pnpm.mjs start
:end
pause
