import {spawnSync} from 'node:child_process';
for(const args of [['scripts/prisma-command.mjs','migrate','deploy'],['--import','tsx','scripts/admin.ts','--init']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
await import('../server.js');
