import { useMemo, useState } from 'react';
import { t, getLocale } from '../i18n/locale.js';
import { MATERIAL_SG } from '../domain/sizeWeight.js';
import { inspectSize } from '../application/sizeWeight.js';
import { displayIndex } from '../domain/faceting.js';
import { GeometryDatumDiagram } from './GeometryDatumDiagram.jsx';
import { Modal } from './Modal.jsx';
import { dimensionText as fmt } from './SizeWeightDialog.jsx';
import './size-weight.css';

export function MachiningDialog({ document, onClose, onSize, onSelectFacet, hasTrial }) {
  const { machining: report, physical, material } = useMemo(() => inspectSize(document), [document]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const { downloadMachiningReport } = await import('../report/machiningReport.js');
      await downloadMachiningReport(document, getLocale());
      setMessage('加工表已导出。');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <Modal title={t('加工读数')} className="machining-dialog" onClose={onClose} closeLabel={t('返回工作台')} footerActions={<button className="primary-action modal-button" disabled={busy} onClick={download}>{t(busy ? '正在生成…' : '导出加工表 PDF')}</button>}>
    <p className="size-scope">{t('只列完整已保存实体的最终有效平面刻面；不含草稿、已覆切面及凹切工序。')}</p>
    {physical && <div className="machining-saved-size"><strong>{t('已采用尺寸 · 本表与 PDF 的计算基准')}</strong><span>L {fmt(physical.length)} × W {fmt(physical.width)} × H {fmt(physical.height)} mm</span><span>{MATERIAL_SG.some(([name]) => name === material) ? t(material) : material} · SG {physical.sg}</span></div>}
    {hasTrial && <p className="size-note">{t('试算输入已保留，返回尺寸面板可继续；本表仍使用已采用尺寸。')}</p>}
    <details className="machining-datum" open><summary>{t('几何读数如何测量')}</summary><GeometryDatumDiagram /><p className="size-note">{t(report.note)}</p></details>
    {!report.scale && <p className="size-notice">{t('先采用成品毫米尺寸，才能显示毫米几何读数。')}</p>}
    <div className="machining-actions"><button type="button" className="secondary-button size-tool-button" onClick={onSize}>{t('尺寸与重量')}</button>{onSelectFacet && <button type="button" className="secondary-button size-tool-button" disabled={!selected} onClick={() => onSelectFacet(selected)}>{t('在切割助手查看此面')}</button>}</div>
    <div className="machining-table-wrap"><table className="machining-table"><thead><tr><th>{t('刻面')}</th><th>{t('行业角')}</th><th>{t('设计分度')}</th><th>{t('法向切入 mm')}</th><th>{t('平面偏移 mm')}</th></tr></thead><tbody>{report.rows.map(row => <tr key={row.facetId} className={selected === row.facetId ? 'is-selected' : ''}><td><button type="button" className="machining-facet-button" onClick={() => setSelected(row.facetId)} aria-pressed={selected === row.facetId}>{row.patternName} · {displayIndex(row.index, row.indexTeeth)}</button></td><td>{fmt(row.industryAngleDeg, 2)}°</td><td>{displayIndex(row.index, row.indexTeeth)} / {row.indexTeeth}</td><td>{fmt(row.normalDepthMm)}</td><td>{fmt(row.planeOffsetMm)}</td></tr>)}</tbody></table></div>
    {!report.rows.length && <p>{t('当前没有最终有效平面刻面。')}</p>}
    {message && <p role="status" className="size-notice">{t(message)}</p>}
    <p className="size-note">{t('导出使用已保存的尺寸；尺寸面板中的试算不会改变本表。')}</p>
  </Modal>;
}
