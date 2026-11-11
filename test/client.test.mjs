import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('client registers independent sidebar slot with host API', () => {
  let definition;
  const window = { __ModuleLoader__: { load: (d) => { definition = d; } } };
  new Function('window', readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'))(window);
  assert.equal(definition.id, '@elsebit/dsh-ikuncode-usage');
  const plugin = definition.factory(() => ({ createElement() {} }));
  const document = { createElement: () => ({ remove() {} }), head: { appendChild() {} } };
  let metadata;
  globalThis.document = document;
  try {
    plugin.apply({ effect: (fn) => fn(), slots: {
      inject: (name, fn) => { assert.equal(name, 'sidebar.footer.action'); fn(); },
      register: (meta, component) => { metadata = meta; assert.equal(typeof component, 'function'); },
    } });
    assert.equal(metadata.id, 'elsebit-ikuncode-card');
    assert.equal(metadata.label(), 'IKunCode');
  } finally { delete globalThis.document; }
});
