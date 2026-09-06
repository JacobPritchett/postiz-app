const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Compile the real provider with transport/base-class dependencies stubbed.
// No database, social posts, or production credentials are used by these tests.
function provider(t, { status = 'AVAILABLE', bytes = Buffer.from([255,216,255,0]), owner = 'urn:li:organization:123', storageProvider = 'cloudflare' } = {}) {
  const calls = [], tools = [], waits = [];
  const source = readFileSync('libraries/nestjs-libraries/src/integrations/social/linkedin.page.provider.ts', 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } });
  class Base {
    async uploadPicture(...args) { calls.push(['upload', ...args]); return { id: 'urn:li:image:cover123' }; }
    async fetch(...args) { calls.push(['linkedin', ...args]); return new Response(JSON.stringify({ owner, status })); }
  }
  const exports = {};
  vm.runInNewContext(compiled.outputText, {
    exports, Buffer, URL, AbortSignal,
    process: { env: { STORAGE_PROVIDER: storageProvider, CLOUDFLARE_BUCKET_URL: 'https://media.example/uploads', FRONTEND_URL: 'https://postiz.example' } },
    fetch: async (url, init) => { calls.push(['download', url.toString(), init]); return new Response(bytes); },
    require: name => {
      if (name.endsWith('/linkedin.provider')) return { LinkedinProvider: Base };
      if (name.endsWith('/tool.decorator')) return { Tool: definition => (_target, method) => { tools.push({ ...definition, method }); } };
      if (name.endsWith('/rules.description.decorator')) return { Rules: () => () => {} };
      if (name.endsWith('/plug.decorator')) return { Plug: () => () => {} };
      if (name.endsWith('/timer')) return { timer: async ms => { waits.push(ms); } };
      if (name.endsWith('/ssrf.safe.dispatcher')) return { getSsrfSafeDispatcher: () => ({}) };
      return {};
    },
  });
  return { instance: new exports.LinkedinPageProvider(), calls, tools, waits };
}
const data = { url: 'https://media.example/uploads/cover.jpg', owner: 'urn:li:organization:123' };
const connected = { disabled: false, refreshNeeded: false, deletedAt: null };

test('local storage uses the frontend upload path even when an unused bucket URL is configured', async t => {
  const { instance } = provider(t, { storageProvider: 'local' });
  const result = await instance.uploadEventCover('token', { ...data, url: 'https://postiz.example/uploads/cover.jpg' }, '123', connected);
  assert.equal(result.status, 'AVAILABLE');
  await assert.rejects(instance.uploadEventCover('token', data, '123', connected), /uploaded to Postiz/);
});

test('upload-only tool uses the connected organization and returns a ready event asset', async t => {
  const { instance, calls, tools } = provider(t);
  const result = await instance.uploadEventCover('page-token', data, '123', connected);
  assert.equal(result.assetUrn, 'urn:li:digitalmediaAsset:cover123');
  assert.equal(result.status, 'AVAILABLE'); assert.equal(result.owner, data.owner);
  assert.ok(tools.some(x => x.method === 'uploadEventCover'));
  assert.deepEqual(calls.map(x => x[0]), ['download', 'upload', 'linkedin']);
  assert.equal(calls[0][2].redirect, 'error'); assert.equal(calls[0][2].headers, undefined);
  assert.equal(calls[1][3], '123'); assert.equal(calls[1][5], 'company');
  assert.ok(calls[2][1].includes('/rest/images/'));
});

for (const url of ['http://media.example/uploads/a.jpg', 'https://evil.example/a.jpg', 'https://media.example/uploads-other/a.jpg', 'https://media.example/uploads/../private/a.jpg', 'https://user:password@media.example/uploads/a.jpg']) {
  test(`rejects untrusted media: ${url}`, async t => {
    const { instance, calls } = provider(t);
    await assert.rejects(instance.uploadEventCover('token', { ...data, url }, '123', connected));
    assert.equal(calls.length, 0);
  });
}
test('rejects a different Page or disconnected integration before network calls', async t => {
  const { instance, calls } = provider(t);
  await assert.rejects(instance.uploadEventCover('token', data, '999', connected), /owner/);
  await assert.rejects(instance.uploadEventCover('token', data, '123', { ...connected, disabled: true }), /Reconnect/);
  assert.equal(calls.length, 0);
});
test('rejects non-image content and oversized streams', async t => {
  for (const bytes of [Buffer.from('<html>error</html>'), Buffer.alloc(10 * 1024 * 1024 + 1)]) {
    const { instance, calls } = provider(t, { bytes });
    await assert.rejects(instance.uploadEventCover('token', data, '123', connected));
    assert.equal(calls.length, 1);
  }
});
test('processing failures are not reported as a usable cover', async t => {
  const { instance } = provider(t, { status: 'PROCESSING_FAILED' });
  await assert.rejects(instance.uploadEventCover('token', data, '123', connected), /could not process/);
});
test('processing polling is bounded', async t => {
  const { instance, calls, waits } = provider(t, { status: 'PROCESSING' });
  await assert.rejects(instance.uploadEventCover('token', data, '123', connected), /still processing/);
  assert.equal(waits.length, 9); assert.equal(calls.filter(c => c[0] === 'linkedin').length, 10);
});
test('verifies the owner in LinkedIn readback', async t => {
  const { instance } = provider(t, { owner: 'urn:li:organization:999' });
  await assert.rejects(instance.uploadEventCover('token', data, '123', connected), /owner mismatch/);
});
