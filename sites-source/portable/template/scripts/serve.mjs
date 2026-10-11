import 'dotenv/config';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
if(!existsSync('.next/standalone/server.js'))throw new Error('Önce build komutunu çalıştırın.');
const raw=process.env.DATABASE_URL||'file:./data/quiz.db';const env={...process.env,NODE_ENV:'production',HOSTNAME:process.env.HOSTNAME||'127.0.0.1',PORT:process.env.PORT||'3000',DATABASE_URL:'file:'+resolve(raw.slice(5)),NEXT_TELEMETRY_DISABLED:'1'};
const child=spawn(process.execPath,['.next/standalone/server.js'],{stdio:'inherit',env});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0));
