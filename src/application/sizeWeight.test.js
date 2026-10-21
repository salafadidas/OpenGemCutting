import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchDocument } from '../domain/document.js';
import { createCommandHistory, executeFacetingCommand, undoFacetingCommand, exportFacetingJSON, importFacetingJSON, createFacetingDocument, resolveFacetPattern, validateFacetingDocument } from '../domain/faceting.js';
import { inspectSize, prepareSize } from './sizeWeight.js';
import { calculateSize } from '../domain/sizeWeight.js';
import { createCutSession, resolveCutSession, CUT_SESSION_MODE } from '../domain/cutSession.js';
import { validateTool } from './designContract.js';

function specimen() {
  const base=createWorkbenchDocument('尺寸回归');
  const crown=resolveFacetPattern({patternId:'c',region:'crown',industryAngleDeg:35,depth:.6,repeat:32,baseIndex:0});
  const pavilion=resolveFacetPattern({patternId:'p',region:'pavilion',industryAngleDeg:42,depth:.8,repeat:32,baseIndex:0});
  return createFacetingDocument({...base,facets:[...base.facets,...crown,...pavilion]});
}
const size={basis:'width',value:6.2,sg:3.06,material:'碧玺'};
test('size preserves axes and geometry; reverse weight and cubic scaling agree',()=>{
 const doc=specimen(), m=inspectSize(doc).measures;
 const a=calculateSize(m,size), b=calculateSize(m,{...size,value:12.4});
 assert.equal(a.width,6.2);assert.ok(Math.abs(b.weight/a.weight-8)<1e-10);
 assert.ok(Math.abs(calculateSize(m,{basis:'weight',value:a.weight,sg:3.06}).width-6.2)<1e-10);
 const next=prepareSize(doc,size).document;assert.deepEqual(next.facets,doc.facets);assert.deepEqual(next.stock,doc.stock);
 assert.ok(Math.abs(inspectSize(next).physical.weight-a.weight)<1e-12);
 assert.ok(Math.abs(m.crown+m.girdle+m.pavilion-m.height)<1e-10);
 assert.ok(m.crown>0&&m.pavilion>0);assert.ok(m.tableLength>0);
});
test('scale is undoable and metadata survives JSON; invalid SG and input reject',()=>{
 const doc=specimen(), result=prepareSize(doc,size);
 const history=executeFacetingCommand(createCommandHistory(doc),result.command);
 assert.deepEqual(undoFacetingCommand(history).present,doc);
 assert.deepEqual(inspectSize(importFacetingJSON(exportFacetingJSON(result.document))),inspectSize(result.document));
 assert.throws(()=>prepareSize(doc,{...size,sg:0}));assert.throws(()=>prepareSize(doc,{...size,value:Infinity}));
 assert.equal(validateFacetingDocument({...doc,metadata:{sizeWeight:{material:'x',sg:-1}}}).valid,false);
});
test('physical stock scale cannot be overwritten',()=>{
 const doc=specimen();const fixed={...doc,stock:{...doc.stock,source:{millimetersPerModelUnit:3}}};
 assert.throws(()=>prepareSize(fixed,size),/真实毫米/);
});
test('missing waist/table stays unavailable; ratios not guessed from raw stock',()=>{
 const doc=createFacetingDocument({...specimen(),facets:[]});const m=inspectSize(doc).measures;
 assert.equal(m.crown,null);assert.equal(m.pavilion,null);assert.equal(m.girdle,null);assert.equal(m.tableWidth,null);
 assert.throws(()=>calculateSize(m,{...size,basis:'crown'}));
});
test('facet geometry readings scale linearly without device setup',()=>{
 const raw=inspectSize(specimen()).machining;
 assert.ok(raw.rows.length>0);assert.ok(raw.rows.every(r=>r.normalDepthMm===null));
 const doc=prepareSize(specimen(),size).document;
 const a=inspectSize(doc).machining, b=inspectSize(prepareSize(doc,{...size,value:12.4}).document).machining;
 assert.equal(a.rows.length,b.rows.length);
 a.rows.forEach((r,i)=>{assert.equal(b.rows[i].normalDepthMm,r.normalDepthMm*2);assert.equal(b.rows[i].planeOffsetMm,r.planeOffsetMm*2);assert.ok(!('height' in r));});
});
test('physical metadata capability only belongs to idle; MCP shares strict schema',()=>{
 for(const mode of Object.values(CUT_SESSION_MODE)) assert.equal(resolveCutSession(createCutSession(mode)).canSetPhysicalMetadata,mode==='idle');
 validateTool('design_measure',{sessionId:'s',sizing:size});
 assert.throws(()=>validateTool('design_set_size',{sessionId:'s',sizing:size}));
 assert.throws(()=>validateTool('design_measure',{sessionId:'s',sizing:{...size,value:0}}));
});

test('real imported emerald keeps useful envelope heights and discloses girdle spread', async()=>{
 const {readFile}=await import('node:fs/promises');
 const doc=importFacetingJSON(await readFile(new URL('../../public/presets/documents/100058-pc-07-001c-square-emerald-1-4.json',import.meta.url),'utf8'));
 const m=inspectSize(doc).measures;assert.equal(m.girdleStatus,'uneven');assert.ok(m.girdleSpread.bottom>0);
 assert.ok(m.crown>0&&m.pavilion>0&&m.girdle>0);assert.ok(Math.abs(m.height-m.crown-m.pavilion-m.girdle)<1e-10);
});

test('analytic cube: 10mm cube, SG4 gives 1000mm3 and 20ct',()=>{
 const doc=createFacetingDocument({...specimen(),facets:[]});
 const {physical}=inspectSize(doc,{basis:'width',value:10,sg:4});
 assert.ok(Math.abs(physical.volume-1000)<1e-10);assert.ok(Math.abs(physical.weight-20)<1e-10);
});
