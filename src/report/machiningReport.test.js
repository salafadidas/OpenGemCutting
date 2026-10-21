import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createFacetingDocument, resolveFacetPattern, displayIndex, exportFacetingJSON, importFacetingJSON } from '../domain/faceting.js';
import { prepareSize, inspectSize } from '../application/sizeWeight.js';
import { createMachiningReportModel, createMachiningReportBytes } from './machiningReport.js';

function specimen(baseIndex = 0) {
  const doc = createFacetingDocument({ name: 'Report test', facets: resolveFacetPattern({ patternId: 'p', label: 'P1', region: 'pavilion', industryAngleDeg: 42, depth: .8, repeat: 5, baseIndex }) });
  return prepareSize(doc, { basis: 'width', value: 6.2, sg: 3.6, material: 'Spinel' }).document;
}
test('report uses the same zero and fractional index precision as the table', () => {
  for (const index of [0, 1.234567]) {
    const doc = specimen(index), report = createMachiningReportModel(doc);
    const rows = inspectSize(doc).machining.rows;
    assert.ok(rows.length > 0);
    assert.deepEqual(report.rows.map(r => r.index), rows.map(r => displayIndex(r.index, r.indexTeeth)));
    if (index === 0) assert.ok(report.rows.some(r => r.heading.includes('96 / 96')));
    else assert.ok(report.rows.some(r => String(r.index).split('.')[1]?.length > 3));
  }
});
test('custom material survives JSON and bilingual report text uses saved scale', () => {
  const doc = importFacetingJSON(exportFacetingJSON(specimen()));
  const en = createMachiningReportModel(doc, 'en'), zh = createMachiningReportModel(doc, 'zh-CN');
  assert.equal(doc.metadata.sizeWeight.material, 'Spinel');
  assert.ok(en.summary.some(s => s.includes('Spinel · SG 3.6')));
  assert.ok(en.summary.some(s => s.includes('W 6.200')));
  assert.doesNotMatch(JSON.stringify(en), /[\u3400-\u9fff]/);
  assert.ok(zh.summary.some(s => s.includes('已采用尺寸')));
});
test('English machining PDF embeds fonts and renders successfully', async () => {
  const font = await readFile(new URL('../../public/fonts/NotoSerifSC-Light.ttf', import.meta.url));
  const bytes = await createMachiningReportBytes(specimen(1.234567), font, 'en');
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
});

test('custom material names are user text even when matching a translation key', () => {
  const doc = prepareSize(specimen(), { basis: 'width', value: 6.2, sg: 3.6, material: '尖晶石' }).document;
  assert.ok(createMachiningReportModel(doc, 'en').summary.some(line => line.includes('尖晶石 · SG 3.6')));
});
