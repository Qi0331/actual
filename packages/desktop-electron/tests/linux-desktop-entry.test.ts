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
