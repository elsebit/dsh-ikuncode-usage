import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('project files do not embed machine-specific paths', () => {
  const root = resolve(import.meta.dirname, '..');
  function inspect(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules'].includes(entry.name) || entry.name.endsWith('.tgz')) continue;
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) inspect(path);
      else {
        const content = readFileSync(path, 'utf8');
        assert.equal(/[A-Z]:\\(?:Users|OneDrive)\\/i.test(content), false, entry.name);
      }
    }
  }
  inspect(root);
});
