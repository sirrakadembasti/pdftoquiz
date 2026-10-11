import {createClient} from '@libsql/client';
import {databasePath} from '../lib/db';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
mkdirSync(process.env.BACKUP_DIR||'backups',{recursive:true});const file=resolve(process.env.BACKUP_DIR||'backups','quiz-'+new Date().toISOString().replaceAll(':','-')+'.db');const client=createClient({url:'file:'+databasePath});await client.execute("VACUUM INTO '"+file.replaceAll("'","''")+"'");client.close();console.log(file);
