import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const [major,minor]=process.versions.node.split('.').map(Number);if(major<22||major===22&&minor<13)throw new Error('Node.js 24 LTS (veya >=22.13) gerekli.');
if(!existsSync('.env'))writeFileSync('.env',readFileSync('.env.example'));
const shell=process.platform==='win32';
if(spawnSync('pnpm',['--version'],{stdio:'ignore',shell}).status!==0)throw new Error('pnpm bulunamadı. Önce pnpm kurun: `corepack enable` (Node ile gelir) veya `npm install -g pnpm@11.25.0`.');
const pnpm=spawnSync('pnpm',['install','--frozen-lockfile'],{stdio:'inherit',shell});
if(pnpm.status!==0)process.exit(pnpm.status||1);
for(const args of [['scripts/db-command.mjs','migrate'],['--import','tsx','scripts/admin.ts','--init']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
console.log('Kurulum tamamlandı. Geliştirme: pnpm dev');
