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

REM ---------------------------------------------------------------------
REM  Pulling first, because the step most easily skipped is the one whose
REM  absence is hardest to read: the copied web assets are generated and
REM  git-ignored, so a pull without a copy, or a copy without a pull, both
REM  end in a rebuild that looks identical to the change not working.
REM ---------------------------------------------------------------------
echo  [1 of 4] Fetching the latest changes...
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo  ** git is not on PATH, so nothing was pulled. **
  echo  ** Use Git ^> Pull in Android Studio first, or this build     **
  echo  ** will be of whatever you already had.                       **
  echo.
) else (
  call git pull
  if errorlevel 1 goto pullfailed
  echo.
  echo  Now at:
  call git log --oneline -1
)
echo.

echo  [2 of 4] Installing the wrapper's dependencies...
echo.
call npm install --no-audit --no-fund
if errorlevel 1 goto failed

echo.
echo  [3 of 4] Copying the app into the wrapper...
echo.
call node copy-web.js
if errorlevel 1 goto failed

echo.
echo  [4 of 4] Syncing Capacitor...
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

:pullfailed
echo.
echo  ===========================================
echo   The pull failed, so this stopped rather
echo   than building code you did not mean to
echo   test. Scroll up for the reason - usually
echo   no network, or local edits in the way.
echo  ===========================================
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
