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
const payload={base:'https://generativelanguage.googleapis.com/v1beta/openai',key:'dummy-key',model:'test-model',image:'data:image/png;base64,eA==',action:'test'};
test('Gemini: edge uyumlu manual yönlendirme, görsel ve JSON isteği',async()=>{
  let calls=0;
  const result=await requestAI(payload,async(url,options)=>{
    calls++;
    if(!['follow','manual'].includes(options.redirect))throw new TypeError('Invalid redirect value');
    assert.equal(options.redirect,'manual');
    assert.equal(url,payload.base+'/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer dummy-key');
    const body=JSON.parse(options.body);
    assert.equal(body.response_format.type,'json_object');
    assert.equal(body.messages[1].content[1].image_url.url,payload.image);
    return Response.json({choices:[{message:{content:'{"questions":[]}'}}]});
  });
  assert.equal(result.ok,true);assert.equal(calls,1);
});
test('301/302/303/307/308: anahtar gönderilmeden yönlendirme engellenir, JSON okunmaz',async()=>{
  for(const status of [301,302,303,307,308]){
    let calls=0,cancelled=false;
    await assert.rejects(requestAI({...payload,action:'convert'},async(url,options)=>{
      calls++;assert.equal(options.redirect,'manual');
      return {status,body:{cancel:async()=>{cancelled=true;}},text:()=>{throw new Error('Yönlendirme gövdesi okunmamalı');},headers:new Headers({Location:'https://example.test/redirect'})};
    }),new RegExp('yönlendirme döndürdü.*'+status));
    assert.equal(calls,1);assert.equal(cancelled,true);
  }
});
test('Gemini normal PDF çözümleme ve HTTP hata ayrımı korunur',async()=>{
  const result=await requestAI({...payload,action:'convert'},async()=>Response.json({choices:[{message:{content:'{"questions":[{"text":"Soru","options":["A","B"],"correct":null}]}'}}]}));
  assert.equal(result.questions.length,1);assert.equal(result.questions[0].correct,null);
  for(const [status,pattern] of [[401,/API anahtarını/],[429,/kotası/],[400,/görsel ve JSON/]])await assert.rejects(requestAI(payload,async()=>Response.json({error:{message:'provider error'}},{status})),pattern);
});
test('Token kullanımı: sağlayıcının sayıları alınır; eksik/bozuk bilgi tahmin edilmez',async()=>{
 for(const base of ['https://api.openai.com/v1','https://openrouter.ai/api/v1',payload.base]){
  const result=await requestAI({...payload,base,action:'convert'},async()=>Response.json({usage:{prompt_tokens:1200,completion_tokens:300,total_tokens:1500},choices:[{message:{content:'{"questions":[]}'}}]}));
  assert.deepEqual(result.usage,{inputTokens:1200,outputTokens:300,totalTokens:1500});
 }
 const {providerUsage,addAIUsage,aiUsageLine}=module.exports;
 assert.equal(providerUsage({prompt_tokens:'100',completion_tokens:-1}),null);
 assert.deepEqual(providerUsage({prompt_tokens:10,completion_tokens:2}),{inputTokens:10,outputTokens:2,totalTokens:12});
 assert.deepEqual(providerUsage({total_tokens:15}),{inputTokens:null,outputTokens:null,totalTokens:15});
 let u=addAIUsage(undefined,providerUsage({prompt_tokens:1200,completion_tokens:300,total_tokens:1500}));u=addAIUsage(u,null);
 assert.equal(u.requests,2);assert.equal(u.reportedRequests,1);assert.equal(u.totalTokens,1500);assert.match(aiUsageLine(u),/Kısmi: 1\.500 token.*2 çağrı \(1 çağrıda/);
 assert.match(aiUsageLine(addAIUsage(undefined,null)),/bildirilmedi/);
});
test('Kullanım döndüren bozuk AI JSON yanıtında harcanan token bilgisi korunur',async()=>{
 await assert.rejects(requestAI({...payload,action:'repair'},async()=>Response.json({usage:{prompt_tokens:9,completion_tokens:3,total_tokens:12},choices:[{message:{content:'bozuk JSON'}}]})),e=>e.usage?.totalTokens===12);
});
