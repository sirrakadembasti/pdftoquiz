import {spawnSync} from 'node:child_process';
import {cpSync,mkdirSync} from 'node:fs';
import {restoreStandaloneLinks} from './standalone-links.mjs';
const r=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});if(r.status!==0)process.exit(r.status||1);
mkdirSync('.next/standalone/.next',{recursive:true});cpSync('public','.next/standalone/public',{recursive:true});cpSync('.next/static','.next/standalone/.next/static',{recursive:true});
console.log('Standalone dependency links restored: '+restoreStandaloneLinks(process.cwd(),'.next/standalone'));
