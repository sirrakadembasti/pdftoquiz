import {readFileSync,readdirSync} from 'node:fs';

const directory=new URL('../tests/',import.meta.url);
const forbidden=/\b(?:test|nodeTest)\.skip\b|\bskip\s*:/;
// Gerçek lib/db.ts modülünü yükleyen test, DATABASE_URL'i geçici bir veritabanına yönlendirmeden
// çalışırsa varsayılan data/quiz.db'ye (kullanıcının gerçek verisi) yazar.
const realDatabase=/['"]lib\/db\.ts['"]/;
const isolatedDatabase=/process\.env\.DATABASE_URL\s*=/;
const violations=[];
const unisolated=[];
for(const name of readdirSync(directory).filter(name=>name.endsWith('-regression.mjs'))){
 const source=readFileSync(new URL(name,directory),'utf8');
 if(forbidden.test(source))violations.push(name);
 if(realDatabase.test(source)&&!isolatedDatabase.test(source))unisolated.push(name);
}
if(violations.length){
 console.error('Standart test paketinde sessiz atlama yasaktır: '+violations.join(', '));
 console.error('Gerçek belge kontrollerini acceptanceTest ile ayrı kabul katmanına taşıyın.');
 process.exit(1);
}
if(unisolated.length){
 console.error('Gerçek veritabanı modülünü yükleyen testler DATABASE_URL\'i geçici veritabanına yönlendirmeli: '+unisolated.join(', '));
 process.exit(1);
}
console.log('Test politikası: standart pakette skip yok, veritabanı yalıtılmış.');
