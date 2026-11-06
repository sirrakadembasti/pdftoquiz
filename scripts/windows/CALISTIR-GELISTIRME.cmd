@echo off
cd /d "%~dp0..\.."
node tools/pnpm/dist/pnpm.mjs dev
pause
