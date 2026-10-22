import {cpSync,existsSync,mkdirSync,readdirSync,lstatSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),target=resolve(process.argv[2]||'../pdf-to-onlinequiz-portable');
if(target===root||target.startsWith(root+'/'))throw new Error('Choose an output directory outside the source checkout.');
if(existsSync(target)&&readdirSync(target).length)throw new Error('Output must be empty; existing files are preserved.');
mkdirSync(target,{recursive:true});
const files=execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
for(const name of files){if(/(^|\/)(\.env(?!\.example(?:\/|$))[^/]*|node_modules|\.git|\.sites-runtime|dist)(\/|$)|\.tsbuildinfo$/.test(name))continue;const src=join(root,name);if(!existsSync(src)||lstatSync(src).isSymbolicLink())continue;const out=join(target,'sites-source',name);mkdirSync(resolve(out,'..'),{recursive:true});cpSync(src,out);}
// New reusable source files are copied from the current working tree as well.
for(const name of ['app','components','hooks','lib','public','docs','tests'])if(existsSync(join(root,name)))cpSync(join(root,name),join(target,name),{recursive:true,filter:src=>!lstatSync(src).isSymbolicLink()});
for(const name of ['postcss.config.mjs','eslint.config.mjs','next-env.d.ts'])if(existsSync(join(root,name)))cpSync(join(root,name),join(target,name));
cpSync(join(root,'portable/template'),target,{recursive:true});
let server=readFileSync(join(root,'lib/server.ts'),'utf8').replace("import {env} from 'cloudflare:workers';","import {sqliteBucket} from './storage';").replace("if(!env.BUCKET)throw new Error('Sınav depolaması kullanılamıyor.');return env.BUCKET;","return sqliteBucket;").replace('Kaydetmek için ChatGPT ile giriş yapın.','Kaydetmek için öğretmen hesabınızla giriş yapın.').replace("origin!==new URL(r.url).origin","origin!==(process.env.APP_ORIGIN?.replace(/\\/$/,'')||new URL(r.url).origin)");writeFileSync(join(target,'lib/server.ts'),server);
let page=readFileSync(join(root,'app/page.tsx'),'utf8').replaceAll('/signin-with-chatgpt?return_to=%2F','/account?return_to=%2F').replaceAll('ChatGPT ile giriş yap','Öğretmen girişi').replaceAll('export function','function');writeFileSync(join(target,'app/page.tsx'),page);
for(const name of readdirSync(join(target,'lib')))if(name.startsWith('connector')&&name!=='connector-errors.mts')rmSync(join(target,'lib',name),{recursive:true,force:true});
for(const name of ['app/api/exams/route.ts','app/api/exams/[id]/route.ts','app/api/ai/route.ts','app/api/health/route.ts']){const p=join(target,name);writeFileSync(p,"export const runtime='nodejs';\nexport const dynamic='force-dynamic';\n"+readFileSync(p,'utf8'));}
const original=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const dependencies={...original.dependencies,next:'16.4.0',react:'19.3.0','react-dom':'19.3.0','lucide-react':'1.52.0','@prisma/client':'7.10.0','@prisma/adapter-libsql':'7.10.0','@libsql/client':'0.18.0',dotenv:'18.0.6',tsx:'4.23.15'};delete dependencies['drizzle-orm'];
const devDependencies={'@tailwindcss/postcss':'4.3.3',tailwindcss:'4.3.3','@types/node':'22.19.19','@types/react':'19.2.14','@types/react-dom':'19.2.3',typescript:'5.9.3',eslint:'9.39.4','eslint-config-next':'16.4.0',prisma:'7.10.0','react-test-renderer':'19.3.0','@napi-rs/canvas':'0.1.100'};
const pkg={name:'pdf-to-onlinequiz',version:original.version,private:true,type:'module',engines:{node:'>=22.13.0'},packageManager:'pnpm@11.25.0',scripts:{setup:'node scripts/setup.mjs',dev:'next dev --hostname 127.0.0.1 --port 3000',build:'node scripts/build.mjs',start:'node scripts/serve.mjs',typecheck:'tsc --noEmit --incremental false',test:'node scripts/run-tests.mjs','test:policy':'node scripts/check-test-policy.mjs','test:acceptance':'node scripts/run-acceptance-tests.mjs','test:ocr':'node sites-source/scripts/ocr/run.mjs','test:server':'node --import tsx --test tests/local-server.mjs','db:generate':'node scripts/prisma-command.mjs generate','db:migrate':'node scripts/prisma-command.mjs migrate deploy','user:add':'node --import tsx scripts/admin.ts','user:reset':'node --import tsx scripts/admin.ts --reset',backup:'node --import tsx scripts/backup.ts'},dependencies,devDependencies};
writeFileSync(join(target,'package.json'),JSON.stringify(pkg,null,2)+'\n');
cpSync(join(root,'portable/pnpm-workspace.yaml'),join(target,'pnpm-workspace.yaml'));
cpSync(join(root,'portable/pnpm-lock.yaml'),join(target,'pnpm-lock.yaml'));
const ts=JSON.parse(readFileSync(join(root,'tsconfig.json'),'utf8'));ts.compilerOptions.types=['node'];ts.exclude=['node_modules','sites-source','examples'];writeFileSync(join(target,'tsconfig.json'),JSON.stringify(ts,null,2)+'\n');
writeFileSync(join(target,'VERSION.json'),JSON.stringify({version:original.version,date:'2026-10-10',features:'Faz 3D: yer tutucu, şık yuvaları, okuma güveni, güvenli görsel gösterimi ve sayfa OCR hata yedeği',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),profile:'Next.js / Node.js / Prisma / SQLite'},null,2)+'\n');
const pnpmBundle=process.env.PORTABLE_PNPM_BUNDLE;if(pnpmBundle)cpSync(pnpmBundle,join(target,'tools/pnpm'),{recursive:true});
console.log(target);
