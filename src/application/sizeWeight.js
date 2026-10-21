import { evaluateDocument } from '../domain/documentGeometry.js';
import { calculateSize, measureSize, positive, sizeAtScale } from '../domain/sizeWeight.js';
import { machiningReadings } from '../domain/machiningReadings.js';
import { createReplaceDocumentCommand, normalizeDocumentSchema } from '../domain/faceting.js';

export function inspectSize(document, input) {
  const solid = evaluateDocument(document), measures = measureSize(document, solid);
  const sg = input?.sg ?? document.metadata?.sizeWeight?.sg ?? 2.65;
  const physical = input ? calculateSize(measures, { ...input, sg }) : measures.scale ? sizeAtScale(measures, measures.scale, sg) : null;
  return { measures, physical, material: document.metadata?.sizeWeight?.material ?? '石英', machining: machiningReadings(document, solid) };
}
function prepared(document, metadata, description) {
  const next = normalizeDocumentSchema({ ...document, metadata: { ...document.metadata, ...metadata } });
  return { document: next, command: createReplaceDocumentCommand(next, { description }) };
}
export function prepareSize(document, input) {
  const { physical } = inspectSize(document, input);
  const source = document.stock?.source?.millimetersPerModelUnit;
  if (source && Math.abs(physical.scale - source) > source * 1e-10) throw new Error('此原石已有真实毫米尺度；其他尺寸仅供试算，不能覆盖原石标定。');
  const material = input.material ?? '自定义';
  if (typeof material !== 'string' || !material.trim() || material.length > 200) throw new Error('请填写材质名称。');
  return prepared(document, { physicalScale: { ...document.metadata?.physicalScale, millimetersPerModelUnit: source ?? physical.scale },
    sizeWeight: { sg: positive(input.sg, '比重'), material: material.trim() } }, '采用成品尺寸与材质');
}
