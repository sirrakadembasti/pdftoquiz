// DEPENDENCIES.md ve VENDOR-LICENSES/ klasörünü package.json + node_modules'tan üretir.
// Kullanım:
//   node scripts/licenses.mjs           yazar (build sırasında otomatik çalışır)
//   node scripts/licenses.mjs --check   dosyalar güncel değilse hata ile çıkar (testlerde çalışır)
import {readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, existsSync, realpathSync} from 'node:fs';
import {join} from 'node:path';

const check = process.argv.includes('--check');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const pnpmVersion = JSON.parse(readFileSync('tools/pnpm/package.json', 'utf8')).version;
const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies}).sort();

const rows = [];
const files = new Map(); // 'VENDOR-LICENSES/dizin/dosya' -> Buffer
for (const name of names) {
  const base = realpathSync(join('node_modules', name));
  const meta = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
  const license = typeof meta.license === 'string' ? meta.license : meta.license?.type || 'Paket bildirimi';
  rows.push(`| ${name} | ${meta.version} | ${license} |`);
  for (const file of readdirSync(base).filter(n => /^(licen[sc]e|copying|notice)/i.test(n))) {
    if (statSync(join(base, file)).isFile()) {
      files.set(`VENDOR-LICENSES/${name.replaceAll('/', '__')}/${file}`, readFileSync(join(base, file)));
    }
  }
}

const doc = [
  '# Bağımlılıklar ve lisanslar',
  '',
  'Bu dosya ve `VENDOR-LICENSES/` klasörü `node scripts/licenses.mjs` ile `package.json` ve `node_modules` içeriğinden üretilir; elle düzenlemeyin. `build` komutu dosyaları günceller, standart test paketi güncel olup olmadığını denetler.',
  '',
  'Sürümler taşınabilir paketin doğrudan kurulan bağımlılıklarıdır. Tam transitive/işletim sistemi çözümlemesi `pnpm-lock.yaml` içindedir.',
  '',
  '| Paket | Kullanılan sürüm | Lisans |',
  '|---|---|---|',
  ...rows,
  '',
  `pnpm: ${pnpmVersion}, MIT; tools/pnpm dağıtımının özgün lisans ve bildirimleri dahil.`,
  '',
  '`VENDOR-LICENSES` doğrudan paketlerin LICENSE/COPYING/NOTICE dosyalarını içerir. Her transitif paketin özgün lisansı kurulumdan sonra `node_modules` içinde korunur. Uygulamanın kendisine yeni bir açık kaynak lisansı atanmamıştır.',
  '',
  'PDF.js, Tesseract ve sunulan WASM/dil varlıkları birlikte korunmuştur. Referans sınav PDF\'leri `tests/reference/` altındadır.',
  '',
].join('\n');

// Mevcut durum
const current = new Map();
if (existsSync('VENDOR-LICENSES')) {
  for (const dir of readdirSync('VENDOR-LICENSES')) {
    for (const file of readdirSync(join('VENDOR-LICENSES', dir))) {
      current.set(`VENDOR-LICENSES/${dir}/${file}`, readFileSync(join('VENDOR-LICENSES', dir, file)));
    }
  }
}
const problems = [];
if (!existsSync('DEPENDENCIES.md') || readFileSync('DEPENDENCIES.md', 'utf8') !== doc) problems.push('DEPENDENCIES.md');
for (const [path, data] of files) if (!current.has(path) || !current.get(path).equals(data)) problems.push(path);
for (const path of current.keys()) if (!files.has(path)) problems.push(path + ' (fazla)');

if (check) {
  if (problems.length) {
    console.error('Lisans envanteri güncel değil: ' + problems.join(', ') + '\nDüzeltmek için: node scripts/licenses.mjs');
    process.exit(1);
  }
  console.log('Lisans envanteri güncel.');
} else {
  rmSync('VENDOR-LICENSES', {recursive: true, force: true});
  for (const [path, data] of files) {
    mkdirSync(join(path, '..'), {recursive: true});
    writeFileSync(path, data);
  }
  writeFileSync('DEPENDENCIES.md', doc);
  console.log(problems.length ? 'Lisans envanteri güncellendi: ' + problems.join(', ') : 'Lisans envanteri zaten güncel.');
}
