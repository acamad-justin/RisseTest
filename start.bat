@echo off
echo Starting Risse Profile Page (Laravel 10 + Vue 3)...
"D:\Websites\php82\php.exe" artisan config:clear
start "" "D:\Websites\php82\php.exe" artisan serve --port=8000
start "" npm run dev
echo Server started! Open http://127.0.0.1:8000 in your browser.
pause
