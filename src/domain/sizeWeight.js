import { polyhedronVolume } from './geometry.js';
import { summarizeEffectiveFacets } from './meetJump.js';
import { millimetersPerModelUnit } from './labsContract/validation.js';

// SG is independent of optical RI and colour density. Values are editable estimates.
export const MATERIAL_SG = Object.freeze([
  ['石英', 2.65], ['碧玺', 3.06], ['绿柱石', 2.72], ['黄玉', 3.53], ['刚玉', 4], ['钻石', 3.52], ['立方氧化锆', 5.8],
]);
export function positive(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label}必须大于零。`);
  return value;
}
export function solidBounds(vertices) {
  const min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of vertices) for (const axis of ['x', 'y', 'z']) { min[axis] = Math.min(min[axis], p[axis]); max[axis] = Math.max(max[axis], p[axis]); }
  return { min, max, length: max.x - min.x, width: max.y - min.y, height: max.z - min.z };
}
export function measureSize(document, solid) {
  if (!solid.vertices.length) throw new Error('当前没有可测量的实体。');
  const b = solidBounds(solid.vertices), volume = polyhedronVolume(solid);
  positive(b.width, '成品宽度'); positive(volume, '实体体积');
  const effective = new Set(summarizeEffectiveFacets(solid).effectiveFacetIds);
  const facets = new Map(document.facets.filter(f => effective.has(f.id)).map(f => [f.id, f]));
  const points = face => face.vertexIndices.map(i => solid.vertices[i]);
  const owner = face => facets.get(face.facetId ?? face.id);
  const girdle = solid.faces.filter(face => owner(face)?.region === 'girdle');
  const eps = Math.max(b.length, b.width, b.height) * 1e-7;
  const tops = girdle.map(face => Math.max(...points(face).map(p => p.z)));
  const bottoms = girdle.map(face => Math.min(...points(face).map(p => p.z)));
  const level = values => values.length && Math.max(...values) - Math.min(...values) <= eps;
  const regularGirdle = Boolean(level(tops) && level(bottoms));
  const top = tops.length ? Math.max(...tops) : null, bottom = bottoms.length ? Math.min(...bottoms) : null;
  const table = solid.faces.filter(face => owner(face)?.region === 'crown' && face.normal?.z > 1 - 1e-8 && points(face).every(p => Math.abs(p.z - b.max.z) <= eps));
  const tb = table.length ? solidBounds(table.flatMap(points)) : null;
  const measures = { length: b.length, width: b.width, height: b.height,
    crown: top === null ? null : b.max.z - top, pavilion: bottom === null ? null : bottom - b.min.z,
    girdle: top === null ? null : top - bottom, tableLength: tb?.length ?? null, tableWidth: tb?.width ?? null, volume };
  const ratio = key => measures[key] === null ? null : measures[key] / b.width;
  return { ...measures, bounds: b, girdleStatus: regularGirdle ? 'level' : girdle.length ? 'uneven' : 'missing',
    ratios: { lengthWidth: ratio('length'), pavilionWidth: ratio('pavilion'), crownWidth: ratio('crown'),
      pavilionCrown: measures.crown > eps ? measures.pavilion / measures.crown : null,
      tableLengthWidth: ratio('tableLength'), tableWidthWidth: ratio('tableWidth'), heightWidth: ratio('height'), volumeWidth3: volume / b.width ** 3 },
    girdleSpread: { top: tops.length ? Math.max(...tops) - Math.min(...tops) : null, bottom: bottoms.length ? Math.max(...bottoms) - Math.min(...bottoms) : null },
    scale: millimetersPerModelUnit(document) };
}
export function sizeAtScale(measures, scale, sg) {
  positive(scale, '毫米比例'); positive(sg, '比重');
  const result = Object.fromEntries(['length', 'width', 'height', 'crown', 'pavilion', 'girdle', 'tableLength', 'tableWidth'].map(k => [k, measures[k] === null ? null : measures[k] * scale]));
  const volume = measures.volume * scale ** 3;
  return { ...result, volume, weight: volume * sg / 200, scale, sg };
}
export function calculateSize(measures, { basis = 'width', value, sg = 2.65 }) {
  positive(value, '目标值'); positive(sg, '比重');
  if (!['length', 'width', 'height', 'crown', 'pavilion', 'weight'].includes(basis)) throw new Error('不支持此换算基准。');
  const scale = basis === 'weight' ? Math.cbrt(value * 200 / (measures.volume * sg)) : value / positive(measures[basis], '此项设计尺寸');
  return sizeAtScale(measures, scale, sg);
}
