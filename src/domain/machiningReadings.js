import { buildCuttingSequence } from './cuttingAssistant.js';
import { summarizeEffectiveFacets } from './meetJump.js';
import { millimetersPerModelUnit } from './labsContract/validation.js';

export function machiningReadings(document, solid) {
  const scale = millimetersPerModelUnit(document);
  const sequence = buildCuttingSequence(document);
  const ids = new Set(summarizeEffectiveFacets(solid).effectiveFacetIds);
  const rows = sequence.steps.filter(step => step.operationType !== 'concave' && ids.has(step.facetId)).map(step => ({
    ...step,
    normalDepthMm: scale ? step.depth * scale : null,
    planeOffsetMm: scale ? step.plane.offset * scale : null,
  }));
  return { rows, scale, omitted: sequence.steps.length - rows.length,
    note: '法向切入以设计包络为零位；平面偏移是沿外法线从模型原点到切面的有符号距离。两者都是几何参考，不是机器平台高度或升降量。' };
}
