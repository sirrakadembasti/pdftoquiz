import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const password = 'test-ilk-hesap-parolasi-1';

// Her senaryo kendi geçici SQLite dosyasıyla ayrı süreçte çalışır; gerçek data/quiz.db'ye dokunulmaz.
function run(database, initialEnv, steps) {
  const code = `
    const {ensureInitialTeacher}=await import('./lib/initial-account.ts');
    const {authenticate}=await import('./lib/local-auth.ts');
    const {db}=await import('./lib/db.ts');
    const out={};
    ${steps}
    console.log(JSON.stringify(out));
    await db.$disconnect();
  `;
  const env = {...process.env, DATABASE_URL: 'file:' + database, INITIAL_ADMIN_EMAIL: '', INITIAL_ADMIN_NAME: '', INITIAL_ADMIN_PASSWORD: '', ...initialEnv};
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], {cwd: root, env, encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return JSON.parse(result.stdout.trim().split('\n').pop());
}

function withDatabase(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'pdfquiz-initial-'));
  try { return fn(path.join(dir, 'test.db').replaceAll('\\', '/')); } finally { rmSync(dir, {recursive: true, force: true}); }
}

test('Şifre verilmezse ilk hesap oluşturulmaz', () => withDatabase(database => {
  const out = run(database, {}, `out.result=await ensureInitialTeacher();out.users=await db.user.count();`);
  assert.deepEqual(out, {result: 'skipped', users: 0});
}));

test('.env şifresiyle ilk hesap oluşur, varsayılan e-posta kullanılır ve giriş yapılabilir', () => withDatabase(database => {
  const out = run(database, {INITIAL_ADMIN_PASSWORD: password}, `
    out.first=await ensureInitialTeacher();
    out.second=await ensureInitialTeacher();
    out.users=await db.user.count();
    const ok=await authenticate('admin@local.test','${password}');
    out.login=Boolean(ok);
    out.wrong=Boolean(await authenticate('admin@local.test','yanlis-parola-12345'));
  `);
  assert.deepEqual(out, {first: 'created', second: 'exists', users: 1, login: true, wrong: false});
}));

test('Verilen e-posta ve ad kullanılır; e-posta küçük harfe çevrilir', () => withDatabase(database => {
  const out = run(database, {INITIAL_ADMIN_PASSWORD: password, INITIAL_ADMIN_EMAIL: ' Ogretmen@Example.Test ', INITIAL_ADMIN_NAME: 'Ayşe Hoca'}, `
    out.result=await ensureInitialTeacher();
    const user=await db.user.findUnique({where:{email:'ogretmen@example.test'}});
    out.name=user?.name;
  `);
  assert.deepEqual(out, {result: 'created', name: 'Ayşe Hoca'});
}));

test('Hesap varsa .env değerleri mevcut hesabı değiştirmez ve yeni hesap eklemez', () => withDatabase(database => {
  run(database, {INITIAL_ADMIN_PASSWORD: password}, `await ensureInitialTeacher();`);
  const out = run(database, {INITIAL_ADMIN_PASSWORD: 'tamamen-baska-parola-9', INITIAL_ADMIN_EMAIL: 'baska@example.test'}, `
    out.result=await ensureInitialTeacher();
    out.users=await db.user.count();
    out.oldLogin=Boolean(await authenticate('admin@local.test','${password}'));
    out.newLogin=Boolean(await authenticate('baska@example.test','tamamen-baska-parola-9'));
  `);
  assert.deepEqual(out, {result: 'exists', users: 1, oldLogin: true, newLogin: false});
}));

test('Geçersiz e-posta veya kısa şifre hata fırlatmaz, hesap oluşturmaz', () => withDatabase(database => {
  const shortPassword = run(database, {INITIAL_ADMIN_PASSWORD: 'kisa'}, `out.result=await ensureInitialTeacher();out.users=await db.user.count();`);
  assert.deepEqual(shortPassword, {result: 'invalid', users: 0});
  const badEmail = run(database, {INITIAL_ADMIN_PASSWORD: password, INITIAL_ADMIN_EMAIL: 'eposta-degil'}, `out.result=await ensureInitialTeacher();out.users=await db.user.count();`);
  assert.deepEqual(badEmail, {result: 'invalid', users: 0});
}));
