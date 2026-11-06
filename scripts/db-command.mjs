import 'dotenv/config';
import {ensureDatabase,db,databasePath} from '../lib/db.ts';

// Şema lib/db.ts içinde tanımlıdır; "migrate" eksik tabloları oluşturur ve tekrar çalıştırılabilir.
const command=process.argv[2];
if(command==='migrate'){
 await ensureDatabase();
 console.log('SQLite şeması hazır: '+databasePath);
}else{
 throw new Error('Desteklenmeyen veritabanı komutu: '+String(command||''));
}
await db.$disconnect();
