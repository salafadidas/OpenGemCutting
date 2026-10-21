import { useId, useMemo } from 'react';
import { projectTechnicalPreview } from '../domain/technicalPreview.js';

export function SizeDiagram({ solid, view, horizontal, vertical, label }) {
  const marker=useId().replaceAll(':','');
  const scene=useMemo(()=>projectTechnicalPreview(solid,view,{width:320,height:240,padding:48}),[solid,view]);
  const xs=scene.points.map(p=>p.x), ys=scene.points.map(p=>p.y);
  if(!xs.length)return null;
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  return <svg viewBox="0 0 320 240" role="img" aria-label={label}>
    <defs><marker id={marker} orient="auto-start-reverse" markerWidth="6" markerHeight="6" refX="0" refY="3"><path d="M6 0L0 3L6 6" fill="none" stroke="#555" /></marker></defs>
    <g stroke="#333" strokeWidth=".85" fill="none">{scene.edges.map(([a,b],i)=><line key={i} x1={scene.points[a].x} y1={scene.points[a].y} x2={scene.points[b].x} y2={scene.points[b].y} />)}</g>
    <g stroke="#aaa" strokeWidth=".65"><path d={`M${left} ${bottom}V${bottom+24}M${right} ${bottom}V${bottom+24}M${left} ${top}H${left-24}M${left} ${bottom}H${left-24}`} /></g>
    <g stroke="#555" strokeWidth=".8" markerStart={`url(#${marker})`} markerEnd={`url(#${marker})`}><line x1={left} x2={right} y1={bottom+20} y2={bottom+20}/><line x1={left-20} x2={left-20} y1={top} y2={bottom}/></g>
    <g fontSize="11" textAnchor="middle" fill="#111"><text x={(left+right)/2} y={bottom+38}>{horizontal}</text><text transform={`translate(${left-29} ${(top+bottom)/2}) rotate(-90)`}>{vertical}</text></g>
  </svg>;
}
