import { MATERIAL_SG } from '../domain/sizeWeight.js';
import { inspectSize } from '../application/sizeWeight.js';
import { displayIndex } from '../domain/faceting.js';
import { createTranslator } from '../i18n/format.js';
import { downloadBlob } from '../utils/download.js';
import { safeFileStem } from '../utils/format.js';
import { reportAssetUrl, cjkFontFeatures } from './pdfReport.js';

const fmt = value => value == null ? '—' : value.toFixed(3);
// This is also the text source for PDF regression tests; index precision is
// deliberately independent of the millimeter formatting.
export function createMachiningReportModel(document, locale = 'zh-CN') {
  const t = createTranslator(locale);
  const data = inspectSize(document), { physical: p, machining: m } = data;
  const summary = [document.name, t('完整已保存设计 · 最终有效平面刻面')];
  if (p) summary.push(
    `${t('已采用尺寸')} · L ${fmt(p.length)}  W ${fmt(p.width)}  H ${fmt(p.height)} mm`,
    `C ${fmt(p.crown)}  P ${fmt(p.pavilion)}  G ${fmt(p.girdle)} mm`,
    `T ${fmt(p.tableLength)}  U ${fmt(p.tableWidth)} mm · V ${fmt(p.volume)} mm³`,
    `${MATERIAL_SG.some(([name]) => name === data.material) ? t(data.material) : data.material} · SG ${p.sg} · ${t('估算成品重量')} ${fmt(p.weight)} ct`,
  );
  else summary.push(t('先采用成品毫米尺寸，才能显示毫米几何读数。'));
  if (data.measures.girdleStatus === 'uneven') summary.push(t('腰线不平齐：冠高、亭深与腰厚采用腰线包络。'));
  summary.push(t(m.note));
  return { title: t('加工读数'), summary, rows: m.rows.map(r => ({
    index: displayIndex(r.index, r.indexTeeth),
    heading: `${r.patternName} · ${r.industryAngleDeg.toFixed(2)}° · ${t('设计分度')} ${displayIndex(r.index, r.indexTeeth)} / ${r.indexTeeth}`,
    readings: `${t('法向切入 mm')} ${fmt(r.normalDepthMm)} · ${t('平面偏移 mm')} ${fmt(r.planeOffsetMm)}`,
  })) };
}

export async function createMachiningReportBytes(document, fontBytes, locale = 'zh-CN') {
  const t = createTranslator(locale), model = createMachiningReportModel(document, locale);
  const [{ PDFDocument, rgb }, fontkit] = await Promise.all([import('pdf-lib'), import('@pdf-lib/fontkit')]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit.default ?? fontkit);
  const font = await pdf.embedFont(fontBytes, { features: cjkFontFeatures() });
  let page, y;
  const text = (value, x = 36, size = 10) => page.drawText(String(value), { x, y, font, size, color: rgb(.1, .1, .1) });
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]); y = 800;
    text(`SUVA · ${model.title}`, 36, 16); y -= 24;
    text(t('第 {0} 页', [pdf.getPageCount()]), 470, 9); y -= 18;
  };
  const ensure = () => { if (y < 50) newPage(); };
  const line = value => {
    let run = '';
    for (const token of String(value).match(/[A-Za-z0-9]+(?:[.,'-][A-Za-z0-9]+)*|\s+|./gu) ?? []) {
      if (font.widthOfTextAtSize(run + token, 10) > 520 && run) { ensure(); text(run.trimEnd()); y -= 17; run = ''; }
      // Long identifiers may exceed one line even on their own.
      for (const c of token) {
        if (font.widthOfTextAtSize(run + c, 10) > 520) { ensure(); text(run); y -= 17; run = ''; }
        if (run || c.trim()) run += c;
      }
    }
    ensure(); text(run); y -= 17;
  };
  newPage(); model.summary.forEach(line);
  for (const row of model.rows) {
    if (y < 95) newPage();
    line(row.heading); line(row.readings); y -= 6;
  }
  pdf.setTitle(`${document.name} · ${model.title}`);
  return pdf.save();
}
export async function downloadMachiningReport(document, locale = 'zh-CN') {
  const t = createTranslator(locale);
  const response = await fetch(reportAssetUrl('fonts/NotoSerifSC-Light.ttf'));
  if (!response.ok) throw new Error(t('报告字体加载失败。'));
  const bytes = await createMachiningReportBytes(document, await response.arrayBuffer(), locale);
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${safeFileStem(document.name)}-${t('加工读数')}.pdf`);
}
