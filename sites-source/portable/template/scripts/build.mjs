import {spawnSync} from 'node:child_process';
import {cpSync,mkdirSync} from 'node:fs';
let r=spawnSync(process.execPath,['scripts/prisma-command.mjs','generate'],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
r=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});if(r.status!==0)process.exit(r.status||1);
mkdirSync('.next/standalone/.next',{recursive:true});cpSync('public','.next/standalone/public',{recursive:true});cpSync('.next/static','.next/standalone/.next/static',{recursive:true});
