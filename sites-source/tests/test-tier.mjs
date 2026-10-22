import {test} from 'node:test';

export const acceptanceEnabled=process.env.RUN_REAL_ACCEPTANCE==='1';

export function acceptanceTest(name,requiredEnvironment,options,fn){
 if(!acceptanceEnabled)return;
 const missing=requiredEnvironment.filter(key=>!process.env[key]);
 test('[gerçek belge kabulü] '+name,options,async context=>{
  if(missing.length)throw new Error('Eksik kabul testi ayarı: '+missing.join(', '));
  return fn(context);
 });
}
