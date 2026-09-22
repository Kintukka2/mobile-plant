#!/bin/bash
# ===========================================================================
#  Double-click this file on a Mac to get the iOS project ready to build.
#  ---------------------------------------------------------------------
#  Same reason as prepare-android.bat: the committed ios/ project links into
#  ../node_modules and needs a sync before Xcode opens it. This one also
#  runs pod install, which is the step that was skipped when the project was
#  first scaffolded on Linux.
#
#  If macOS refuses to run it, right-click the file and choose Open instead
#  of double-clicking; Gatekeeper allows it from the context menu.
# ===========================================================================
set -e
cd "$(dirname "$0")"

# A double-clicked .command runs in a Terminal window that closes the moment
# the script exits, so an error under `set -e` would vanish before it could
# be read. Hold the window open on any non-zero exit.
hold() { echo; read -n 1 -s -r -p "  Press any key to close."; echo; }
trap 'echo; echo "  Something above failed. Scroll up, copy the error, and send it over."; hold' ERR

echo
echo " ==========================================="
echo "  Sprout - getting iOS ready"
echo " ==========================================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js is not installed, and the build needs it."
  echo
  echo "    1. Open https://nodejs.org"
  echo "    2. Download the LTS installer for macOS"
  echo "    3. Run it and accept every default"
  echo "    4. Close this window, then open this file again"
  echo
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

echo "  Node.js found: $(node -v)"
echo

if ! command -v pod >/dev/null 2>&1; then
  echo "  CocoaPods is missing. Xcode needs it to build a Capacitor app."
  echo "  Install it with:  sudo gem install cocoapods"
  echo
  read -n 1 -s -r -p "  Press any key to close."
  exit 1
fi

# Pulling first, because the step most easily skipped is the one whose
# absence is hardest to read: the copied web assets are generated and
# git-ignored, so a pull without a copy, or a copy without a pull, both end
# in a rebuild that looks identical to the change not working. A failed pull
# trips the ERR trap above and stops, rather than quietly building the old
# code and letting it be mistaken for a fix that did not work.
echo "  [1 of 4] Fetching the latest changes..."
if command -v git >/dev/null 2>&1; then
  git pull
  echo
  echo "  Now at: $(git log --oneline -1)"
else
  echo
  echo "  ** git is not on PATH, so nothing was pulled. Pull in Xcode or"
  echo "  ** your editor first, or this build is of whatever you had."
fi

echo
echo "  [2 of 4] Installing the wrapper's dependencies..."
npm install --no-audit --no-fund

echo
echo "  [3 of 4] Copying the app into the wrapper..."
node copy-web.js

echo
echo "  [4 of 4] Syncing Capacitor and running pod install..."
npx cap sync ios

echo
echo " ==========================================="
echo "  Ready. Opening Xcode."
echo "  Pick your device at the top, then press Run."
echo " ==========================================="
npx cap open ios
echo
read -n 1 -s -r -p "  Press any key to close."
