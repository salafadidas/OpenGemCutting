// Public support destinations and identity, independent of UI and design data.
const repository = 'https://github.com/yuyou-dev/OpenGemCutting';
export const TECHNICAL_SUPPORT = Object.freeze({
  brand: 'SUVA',
  team: '地质大学博士说AI · 苏哇科技',
  repository,
  issues: `${repository}/issues/new?template=bug_report.yml`,
  discussions: `${repository}/discussions`,
  releases: `${repository}/releases`,
  licensing: `${repository}/blob/main/docs/legal/LICENSING.md`,
  license: `${repository}/blob/main/LICENSE`,
  trademarks: `${repository}/blob/main/docs/legal/TRADEMARKS.md`,
  security: `${repository}/blob/main/.github/SECURITY.md`,
  contributing: `${repository}/blob/main/.github/CONTRIBUTING.md`,
  // Original QR supplied in the public repository README.
  testGroupQr: 'community/wecom-open-source-group.jpg',
});

// Deliberate allowlist: no URL, project/document, raw error, storage or full UA.
export function createSupportDiagnostics({ version, locale, userAgent = '', width, height, pixelRatio, webgl2, webgpu, source = 'support' }) {
  const browser = [['Edge', /Edg\/(\d+)/], ['Firefox', /Firefox\/(\d+)/], ['Chrome', /Chrome\/(\d+)/], ['Safari', /Version\/(\d+).*Safari/]]
    .map(([name, expression]) => { const match = userAgent.match(expression); return match ? `${name} ${match[1]}` : null; }).find(Boolean) ?? 'Unknown';
  const os = /Android/.test(userAgent) ? 'Android' : /iPhone|iPad/.test(userAgent) ? 'iOS' : /Windows/.test(userAgent) ? 'Windows' : /Macintosh/.test(userAgent) ? 'macOS' : /Linux/.test(userAgent) ? 'Linux' : 'Unknown';
  return [
    'OpenGemCutting · support diagnostics',
    `Version: ${version}`, `Language: ${locale}`, `Browser: ${browser}`, `OS: ${os}`,
    `Viewport: ${width} × ${height}; DPR: ${pixelRatio}`,
    `WebGL2 API: ${Boolean(webgl2)}; WebGPU API: ${Boolean(webgpu)}`,
    `Entry: ${source === 'render-error' ? 'render-error' : 'support'}`,
    'API availability does not confirm hardware acceleration or rendering backend.',
    'No design files, project names, paths, URLs, logs or credentials included.',
  ].join('\n');
}
