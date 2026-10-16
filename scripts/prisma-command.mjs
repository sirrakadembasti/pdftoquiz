import 'dotenv/config';
import {ensureDatabase,db,databasePath} from '../lib/db.ts';

const command=process.argv[2];
if(command==='generate'){
 console.log('Yerel libSQL istemcisi kullanılıyor; üretilmiş Prisma istemcisi gerekmiyor.');
}else if(command==='migrate'){
 await ensureDatabase();
 console.log('SQLite şeması hazır: '+databasePath);
}else{
 throw new Error('Desteklenmeyen veritabanı komutu: '+String(command||''));
}
await db.$disconnect();
