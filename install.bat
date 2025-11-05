@echo off
echo Menjalankan instalasi NPM...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo Terjadi kesalahan selama npm install. Menghentikan proses.
    pause
    exit /b %ERRORLEVEL%
)

echo Instalasi NPM selesai. Menjalankan npm run dev...
call npm run dev
