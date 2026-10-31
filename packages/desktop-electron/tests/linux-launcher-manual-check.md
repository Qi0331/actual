# Linux AppImage launcher / GNOME dock verification

Related issue: actualbudget/actual#9334. This is a **manual acceptance plan**, not evidence of a completed AppImage build or GNOME test. A contributor has expressed interest in this issue; do not open a competing upstream PR without confirming ownership.

## 1. Check the actual packaged desktop entry

On a Linux workstation with a freshly built Actual AppImage:

```sh
set -eu
APPIMAGE=/absolute/path/to/Actual-linux-x64.AppImage
WORKDIR=$(mktemp -d)
cd "$WORKDIR"
"$APPIMAGE" --appimage-extract >/dev/null
find squashfs-root -type f -name '*.desktop' -print
```

Inspect the **desktop file produced by the build**, not a manually written fixture. Verify that its `[Desktop Entry]` section has exactly one `StartupWMClass=actual` key. If `desktop-file-validate` is installed, run it against the extracted file. Save the AppImage filename, architecture, commit SHA, extracted desktop file, and validation output.

The optional automated integration check can be run with:

```sh
ACTUAL_DESKTOP_FILE=/absolute/path/to/extracted.desktop yarn workspace desktop-electron test
```

This command assumes workspace dependencies are installed. Record the actual exit code; do not treat a skipped integration test as a pass.

## 2. Compare the running window class

Under an X11 session, launch the **same** AppImage, then run `xprop WM_CLASS` and click the Actual window. Expected result: the reported window class includes the lowercase value `actual`, matching the desktop entry exactly. `xprop` cannot inspect native Wayland windows; an XWayland result must not be presented as a native Wayland verification.

## 3. GNOME desktop acceptance

Install or integrate the extracted launcher with the AppImage path, pin it to the GNOME dock, quit the application, and relaunch using the pinned icon. Confirm there is one grouped dock icon rather than a second generic icon. Repeat after a logout/login if GNOME cached an older launcher. Record the distribution, GNOME version, X11/Wayland session type, AppImage architecture, and screenshots or screen recording.

**Pass criteria:** the packaged desktop key matches the actual window class, the launcher validates, and the pinned launcher groups the running window. **Blocked:** no AppImage build or no Linux/GNOME environment. This document does not authorize an upstream PR; follow the project's human-review and AI disclosure rules, including GPT-6 assistance.
