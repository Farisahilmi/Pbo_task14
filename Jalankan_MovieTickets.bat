@echo off
title MovieTickets Online - Application Launcher
color 0B

cls
echo ===============================================================================
echo            MEMULAI PLATFORM MOVIETICKETS ONLINE (WSL / DEV MODE)
echo ===============================================================================
echo.
echo Membersihkan port lama jika ada proses yang menggantung...
wsl --exec bash -c "fuser -k 8080/tcp 2>/dev/null; fuser -k 5173/tcp 2>/dev/null; pkill -f 'quarkus:dev' 2>/dev/null; pkill -f 'vite' 2>/dev/null; exit 0"

echo [1/3] Menjalankan server Backend Java Quarkus (Port 8080)...
start "MovieTickets Backend (Quarkus Port 8080)" wsl --exec bash -c "cd /mnt/d/Projects/MovieTickets/backend && echo '🚀 Starting Quarkus Backend...' && mvn quarkus:dev; echo ''; read -p 'Tekan Enter untuk menutup jendela ini...'"

echo [2/3] Menjalankan server Frontend Vite React (Port 5173)...
start "MovieTickets Frontend (Vite Port 5173)" wsl --exec bash -c "cd /mnt/d/Projects/MovieTickets/frontend && echo 'Menunggu Backend siap...' && while ! (echo > /dev/tcp/127.0.0.1/8080) >/dev/null 2>&1; do sleep 1; done; echo '🚀 Starting Vite Frontend...' && npm run dev -- --host 0.0.0.0 --port 5173; echo ''; read -p 'Tekan Enter untuk menutup jendela ini...'"

echo [3/3] Menunggu server siap dan membuka browser otomatis...
timeout /t 15 /nobreak > nul
start http://localhost:5173

echo.
echo ===============================================================================
echo  BERHASIL! Aplikasi MovieTickets sedang berjalan di dua jendela terpisah.
echo.
echo  - Frontend Web      : http://localhost:5173
echo  - Backend API       : http://localhost:8080
echo  - Swagger OpenAPI   : http://localhost:8080/q/swagger-ui
echo  - Admin Panel       : http://localhost:5173/admin
echo.
echo  Akun Login Demo:
echo  - Admin    : admin@movietickets.id / admin123
echo  - Kasir    : kasir@movietickets.id / kasir123
echo  - Customer : budi@gmail.com / budi123
echo ===============================================================================
echo.
echo Catatan: Untuk menghentikan aplikasi, Anda dapat menutup kedua jendela server
echo          atau menjalankan file Hentikan_MovieTickets.bat
echo.
echo Tekan sembarang tombol untuk menutup launcher ini...
pause > nul
