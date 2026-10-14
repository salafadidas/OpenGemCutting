import test from 'node:test';
import assert from 'node:assert/strict';
import { drawScreenStrokes, screenStrokeQuads } from './screenSegmentRenderer.js';
const segment={start:{x:20,y:30,ndcZ:.2},end:{x:120,y:30,ndcZ:.4},color:[10,20,30,128],weight:4};
test('stroke quads preserve endpoint depth, width, color and round-cap padding',()=>{
 const [q]=screenStrokeQuads([segment],200,100);
 assert.deepEqual(q.size,[50,2]);assert.deepEqual(q.color,[10/255,20/255,30/255,128/255]);
 assert.deepEqual(q.vertices.map(v=>v.point),[[-83,-23,200],[23,-23,0],[23,-17,0],[-83,-17,200]]);
 assert.deepEqual(q.vertices.map(v=>v.local),[[-53,-3],[53,-3],[53,3],[-53,3]]);
 const [vertical]=screenStrokeQuads([{...segment,start:{x:20,y:30},end:{x:20,y:130}}],200,100);
 assert.ok(vertical.vertices.every(v=>v.point.every(Number.isFinite)));
 assert.deepEqual(screenStrokeQuads([{...segment,end:segment.start}],200,100),[]);
});
test('hundreds of helper segments use one draw and release the transient GPU mesh',()=>{
 let draws=0,freed=0,shaderBuilds=0,last,depthWrite=true;
 class Geometry{constructor(){this.vertices=[];this.vertexNormals=[];this.vertexColors=[];this.faces=[];}vertexProperty(){}hasFillTransparency(){return true}}
 const p={width:200,height:100,constructor:{Geometry},createVector:(...v)=>v,
  baseMaterialShader:()=>({modify:()=>{shaderBuilds++;return{}}}),shader(){},push(){},pop(){},noStroke(){},fill(){},
  drawingContext:{DEPTH_WRITEMASK:1,getParameter:()=>depthWrite,depthMask:v=>{depthWrite=v}},_renderer:{states:{curFillColor:[1,1,1,1]},_applyColorBlend:()=>{depthWrite=true}},
  model:g=>{assert.equal(depthWrite,false);draws++;last=g},freeGeometry:g=>{assert.equal(g,last);freed++}};
 drawScreenStrokes(p,Array.from({length:360},()=>segment));
 assert.equal(draws,1);assert.equal(last.faces.length,720);assert.equal(last.vertices.length,1440);assert.equal(freed,1);assert.equal(depthWrite,false);
 drawScreenStrokes(p,[segment]);assert.equal(draws,2);assert.equal(freed,2);assert.equal(shaderBuilds,1);
 drawScreenStrokes(p,[]);assert.equal(draws,2);
});
