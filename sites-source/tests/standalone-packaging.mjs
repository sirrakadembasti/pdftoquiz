import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,cpSync,symlinkSync,renameSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createRequire} from 'node:module';
import {restoreStandaloneLinks} from '../scripts/standalone-links.mjs';

test('Standalone dependency resolution survives relocating the Windows output',()=>{
 const root=mkdtempSync(join(tmpdir(),'pdfquiz-package-')),source=join(root,'source'),output=join(root,'output'),moved=join(root,'relocated');
 try {
  const dep=join(source,'node_modules/.pnpm/dep/node_modules/dep'),consumer=join(source,'node_modules/consumer'),leaf=join(source,'node_modules/leaf');
  mkdirSync(dep,{recursive:true});mkdirSync(consumer,{recursive:true});mkdirSync(leaf,{recursive:true});
  writeFileSync(join(leaf,'package.json'),JSON.stringify({name:'leaf',main:'index.js'}));writeFileSync(join(leaf,'index.js'),'module.exports=42;');
  writeFileSync(join(dep,'package.json'),JSON.stringify({name:'dep',main:'index.js',dependencies:{leaf:'1.0.0'}}));writeFileSync(join(dep,'index.js'),"module.exports=require('leaf');");
  writeFileSync(join(consumer,'package.json'),JSON.stringify({name:'consumer',main:'index.js',dependencies:{dep:'1.0.0'}}));writeFileSync(join(consumer,'index.js'),"module.exports=require('dep');");
  symlinkSync(dep,join(source,'node_modules/dep'),process.platform==='win32'?'junction':'dir');
  cpSync(consumer,join(output,'node_modules/consumer'),{recursive:true});cpSync(dep,join(output,'node_modules/.pnpm/dep/node_modules/dep'),{recursive:true});
  assert.equal(restoreStandaloneLinks(source,output),1);
  renameSync(output,moved);
  const require=createRequire(join(moved,'entry.cjs'));
  assert.equal(require('consumer'),42);
 } finally {if(!resolve(root).startsWith(resolve(tmpdir())+sep))throw Error('Invalid test cleanup path');rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
