import {db} from './db';
import {createTeacher} from './local-auth';

export type InitialAccountResult='skipped'|'exists'|'created'|'invalid';

// Sunucu açılırken hiç öğretmen hesabı yoksa ve .env içinde INITIAL_ADMIN_PASSWORD verilmişse ilk hesabı oluşturur.
// Hesap bir kez oluştuktan sonra .env değerleri yok sayılır (giriş her zaman veritabanındaki hesaba bakar).
export async function ensureInitialTeacher(env:Record<string,string|undefined>=process.env):Promise<InitialAccountResult>{
 const password=env.INITIAL_ADMIN_PASSWORD||'';
 if(!password)return 'skipped';
 if(await db.user.count())return 'exists';
 const email=(env.INITIAL_ADMIN_EMAIL||'admin@local.test').trim().toLowerCase();
 const name=(env.INITIAL_ADMIN_NAME||'Öğretmen').trim()||'Öğretmen';
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<12||password.length>256)return 'invalid';
 await createTeacher(email,name,password);
 return 'created';
}
