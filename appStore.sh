#!/bin/zsh -f

APP="Fedistar"
APP_PATH="./src-tauri/target/universal-apple-darwin/release/bundle/macos/$APP.app"
INSTALLER_KEY="3rd Party Mac Developer Installer: Akira Fukushima (HB4N6B2YVM)"
RESULT_PATH="Fedistar.pkg"

yarn run clean
yarn run tauri build -- --target universal-apple-darwin

productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_KEY" "$RESULT_PATH"
