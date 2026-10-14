// Screen-space helper strokes are already clipped by the viewport's geometric
// visibility checks. Draw their exact endpoints in one mesh, with round caps
// in the fragment shader, rather than expanding p5's cap/join buffers per line.
const shaders = new WeakMap();
function strokeShader(p) {
  if (!shaders.has(p)) shaders.set(p, p.baseMaterialShader().modify({
    vertexDeclarations: 'in vec2 aLineLocal; in vec2 aLineSize; out vec2 vLineLocal; out vec2 vLineSize; out vec4 vLineColor;',
    fragmentDeclarations: 'in vec2 vLineLocal; in vec2 vLineSize; in vec4 vLineColor;',
    'void afterVertex': '() { vLineLocal = aLineLocal; vLineSize = aLineSize; vLineColor = aVertexColor; }',
    'vec4 getFinalColor': `(vec4 color, vec2 texCoord) {
      float edge = vLineSize.y - length(vec2(max(abs(vLineLocal.x) - vLineSize.x, 0.0), vLineLocal.y));
      float aa = max(fwidth(edge), 0.01);
      float coverage = smoothstep(-aa, aa, edge);
      if (coverage <= 0.0) discard;
      return vec4(vLineColor.rgb, vLineColor.a * coverage);
    }`,
  }));
  return shaders.get(p);
}
const depth = point => Number.isFinite(point.ndcZ) ? 400 - point.ndcZ * 1000 : 0;

export function screenStrokeQuads(segments, width, height) {
  return segments.flatMap(({ start, end, color, weight }) => {
    const dx=end.x-start.x, dy=end.y-start.y, length=Math.hypot(dx,dy);
    if (!length || weight <= 0) return [];
    const ux=dx/length, uy=dy/length, radius=weight/2, extent=radius+1;
    const cx=(start.x+end.x-width)/2, cy=(start.y+end.y-height)/2;
    const half=length/2, z0=depth(start), z1=depth(end);
    return [{ color:color.map(v=>v/255), size:[half,radius], vertices:
      [[-half-extent,-extent],[half+extent,-extent],[half+extent,extent],[-half-extent,extent]].map(([x,y])=>({
        point:[cx+ux*x-uy*y,cy+uy*x+ux*y, z0+(z1-z0)*Math.max(0,Math.min(1,(x+half)/length))], local:[x,y],
      })) }];
  });
}

export function drawScreenStrokes(p, segments) {
  const quads=screenStrokeQuads(segments,p.width,p.height);
  if (!quads.length) return;
  const mesh=new p.constructor.Geometry();
  for (const quad of quads) {
    const start=mesh.vertices.length;
    for (const vertex of quad.vertices) {
      mesh.vertices.push(p.createVector(...vertex.point));
      mesh.vertexNormals.push(p.createVector(0,0,1));
      mesh.vertexColors.push(...quad.color);
      mesh.vertexProperty('aLineLocal',vertex.local);
      mesh.vertexProperty('aLineSize',quad.size);
    }
    mesh.faces.push([start,start+1,start+2],[start,start+2,start+3]);
  }
  p.push();
  p.noStroke();
  p.fill(255);
  p.shader(strokeShader(p));
  // p5 may enable depth writes when it changes blending. Establish blending
  // first, then keep translucent helper strokes from occluding one another.
  const gl = p.drawingContext;
  p._renderer._applyColorBlend(p._renderer.states.curFillColor, mesh.hasFillTransparency());
  gl.depthMask(false);
  p.model(mesh);
  p.pop();
  p.freeGeometry(mesh);
}
