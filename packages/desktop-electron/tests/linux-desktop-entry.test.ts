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

// Only the [Desktop Entry] section defines the launcher window class.
// Reject duplicate keys rather than accepting the first accidental match.
function desktopEntryValue(content: string, key: string): string {
  let inDesktopEntry = false;
  const values: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^\[[^\]]+\]$/.test(trimmed)) {
      inDesktopEntry = trimmed === '[Desktop Entry]';
      continue;
    }
    if (!inDesktopEntry || trimmed.startsWith('#')) {
      continue;
    }
    const entry = line.match(/^([A-Za-z][A-Za-z0-9-]*)=(.*)$/);
    if (entry?.[1] === key) {
      values.push(entry[2].trim());
    }
  }
  assert.equal(values.length, 1, `Expected exactly one ${key} in [Desktop Entry]`);
  return values[0];
}

test('desktop entry parser ignores other sections and comments', () => {
  const desktop = [
    '[Other]',
    'StartupWMClass=wrong',
    '[Desktop Entry]',
    '#StartupWMClass=also-wrong',
    'StartupWMClass=actual',
  ].join('\n');
  assert.equal(desktopEntryValue(desktop, 'StartupWMClass'), 'actual');
});

test('desktop entry parser rejects duplicate launcher keys', () => {
  assert.throws(
    () => desktopEntryValue('[Desktop Entry]\nStartupWMClass=actual\nStartupWMClass=Actual\n', 'StartupWMClass'),
    /exactly one/,
  );
});

// Optional packaging integration: point ACTUAL_DESKTOP_FILE at the .desktop
// file extracted from a freshly built AppImage. A config-only check cannot
// prove that electron-builder emitted the intended launcher metadata.
const builtDesktopFile = process.env.ACTUAL_DESKTOP_FILE;
test.skipIf(!builtDesktopFile)(
  'packaged Linux desktop entry uses the configured WM class',
  () => {
    const entry = readFileSync(builtDesktopFile!, 'utf8');
    assert.equal(
      desktopEntryValue(entry, 'StartupWMClass'),
      packageJson.build.linux.executableName,
    );
  },
);
