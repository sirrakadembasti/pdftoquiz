import 'dotenv/config';
import {mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const raw=process.env.DATABASE_URL||'file:./data/quiz.db';if(!raw.startsWith('file:'))throw new Error('SQLite file: adresi gerekli.');const file=resolve(raw.slice(5));mkdirSync(dirname(file),{recursive:true});process.env.DATABASE_URL='file:'+file;
if(process.argv.includes('migrate')){const {createClient}=await import('@libsql/client');const c=createClient({url:process.env.DATABASE_URL});await c.execute('PRAGMA user_version');c.close();}
await import('../node_modules/prisma/build/index.js');
