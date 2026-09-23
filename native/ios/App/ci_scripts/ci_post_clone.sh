#!/bin/sh
# ===========================================================================
#  Xcode Cloud runs this after cloning, before it resolves dependencies.
#  ---------------------------------------------------------------------
#  The committed ios/ project is not standalone, for the same reason the
#  Android one is not: Capacitor links it into ../../node_modules and the
#  web assets in App/App/public are generated and git-ignored. A clean
#  checkout has neither, so a build without this script fails on a missing
#  Pods directory, or — worse — succeeds and ships an empty WebView.
#
#  Xcode Cloud looks for ci_scripts/ beside the .xcodeproj, which is why
#  this sits in native/ios/App/ rather than at the repository root.
#
#  set -e, because a half-prepared checkout that still builds is the thing
#  this exists to prevent.
# ===========================================================================
set -e

echo "--- Preparing the Capacitor wrapper"

# Xcode Cloud's image has Homebrew and CocoaPods but not Node. Installing it
# here rather than assuming it, because the image contents change and a
# missing node is a clearer failure than a mystery one later.
if ! command -v node >/dev/null 2>&1; then
  echo "--- Installing Node"
  brew install node
fi
echo "    node $(node -v)"

# CI_PRIMARY_REPOSITORY_PATH is the repository root, set by Xcode Cloud.
# Falling back to a path relative to this script keeps the file runnable by
# hand on a Mac, which is the only way to debug it without burning a build.
ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../../../.." && pwd)}"
cd "$ROOT/native"
echo "    working in $(pwd)"

echo "--- Installing the wrapper's dependencies"
npm ci --no-audit --no-fund

echo "--- Copying the app into the wrapper"
node copy-web.js

echo "--- Syncing Capacitor"
npx cap sync ios

echo "--- Ready"
