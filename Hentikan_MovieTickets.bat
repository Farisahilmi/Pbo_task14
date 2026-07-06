@echo off
title MovieTickets Online - Application Stopper
color 0C

cls
echo ===============================================================================
echo             MENGHENTIKAN SERVER MOVIETICKETS (BACKEND & FRONTEND)
echo ===============================================================================
echo.
echo Sedang menghentikan proses Java Quarkus dan Node Vite di lingkungan WSL...
wsl --exec bash -c "pkill -f 'quarkus:dev' 2>/dev/null; pkill -f 'vite' 2>/dev/null; pkill -f 'java' 2>/dev/null"

echo.
echo ===============================================================================
echo SEMUA SERVER BERHASIL DIHENTIKAN!
echo Jendela proses backend dan frontend telah ditutup.
echo ===============================================================================
echo.
timeout /t 3 /nobreak > nul
