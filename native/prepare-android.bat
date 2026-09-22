@echo off
REM ===========================================================================
REM  Double-click this file to get the Android project ready to build.
REM  ---------------------------------------------------------------------
REM  The committed android/ project is not standalone and cannot be: Gradle
REM  links its subprojects straight into ../node_modules through
REM  capacitor.settings.gradle, and capacitor.build.gradle applies a file
REM  from capacitor-cordova-android-plugins, which cap sync generates. So
REM  an install and a sync have to happen before Android Studio opens the
REM  folder, and this exists so that is a double-click rather than a
REM  command line.
REM ===========================================================================
setlocal
cd /d "%~dp0"

echo.
echo  ===========================================
echo   Sprout - getting Android ready
echo  ===========================================
echo.

where node >nul 2>nul
if errorlevel 1 goto nonode

echo  Node.js found:
node -v
echo.

echo  [1 of 3] Installing the wrapper's dependencies...
echo.
call npm install --no-audit --no-fund
if errorlevel 1 goto failed

echo.
echo  [2 of 3] Copying the app into the wrapper...
echo.
call node copy-web.js
if errorlevel 1 goto failed

echo.
echo  [3 of 3] Syncing Capacitor...
echo.
call npx cap sync android
if errorlevel 1 goto failed

echo.
echo  ===========================================
echo   Ready.
echo.
echo   In Android Studio choose Open, then pick
echo   exactly this folder:
echo.
echo     %~dp0android
echo.
echo   Wait for the bottom bar to stop working,
echo   then press the green Run button.
echo  ===========================================
echo.
pause
exit /b 0

:nonode
echo  Node.js is not installed on this machine, and the build needs it.
echo.
echo    1. Open https://nodejs.org
echo    2. Download the LTS installer
echo    3. Run it and accept every default
echo    4. Close this window, then double-click this file again
echo.
pause
exit /b 1

:failed
echo.
echo  ===========================================
echo   Something above failed.
echo   Scroll up, copy the error, and send it over.
echo  ===========================================
echo.
pause
exit /b 1
