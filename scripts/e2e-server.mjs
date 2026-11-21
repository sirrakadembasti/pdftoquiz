// Playwright uçtan uca testleri için üretim sunucusu: her koşuda boş, geçici bir veritabanıyla açılır; gerçek data/quiz.db'ye dokunmaz.
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
if(!existsSync('.next/standalone/server.js'))throw new Error('Önce pnpm build çalıştırın.');
const dir=resolve('.test-tmp/e2e/server');rmSync(dir,{recursive:true,force:true});mkdirSync(dir,{recursive:true});
const port=process.env.E2E_PORT||'3292',base='http://127.0.0.1:'+port;
// Süreç ortamı .env değerlerini ezer; yerel .env'deki hesap ve veritabanı ayarları testlere sızmaz.
const env={...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',HOSTNAME:'127.0.0.1',PORT:port,APP_ORIGIN:base,COOKIE_SECURE:'false',TRUST_PROXY:'false',DATABASE_URL:'file:'+resolve(dir,'quiz.db'),LLM_DATA_DIR:dir,INITIAL_ADMIN_EMAIL:process.env.E2E_EMAIL||'teacher@example.test',INITIAL_ADMIN_NAME:'E2E öğretmen',INITIAL_ADMIN_PASSWORD:process.env.E2E_PASSWORD||'E2e-test-password-2026'};
const child=spawn(process.execPath,['.next/standalone/server.js'],{stdio:'inherit',env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));
