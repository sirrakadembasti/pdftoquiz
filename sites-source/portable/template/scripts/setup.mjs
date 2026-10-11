import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const [major,minor]=process.versions.node.split('.').map(Number);if(major<22||major===22&&minor<13)throw new Error('Node.js 24 LTS (veya >=22.13) gerekli.');
if(!existsSync('.env'))writeFileSync('.env',readFileSync('.env.example'));
const commands=[['tools/pnpm/dist/pnpm.mjs','install','--frozen-lockfile'],['scripts/prisma-command.mjs','generate'],['scripts/prisma-command.mjs','migrate','deploy'],['--import','tsx','scripts/admin.ts','--init']];
for(const args of commands){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
console.log('Kurulum tamamlandı. Geliştirme: node tools/pnpm/dist/pnpm.mjs dev');
