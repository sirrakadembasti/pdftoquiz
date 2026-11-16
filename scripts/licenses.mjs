// docs/lisanslar/DEPENDENCIES.md ve docs/lisanslar/vendor/ klasörünü package.json + node_modules'tan üretir.
// Kullanım:
//   node scripts/licenses.mjs           yazar (build sırasında otomatik çalışır)
//   node scripts/licenses.mjs --check   dosyalar güncel değilse hata ile çıkar (testlerde çalışır)
import {readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, existsSync, realpathSync} from 'node:fs';
import {join} from 'node:path';

const check = process.argv.includes('--check');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const pnpmVersion = String(pkg.packageManager || '').replace(/^pnpm@/, '');
const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies}).sort();

const rows = [];
const files = new Map(); // 'docs/lisanslar/vendor/dizin/dosya' -> Buffer
for (const name of names) {
  const base = realpathSync(join('node_modules', name));
  const meta = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
  const license = typeof meta.license === 'string' ? meta.license : meta.license?.type || 'Paket bildirimi';
  rows.push(`| ${name} | ${meta.version} | ${license} |`);
  for (const file of readdirSync(base).filter(n => /^(licen[sc]e|copying|notice)/i.test(n))) {
    if (statSync(join(base, file)).isFile()) {
      files.set(`docs/lisanslar/vendor/${name.replaceAll('/', '__')}/${file}`, readFileSync(join(base, file)));
    }
  }
}

const doc = [
  '# Bağımlılıklar ve lisanslar',
  '',
  'Bu dosya ve `docs/lisanslar/vendor/` klasörü `node scripts/licenses.mjs` ile `package.json` ve `node_modules` içeriğinden üretilir; elle düzenlemeyin. `build` komutu dosyaları günceller, standart test paketi güncel olup olmadığını denetler.',
  '',
  'Sürümler taşınabilir paketin doğrudan kurulan bağımlılıklarıdır. Tam transitive/işletim sistemi çözümlemesi `pnpm-lock.yaml` içindedir.',
  '',
  '| Paket | Kullanılan sürüm | Lisans |',
  '|---|---|---|',
  ...rows,
  '',
  `Paket yöneticisi: pnpm ${pnpmVersion} (MIT; depoya dahil değildir, package.json içindeki packageManager alanıyla belirtilir).`,
  '',
  '`vendor/` doğrudan paketlerin LICENSE/COPYING/NOTICE dosyalarını içerir. Her transitif paketin özgün lisansı kurulumdan sonra `node_modules` içinde korunur. Uygulamanın kendisine yeni bir açık kaynak lisansı atanmamıştır.',
  '',
  'PDF.js, Tesseract ve sunulan WASM/dil varlıkları birlikte korunmuştur. Referans sınav PDF\'leri `tests/reference/` altındadır.',
  '',
].join('\n');

// Mevcut durum
const current = new Map();
if (existsSync('docs/lisanslar/vendor')) {
  for (const dir of readdirSync('docs/lisanslar/vendor')) {
    for (const file of readdirSync(join('docs/lisanslar/vendor', dir))) {
      current.set(`docs/lisanslar/vendor/${dir}/${file}`, readFileSync(join('docs/lisanslar/vendor', dir, file)));
    }
  }
}
const problems = [];
if (!existsSync('docs/lisanslar/DEPENDENCIES.md') || readFileSync('docs/lisanslar/DEPENDENCIES.md', 'utf8') !== doc) problems.push('docs/lisanslar/DEPENDENCIES.md');
for (const [path, data] of files) if (!current.has(path) || !current.get(path).equals(data)) problems.push(path);
for (const path of current.keys()) if (!files.has(path)) problems.push(path + ' (fazla)');

if (check) {
  if (problems.length) {
    console.error('Lisans envanteri güncel değil: ' + problems.join(', ') + '\nDüzeltmek için: node scripts/licenses.mjs');
    process.exit(1);
  }
  console.log('Lisans envanteri güncel.');
} else {
  rmSync('docs/lisanslar/vendor', {recursive: true, force: true});
  for (const [path, data] of files) {
    mkdirSync(join(path, '..'), {recursive: true});
    writeFileSync(path, data);
  }
  writeFileSync('docs/lisanslar/DEPENDENCIES.md', doc);
  console.log(problems.length ? 'Lisans envanteri güncellendi: ' + problems.join(', ') : 'Lisans envanteri zaten güncel.');
}
