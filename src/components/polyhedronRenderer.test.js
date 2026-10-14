import test from 'node:test';
import assert from 'node:assert/strict';
import { drawPolyhedron, releasePolyhedronMeshes } from './polyhedronRenderer.js';

function renderer() {
  const live = new Set(), draws = [], masks = [];
  class Geometry {
    constructor() { this.vertices=[]; this.vertexNormals=[]; this.vertexColors=[]; this.faces=[]; this.edges=[]; live.add(this); }
    vertexProperty() {}
  }
  return { live, draws, masks, p: { constructor:{Geometry}, createVector:(...v)=>v,
    freeGeometry:g=>live.delete(g), model:g=>draws.push(g),
    drawingContext:{depthMask:v=>masks.push(v)},
    push(){},pop(){},noStroke(){},fill(){},normal(){},noFill(){},stroke(){},strokeWeight(){} } };
}
const face = (z, id) => ({ center:[0,z,0], normal:[0,1,0], points:[[0,z,0],[1,z,0],[0,z,1]], operationId:id });
const geometry = { faces:[face(-1,'back'),face(1,'front')], edges:[[[0,0,0],[1,0,0]]] };
const draw = (r, g=geometry, yaw=0, mode='solid', active=null, scale=1) => {
  r.draws.length=0;
  drawPolyhedron(r.p,g,scale,1,yaw,0,mode,null,active,null,null);
  return r.draws[0];
};
test('opaque orbit reuses GPU fill while X-ray retains changing depth order',()=>{
  const r=renderer(); const solid=draw(r);
  for(let i=0;i<40;i++)assert.equal(draw(r,geometry,i*.2),solid);
  assert.equal(r.live.size,2,'one fill and one edge buffer across opaque orbit');
  assert.equal(solid.faces.length,2);
  assert.ok(solid.vertexColors.filter((_,i)=>i%4===3).every(a=>a===1));
  const xray=draw(r,geometry,0,'xray');
  assert.deepEqual(xray.vertices[0],[0,-0,-1]);
  const reversed=draw(r,geometry,Math.PI,'xray');
  assert.notEqual(reversed,xray);assert.deepEqual(reversed.vertices[0],[0,-0,1]);
  assert.equal(r.live.has(xray),false);assert.equal(r.masks.at(-2),false);assert.equal(r.masks.at(-1),true);
  releasePolyhedronMeshes(r.p);assert.equal(r.live.size,0);
});
test('geometry, scale and active colors invalidate fill without losing active edges',()=>{
  const r=renderer();const original=draw(r);
  const highlighted=draw(r,geometry,0,'solid','front');
  assert.notEqual(highlighted,original);assert.equal(r.draws.length,3);
  assert.equal(r.live.size,3);
  const resized=draw(r,geometry,0,'solid','front',2);
  assert.notEqual(resized,highlighted);assert.equal(r.live.has(highlighted),false);
  assert.deepEqual(resized.vertices[1],[2,-0,-2]);
  const changed={...geometry,faces:[face(0,'other')]};
  const replacement=draw(r,changed);
  assert.equal(replacement.faces.length,1);assert.equal(r.live.size,2);
  releasePolyhedronMeshes(r.p);assert.equal(r.live.size,0);
});
