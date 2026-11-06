import {readFileSync,readdirSync} from 'node:fs';

const directory=new URL('../tests/',import.meta.url);
const forbidden=/\b(?:test|nodeTest)\.skip\b|\bskip\s*:/;
const violations=[];
for(const name of readdirSync(directory).filter(name=>name.endsWith('-regression.mjs'))){
 const source=readFileSync(new URL(name,directory),'utf8');
 if(forbidden.test(source))violations.push(name);
}
if(violations.length){
 console.error('Standart test paketinde sessiz atlama yasaktır: '+violations.join(', '));
 console.error('Gerçek belge kontrollerini acceptanceTest ile ayrı kabul katmanına taşıyın.');
 process.exit(1);
}
console.log('Test politikası: standart pakette skip yok.');
