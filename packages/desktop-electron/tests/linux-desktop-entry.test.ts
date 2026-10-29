import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { test } from 'vitest';

// Read the actual electron-builder configuration instead of duplicating its
// desktop entry in a fixture. GNOME matches StartupWMClass case-sensitively.
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
  build: {
    linux: {
      executableName: string;
      desktop: { entry: { StartupWMClass: string } };
    };
  };
};

test('Linux launcher WM class matches the executable name', () => {
  const { executableName, desktop } = packageJson.build.linux;
  assert.equal(desktop.entry.StartupWMClass, executableName);
  assert.equal(executableName, 'actual');
});

// Optional packaging integration: point ACTUAL_DESKTOP_FILE at the .desktop
// file extracted from a freshly built AppImage. A config-only check cannot
// prove that electron-builder emitted the intended launcher metadata.
const builtDesktopFile = process.env.ACTUAL_DESKTOP_FILE;
test.skipIf(!builtDesktopFile)(
  'packaged Linux desktop entry uses the configured WM class',
  () => {
    const entry = readFileSync(builtDesktopFile!, 'utf8');
    assert.match(entry, /^\[Desktop Entry\]\s*$/m);
    const match = entry.match(/^StartupWMClass=(.*)\s*$/m);
    assert.equal(match?.[1].trim(), packageJson.build.linux.executableName);
  },
);
