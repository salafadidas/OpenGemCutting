import { useMemo, useState } from 'react';
import { t } from '../i18n/locale.js';
import { inspectSize } from '../application/sizeWeight.js';
import { calculateSize, MATERIAL_SG } from '../domain/sizeWeight.js';
import { SizeDiagram } from './SizeDiagram.jsx';
import { evaluateDocument } from '../domain/documentGeometry.js';
import { Modal } from './Modal.jsx';
import './size-weight.css';

export const dimensionText = (n, digits = 3) => n == null ? '—' : n !== 0 && Math.abs(n) < 10 ** -digits ? `${n < 0 ? '−' : ''}<${(10 ** -digits).toFixed(digits)}` : n.toFixed(digits);
const bases = [['width', '成品宽度 W'], ['length', '成品长度 L'], ['crown', '冠高 C'], ['pavilion', '亭深 P'], ['height', '总高 H'], ['weight', '目标重量']];
const ratios = [['lengthWidth', 'L/W'], ['pavilionWidth', 'P/W'], ['crownWidth', 'C/W'], ['pavilionCrown', 'P/C'], ['tableLengthWidth', 'T/W'], ['tableWidthWidth', 'U/W'], ['volumeWidth3', 'V/W³'], ['heightWidth', 'H/W']];
export function SizeWeightDialog({ document, canApply, blockedReason, onApply, onClose, onMachining, draft }) {
  const data = useMemo(() => inspectSize(document), [document]);
  const solid = useMemo(() => evaluateDocument(document), [document]);
  const [basis, setBasis] = useState(draft?.basis ?? 'width');
  const [value, setValue] = useState(draft?.value ?? String(data.physical?.width ?? 10));
  const [material, setMaterial] = useState(draft?.material ?? document.metadata?.sizeWeight?.material ?? '石英');
  const [sg, setSg] = useState(draft?.sg ?? String(document.metadata?.sizeWeight?.sg ?? 2.65));
  const [girdleUnit, setGirdleUnit] = useState(draft?.girdleUnit ?? 'mm');
  const [custom, setCustom] = useState(draft?.custom ?? !MATERIAL_SG.some(([name]) => name === material));
  const [error, setError] = useState('');
  let result, problem = '';
  try { result = calculateSize(data.measures, { basis, value: Number(value), sg: Number(sg) }); } catch (e) { problem = e.message; }
  const source = document.stock?.source?.millimetersPerModelUnit;
  const locked = Boolean(source && result && Math.abs(source - result.scale) > source * 1e-10);
  const changeBasis = next => { if (result?.[next] > 0) setValue(String(result[next])); setBasis(next); setError(''); };
  const apply = () => { try { onApply({ basis, value: Number(value), sg: Number(sg), material }); } catch (e) { setError(e.message); } };
  const measureRow = (label, key, unit = 'mm') => <div><dt>{t(label)}</dt><dd>{dimensionText(result?.[key])} {unit}</dd></div>;
  return <Modal title={t('尺寸与重量')} className="size-weight-dialog" onClose={onClose} closeLabel={t('返回工作台')} footerActions={<button className="primary-action modal-button" disabled={!result || !canApply || locked || !material.trim()} onClick={apply}>{t('采用此尺寸')}</button>}>
    <p className="size-scope">{t('读取完整已保存设计，包含临时隐藏层；未保存的预览不参与。')}</p>
    <div className="size-columns"><section><div className="size-previews"><figure><SizeDiagram solid={solid} view="top" horizontal={`L ${dimensionText(result?.length)} mm`} vertical={`W ${dimensionText(result?.width)} mm`} label={t('成品顶视图')} /><figcaption>{t('L 沿 X · W 沿 Y')} · {dimensionText(result?.length)} × {dimensionText(result?.width)} mm</figcaption></figure><figure><SizeDiagram solid={solid} view="side" horizontal={`W ${dimensionText(result?.width)} mm`} vertical={`H ${dimensionText(result?.height)} mm`} label={t('成品侧视图')} /><figcaption>H {dimensionText(result?.height)} mm</figcaption></figure></div>
      <h3>{t('设计比例')}</h3><dl className="size-ratios">{ratios.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{dimensionText(data.measures.ratios[key])}</dd></div>)}</dl>
      <p className="size-note">{t('T 是台面沿 L 的尺寸，U 是台面沿 W 的尺寸；两个比例的分母均为成品 W。')}</p>
      {data.measures.girdleStatus === 'missing' && <p className="size-notice">{t('没有有效腰面，冠高、亭深和腰厚不作估算；外包尺寸与体积仍可换算。')}</p>}
      {data.measures.girdleStatus === 'uneven' && <p className="size-notice">{t('腰线有高差：C/P 以腰部最高上沿／最低下沿计，G 为腰部包络厚度。')}<br />{t('腰线上／下沿高差')}：{dimensionText(result ? data.measures.girdleSpread.top * result.scale : null)} / {dimensionText(result ? data.measures.girdleSpread.bottom * result.scale : null)} mm</p>}
    </section><section><label className="size-field">{t('换算基准')}<select value={basis} onChange={e=>changeBasis(e.target.value)}>{bases.map(([k,label])=><option key={k} value={k} disabled={k !== 'weight' && !(data.measures[k] > 0)}>{t(label)}</option>)}</select></label>
      <label className="size-field">{t('目标值')}<span><input aria-label={t('目标值')} type="number" min="0" step="any" value={value} onChange={e=>setValue(e.target.value)} /> {basis === 'weight' ? 'ct' : 'mm'}</span></label>
      <label className="size-field">{t('材质')}<select value={custom ? 'custom' : material} onChange={e=>{ const m=MATERIAL_SG.find(([name])=>name===e.target.value); setCustom(!m); setMaterial(m?.[0] ?? ''); if(m)setSg(String(m[1])); }}>{MATERIAL_SG.map(([name])=><option key={name} value={name}>{t(name)}</option>)}<option value="custom">{t('自定义')}</option></select></label>
      {custom && <label className="size-field">{t('材质名称')}<input value={material} maxLength={200} onChange={e => setMaterial(e.target.value)} placeholder={t('例如：尖晶石')} /></label>}
      <label className="size-field">{t('比重 SG')}<input type="number" min="0" step="any" value={sg} onChange={e=>setSg(e.target.value)} /></label>
      <dl className="size-results">{measureRow('成品长度 L','length')}{measureRow('成品宽度 W','width')}{measureRow('冠高 C','crown')}{measureRow('亭深 P','pavilion')}<div><dt>{t('腰厚 G')} <select aria-label={t('腰厚单位')} value={girdleUnit} onChange={e=>setGirdleUnit(e.target.value)}><option value="mm">mm</option><option value="percent">%W</option></select></dt><dd>{dimensionText(girdleUnit==='mm'?result?.girdle:result?.girdle==null?null:100*result.girdle/result.width)} {girdleUnit==='mm'?'mm':'%W'}</dd></div>{measureRow('总高 H','height')}{measureRow('台面长 T','tableLength')}{measureRow('台面宽 U','tableWidth')}{measureRow('体积','volume','mm³')}<div className="size-weight-result"><dt>{t('估算成品重量')}</dt><dd>{dimensionText(result?.weight,2)} ct</dd></div></dl>
    </section></div>
    {(problem || error) && <p role="alert" className="size-notice">{t(problem || error)}</p>}
    <p className="size-notice">{t(locked ? '此原石已有真实毫米尺度；其他尺寸仅供试算，不能覆盖原石标定。' : !canApply ? blockedReason : '当前为等比例试算；采用后保存毫米尺度与材质，可撤销。角度、分度与造型不变。')}</p>
    <p className="size-note">{t('比重预设仅作估算，可按实测修改；未提供真实原石重量，不计算出成率。')} <button type="button" className="secondary-button size-tool-button" onClick={() => onMachining({ basis, value, material, sg, girdleUnit, custom })}>{t('查看已采用尺寸的加工读数')}</button></p>
  </Modal>;
}
