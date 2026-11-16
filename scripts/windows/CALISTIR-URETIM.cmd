@echo off
cd /d "%~dp0..\.."
call pnpm build
if errorlevel 1 goto :end
call pnpm start
:end
pause
