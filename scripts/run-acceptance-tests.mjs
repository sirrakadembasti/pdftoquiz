import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const requirements={
 MULTISECTION_REFERENCE_PDF:{legacy:'REFERENCE_PDF',label:'çok bölümlü dijital kabul PDF\'si'},
 ANSWER_KEY_REFERENCE_IMAGE:{legacy:'REFERENCE_KEY_IMAGE',label:'bu PDF ile eşleşen cevap anahtarı görüntüsü'},
 STRUCTURED_REFERENCE_PDF:{legacy:'TAPU_REFERENCE_PDF',label:'kod, şekil ve iki sütun örnekleri içeren dijital kabul PDF\'si'},
 SCANNED_REFERENCE_PDF:{legacy:'REAL_REFERENCE_PDF',label:'taranmış/OCR kabul PDF\'si'},
};
const configured=Object.fromEntries(Object.entries(requirements).map(([key,{legacy}])=>[key,process.env[key]||process.env[legacy]]));
const missing=Object.entries(requirements).filter(([key])=>!configured[key]);
const unreadable=Object.entries(requirements).filter(([key])=>configured[key]&&!existsSync(configured[key]));
if(missing.length||unreadable.length){
 console.error('Gerçek belge kabul testleri yapılandırılmadı. Standart `pnpm test` için bu dosyalar gerekmez.');
 for(const [key,{label}] of missing)console.error(`- ${key}: ${label} için dosya yolu eksik`);
 for(const [key,{label}] of unreadable)console.error(`- ${key}: ${label} bulunamadı (${configured[key]})`);
 process.exit(2);
}

const suites=['phase1','answer-key','layout-quality','hybrid','answer-color','number-sequence','text-options','crop-quality','red-ink'];
const environment={...process.env,RUN_REAL_ACCEPTANCE:'1',REFERENCE_PDF:configured.MULTISECTION_REFERENCE_PDF,REFERENCE_KEY_IMAGE:configured.ANSWER_KEY_REFERENCE_IMAGE,TAPU_REFERENCE_PDF:configured.STRUCTURED_REFERENCE_PDF,REAL_REFERENCE_PDF:configured.SCANNED_REFERENCE_PDF};
for(const name of suites){
 const result=spawnSync(process.execPath,['--test','tests/'+name+'-regression.mjs'],{stdio:'inherit',env:environment});
 if(result.status!==0)process.exit(result.status||1);
}
