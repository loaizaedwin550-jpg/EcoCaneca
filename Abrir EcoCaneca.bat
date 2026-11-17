@echo off
rem Abre EcoCaneca en el navegador de este computador.
rem Deja esta ventana abierta mientras uses la app; al cerrarla, la app se apaga.
title EcoCaneca
cd /d "%~dp0"

where python >nul 2>nul
if not errorlevel 1 (
  python herramientas\servidor.py --abrir
  goto fin
)

where py >nul 2>nul
if not errorlevel 1 (
  py herramientas\servidor.py --abrir
  goto fin
)

echo.
echo   No encontre Python en este computador.
echo   Instalalo gratis desde https://www.python.org/downloads/
echo   (marca la casilla "Add python.exe to PATH") y vuelve a abrir este archivo.
echo.
pause
exit /b 1

:fin
if errorlevel 1 pause
