import { faceColor } from './faceColor.js';

function viewDepth(point, yaw, pitch) {
  const [x, y, z] = transformPoint(point, 1);
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const yawZ = -sinYaw * x + cosYaw * z;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  return sinPitch * y + cosPitch * yawZ;
}

export function transformPoint(point, sceneScale) {
  return [point[0] * sceneScale, -point[2] * sceneScale, point[1] * sceneScale];
}

const polyhedronRenderCaches = new WeakMap();
const surfaceCueShaders = new WeakMap();

// Keep the saved surface cue legible under the editor's bright studio lights.
// One attribute per vertex preserves the existing depth, alpha and face order.
function surfaceCueShader(p) {
  if (!surfaceCueShaders.has(p)) surfaceCueShaders.set(p, p.baseMaterialShader().modify({
    vertexDeclarations: 'in float aSurfaceCue; out float vSurfaceCue; out vec4 vSurfaceColor;',
    fragmentDeclarations: 'in float vSurfaceCue; in vec4 vSurfaceColor;',
    'void afterVertex': '() { vSurfaceCue = aSurfaceCue; vSurfaceColor = aVertexColor; }',
    'vec4 getFinalColor': '(vec4 color, vec2 texCoord) { return vec4(mix(color.rgb, vSurfaceColor.rgb, vSurfaceCue), color.a); }',
  }));
  return surfaceCueShaders.get(p);
}

export function releasePolyhedronMeshes(p, cache = polyhedronRenderCaches.get(p)) {
  if (!cache) return;
  for (const mesh of [cache.fillMesh, cache.edgeMesh, cache.activeMesh]) {
    if (mesh) p.freeGeometry(mesh);
  }
  polyhedronRenderCaches.delete(p);
}

export function lineMesh(p, edges, sceneScale) {
  const mesh = new p.constructor.Geometry();
  edges.forEach(([start, end]) => {
    const index = mesh.vertices.length;
    mesh.vertices.push(
      p.createVector(...transformPoint(start, sceneScale)),
      p.createVector(...transformPoint(end, sceneScale)),
    );
    // Separate indices keep the same independent caps as p.line / LINES.
    mesh.edges.push([index, index + 1]);
  });
  return mesh;
}

export function drawPolyhedron(p, geometry, sceneScale, lineWeight, yaw, pitch, renderMode, highlightOperationId, activeOperationId, previewOperationId, frostedFaceIds) {
  const gl = p.drawingContext;
  // Opaque faces use the depth buffer; camera motion must not rebuild GPU buffers.
  // Translucent X-ray still needs back-to-front ordering.
  const orderedFaces = renderMode === "solid" ? geometry.faces : geometry.faces
    .map(face => ({ face, depth: viewDepth(face.center, yaw, pitch) }))
    .sort((a, b) => a.depth - b.depth)
    .map(entry => entry.face);
  let cache = polyhedronRenderCaches.get(p);
  if (!cache || cache.geometry !== geometry || cache.sceneScale !== sceneScale) {
    releasePolyhedronMeshes(p, cache);
    cache = { geometry, sceneScale, edgeMesh: lineMesh(p, geometry.edges, sceneScale), faceVertices: new Map() };
    polyhedronRenderCaches.set(p, cache);
  }
  const colors = [renderMode, highlightOperationId, activeOperationId, previewOperationId, frostedFaceIds];
  if (!cache.fillMesh || colors.some((value, index) => value !== cache.colors[index])
    || orderedFaces.some((face, index) => face !== cache.orderedFaces[index])) {
    if (cache.fillMesh) p.freeGeometry(cache.fillMesh);
    const mesh = new p.constructor.Geometry();
    orderedFaces.forEach((face) => {
      const color = faceColor(face, renderMode, highlightOperationId, activeOperationId, previewOperationId, frostedFaceIds)
        .map((value) => value / 255);
      const surfaceCue = frostedFaceIds?.has(face.facetId)
        && ![highlightOperationId, activeOperationId, previewOperationId].some(id => id && id === face.operationId);
      let vectors = cache.faceVertices.get(face);
      if (!vectors) {
        vectors = { normal: p.createVector(...transformPoint(face.normal, 1)), vertices: face.points.map(point => p.createVector(...transformPoint(point, sceneScale))) };
        cache.faceVertices.set(face, vectors);
      }
      const start = mesh.vertices.length;
      vectors.vertices.forEach((point) => {
        mesh.vertices.push(point);
        mesh.vertexNormals.push(vectors.normal);
        mesh.vertexColors.push(...color);
        mesh.vertexProperty('aSurfaceCue', surfaceCue ? 1 : 0);
      });
      for (let index = 1; index < face.points.length - 1; index += 1) {
        mesh.faces.push([start, start + index, start + index + 1]);
      }
    });
    cache.fillMesh = mesh;
    cache.colors = colors;
    cache.orderedFaces = orderedFaces;
  }
  if (cache.activeOperationId !== activeOperationId) {
    if (cache.activeMesh) p.freeGeometry(cache.activeMesh);
    const edges = geometry.kind === "mesh"
      ? geometry.operationEdges.get(activeOperationId) ?? []
      : geometry.faces.filter((face) => face.operationId === activeOperationId)
        .flatMap((face) => face.points.map((point, index) => [point, face.points[(index + 1) % face.points.length]]));
    cache.activeMesh = activeOperationId && edges.length ? lineMesh(p, edges, sceneScale) : null;
    cache.activeOperationId = activeOperationId;
  }

  gl.depthMask(renderMode !== "xray");
  if (orderedFaces.length) {
    p.noStroke();
    p.fill(255);
    p.push();
    if (frostedFaceIds?.size) p.shader(surfaceCueShader(p));
    p.model(cache.fillMesh);
    p.pop();
    // Preserve the normal inherited by subsequent immediate-mode helpers.
    const frontFace = renderMode === "solid"
      ? orderedFaces.reduce((front, face) => viewDepth(face.center, yaw, pitch) >= viewDepth(front.center, yaw, pitch) ? face : front)
      : orderedFaces.at(-1);
    p.normal(...transformPoint(frontFace.normal, 1));
  }
  gl.depthMask(true);
  p.noFill();
  p.stroke(31, 38, 42, renderMode === "xray" ? 112 : 210);
  p.strokeWeight(lineWeight * (renderMode === "xray" ? 0.85 : 1.1));
  if (geometry.edges.length) p.model(cache.edgeMesh);

  if (activeOperationId) {
    p.stroke(238, 36, 96, renderMode === "xray" ? 155 : 235);
    p.strokeWeight(lineWeight * 1.65);
    if (cache.activeMesh) p.model(cache.activeMesh);
  }
}

