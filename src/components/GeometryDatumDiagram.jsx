import { useId } from 'react';
import { t } from '../i18n/locale.js';

export function GeometryDatumDiagram() {
  const arrow = useId();
  return <figure className="geometry-datum-figure">
    <svg viewBox="0 0 600 150" role="img" aria-label={t('几何基准示意：原点到切面为平面偏移，包络支撑面到切面为法向切入')}>
      <defs><marker id={arrow} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
      <rect x="35" y="42" width="225" height="65" fill="#fff0f5" />
      <path d="M 80 35 V 120 M 260 35 V 120" stroke="#414744" fill="none" />
      <path d="M 440 35 V 120" stroke="#777" strokeDasharray="4 4" />
      <path d="M 80 78 H 535" stroke="#414744" markerEnd={`url(#${arrow})`} />
      <circle cx="80" cy="78" r="3" fill="#414744" />
      <path d="M 84 115 H 256 M 436 115 H 264" stroke="#ed225d" markerStart={`url(#${arrow})`} markerEnd={`url(#${arrow})`} />
      <g fill="#292d2b" fontSize="12" textAnchor="middle"><text x="80" y="22">{t('模型原点 O')}</text><text x="260" y="22">{t('切面')}</text><text x="440" y="22">{t('包络支撑面')}</text><text x="520" y="65">{t('外法线 n')}</text><text x="165" y="140">{t('平面偏移')}</text><text x="355" y="140">{t('法向切入')}</text></g>
    </svg>
    <figcaption>{t('测量关系示意，非当前宝石剖面。偏移可为负：切面位于原点沿外法线的反方向时取负值。')}</figcaption>
  </figure>;
}
