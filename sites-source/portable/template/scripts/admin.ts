import 'dotenv/config';
import {randomBytes} from 'node:crypto';
import {db} from '../lib/db';
import {createTeacher,passwordHash} from '../lib/local-auth';
import {createInterface} from 'node:readline/promises';
const init=process.argv.includes('--init'),reset=process.argv.includes('--reset');
let email=process.env.INITIAL_ADMIN_EMAIL||'admin@local.test',name=process.env.INITIAL_ADMIN_NAME||'Öğretmen',password=process.env.INITIAL_ADMIN_PASSWORD||'';
if(init&&await db.user.count()){console.log('Öğretmen hesabı zaten var; şifre değiştirilmedi.');await db.$disconnect();process.exit(0);}
if(!init){const rl=createInterface({input:process.stdin,output:process.stdout});email=(await rl.question('E-posta: ')).trim();name=(await rl.question('Ad: ')).trim()||'Öğretmen';rl.close();password='';}
if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error('Geçerli e-posta girin.');
if(!password)password=randomBytes(18).toString('base64url');
if(reset){await db.session.deleteMany({where:{user:{email:email.toLowerCase()}}});await db.user.update({where:{email:email.toLowerCase()},data:{passwordHash:passwordHash(password)}});}else await createTeacher(email,name,password);
console.log('Öğretmen hesabı: '+email);console.log('İlk giriş şifresi: '+password);console.log('Bu bilgileri güvenli bir yere kaydedin.');await db.$disconnect();
