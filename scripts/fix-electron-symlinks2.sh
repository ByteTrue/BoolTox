#!/bin/bash
# Fix Electron Framework symlinks after pnpm install

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

ELECTRON_PATH="$PROJECT_ROOT/node_modules/.pnpm/electron@38.4.0/node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Framework.framework"

if [ -d "$ELECTRON_PATH" ]; then
  echo "Fixing Electron Framework symlinks..."

  cd "$ELECTRON_PATH/Versions"
  if [ ! -L "Current" ]; then
    ln -sf A Current
    echo "  Created Versions/Current link"
  fi

  cd "$ELECTRON_PATH"
  if [ ! -L "Electron Framework" ]; then
    ln -sf "Versions/Current/Electron Framework" "Electron Framework"
    echo "  Created Electron Framework link"
  fi

  if [ ! -L "Resources" ]; then
    ln -sf "Versions/Current/Resources" "Resources"
    echo "  Created Resources link"
  fi

  echo "Electron Framework symlinks fixed successfully"
else
  echo "Electron not found, skipping fix"
fi
