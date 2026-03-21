#!/usr/bin/env bash
# Snippet to add to your onebox.sh / dev startup script.
#
# Syncs the manifest.xml into the Office wef folder so PowerPoint
# picks up changes automatically during development.
#
# ADAPT: update the manifest path if yours lives elsewhere.
# ADAPT: update the manifest filename in WEF_DIR if desired.
#
# After syncing, PowerPoint must be fully quit (Cmd+Q) and relaunched
# to pick up manifest changes. A simple window close is not enough.

# Keep PowerPoint manifest up to date during dev
if [ "$(uname -s)" = "Darwin" ]; then
  WEF_DIR="$HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"
  mkdir -p "$WEF_DIR"
  # ADAPT: update source path and destination filename to match your add-in
  cp "$SCRIPT_DIR/ui/addin/manifest.xml" "$WEF_DIR/XXXXXXXX-manifest.xml"
  echo "Office Add-in manifest synced to wef folder"
  echo "  Note: restart PowerPoint (Cmd+Q then relaunch) if debugging the add-in"
fi
