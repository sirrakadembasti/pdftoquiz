import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require=createRequire(path.join(root,'package.json'));
const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync(path.join(root,'lib/ai.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function('exports','module',compiled)(module.exports,module);
const {requestAI}=module.exports;
const payload={base:'https://generativelanguage.googleapis.com/v1beta/openai',key:'dummy-key',model:'gemini-3.8-flash',image:'data:image/png;base64,eA==',action:'test'};

test('Gemini DNS error is reported without leaking raw fetch failed',async()=>{
  await assert.rejects(
    requestAI(payload,async()=>{throw new TypeError('fetch failed',{cause:Object.assign(new Error('dns'),{code:'ENOTFOUND'})});}),
    error=>error.providerStatus===502&&error.diagnostic?.decision==='NETWORK_ERROR'&&error.diagnostic?.networkCode==='ENOTFOUND'&&/Gemini sağlayıcısına ulaşılamadı/.test(error.message)
  );
});

test('Gemini array-shaped API errors preserve the provider message',async()=>{
  await assert.rejects(
    requestAI(payload,async()=>Response.json([{error:{code:400,message:'Please pass a valid API key',status:'INVALID_ARGUMENT'}}],{status:400})),
    /Please pass a valid API key/
  );
});

test('Gemini provider defaults to gemini-3.8-flash',()=>{
  const page=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
  assert.match(page,/googleapis'\)\)\s*setModel\('gemini-3\.8-flash'\)/);
  assert.doesNotMatch(page,/googleapis'\)\)\s*setModel\('gemini-2\.5-flash'\)/);
});
