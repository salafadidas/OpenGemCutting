import test from 'node:test';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { TECHNICAL_SUPPORT, createSupportDiagnostics } from './technicalSupport.js';
const environment = { version: '2.1.2', locale: 'en', userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/155.0 Edg/155.0', width: 1440, height: 900, pixelRatio: 2, webgl2: true, webgpu: false };

test('diagnostics expose only the chosen environment fields, never input payloads or raw UA', () => {
  const secret = '/private/client-design?token=secret';
  const report = createSupportDiagnostics({ ...environment, userAgent: `${environment.userAgent} ${secret}`, source: secret, document: { name: secret }, url: secret, error: secret, logs: [secret], projectId: secret });
  assert.match(report, /Browser: Edge 155/);
  assert.match(report, /OS: Windows/);
  assert.match(report, /Entry: support/);
  assert.match(report, /WebGL2 API: true; WebGPU API: false/);
  assert.doesNotMatch(report, /secret|client-design|Mozilla|NT 10/);
  assert.match(report, /does not confirm hardware acceleration/);
});

test('render-failure reports keep a safe category without serializing an error', () => {
  const report = createSupportDiagnostics({ ...environment, source: 'render-error', userAgent: '' });
  assert.match(report, /Entry: render-error/);
  assert.match(report, /Browser: Unknown/);
  assert.match(report, /OS: Unknown/);
});

test('all public support links use the official repository and the supplied QR asset is bundled', () => {
  for (const key of ['issues', 'discussions', 'releases', 'licensing', 'license', 'trademarks', 'security', 'contributing']) {
    assert.equal(new URL(TECHNICAL_SUPPORT[key]).origin, 'https://github.com');
    assert.ok(TECHNICAL_SUPPORT[key].startsWith(`${TECHNICAL_SUPPORT.repository}/`));
  }
  assert.ok(existsSync(new URL(`../../public/${TECHNICAL_SUPPORT.testGroupQr}`, import.meta.url)));
});
