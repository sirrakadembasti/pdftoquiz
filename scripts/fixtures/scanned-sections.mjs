// tests/fixtures/scanned-sections.pdf üreteci: anonim, sentetik, yalnız görüntülerden oluşan (metin katmanı yok) bir sınav.
// Gerçek bir belgenin benzeri değil, aynı yapı sinyallerinin taşıyıcısıdır (YOL-HARITASI madde 25):
// kapakta "DERS ADI / SAYFA" tablosu ve "Her ders için N soru", kutulu ders başlıkları, iki sütun, 2×2 ızgara şıklar,
// belge boyunca kesintisiz numaralar ve dört sütunlu cevap anahtarı sayfası.
// Kullanım: node scripts/fixtures/scanned-sections.mjs [çıktı.pdf]  (yazı tipi: Arial; çıktı repoya eklenir, testler bu dosyayı okur)
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const require = createRequire(path.join(root, 'package.json'));
const {createCanvas} = createRequire(require.resolve('pdfjs-dist/package.json'))('@napi-rs/canvas');

// [ders, [soru, [şıklar], doğru şık indeksi][]]; anahtar bu indekslerden yazılır.
export const courses = [
  ['VERİ TABANI YÖNETİMİ', [
    ['Tablodaki her satırı benzersiz biçimde tanımlayan alan hangisidir?', ['Birincil anahtar', 'Yabancı anahtar', 'Dizin', 'Görünüm'], 0],
    ['SQL dilinde kayıt silmek için hangi komut kullanılır?', ['INSERT', 'DELETE', 'UPDATE', 'SELECT'], 1],
    ['İki tabloyu ortak alana göre birleştiren işlem hangisidir?', ['GROUP BY', 'ORDER BY', 'JOIN', 'HAVING'], 2],
    ['Sorgu sonucunu sıralamak için hangi ifade kullanılır?', ['WHERE', 'LIMIT', 'DISTINCT', 'ORDER BY'], 3],
    ['Bir sütundaki değerlerin ortalamasını veren işlev hangisidir?', ['AVG', 'SUM', 'MAX', 'COUNT'], 0],
    ['Tekrarlayan veriyi azaltma sürecine ne ad verilir?', ['İndeksleme', 'Normalizasyon', 'Yedekleme', 'Şifreleme'], 1],
  ]],
  ['AĞ TEMELLERİ', [
    ['Alan adlarını IP adresine çeviren hizmet hangisidir?', ['DHCP', 'FTP', 'DNS', 'SMTP'], 2],
    ['Cihazlara otomatik IP adresi dağıtan protokol hangisidir?', ['HTTP', 'SNMP', 'ARP', 'DHCP'], 3],
    ['OSI modelinde yönlendirme hangi katmanda yapılır?', ['Ağ', 'Fiziksel', 'Oturum', 'Sunum'], 0],
    ['Güvenli web trafiği için kullanılan protokol hangisidir?', ['TELNET', 'HTTPS', 'POP3', 'TFTP'], 1],
    ['Aynı ağdaki cihazları birbirine bağlayan aygıt hangisidir?', ['Modem', 'Tarayıcı', 'Anahtar', 'Yazıcı'], 2],
    ['IPv4 adresi kaç bitten oluşur?', ['16', '64', '128', '32'], 3],
  ]],
  ['WEB PROGRAMLAMA', [
    ['Sayfa yapısını tanımlayan işaretleme dili hangisidir?', ['HTML', 'CSS', 'SQL', 'JSON'], 0],
    ['Sayfanın görünümünü biçimlendiren dil hangisidir?', ['PHP', 'CSS', 'XML', 'C'], 1],
    ['Tarayıcıda çalışan betik dili hangisidir?', ['Java', 'Python', 'JavaScript', 'Go'], 2],
    ['Bağlantı oluşturan HTML etiketi hangisidir?', ['div', 'span', 'img', 'a'], 3],
    ['Sunucudan veri istemek için kullanılan HTTP yöntemi hangisidir?', ['GET', 'PUT', 'DELETE', 'PATCH'], 0],
    ['Başarılı bir HTTP isteğinin durum kodu hangisidir?', ['404', '200', '500', '301'], 1],
  ]],
  ['İŞLETİM SİSTEMLERİ', [
    ['Çalışmakta olan programa ne ad verilir?', ['Dosya', 'Sürücü', 'Süreç', 'Dizin'], 2],
    ['Bellek yetmediğinde diskte kullanılan alan hangisidir?', ['Önbellek', 'Kayıt', 'Yazmaç', 'Sanal bellek'], 3],
    ['Donanım ile yazılım arasındaki çekirdek bileşen hangisidir?', ['Kernel', 'Kabuk', 'Derleyici', 'Editör'], 0],
    ['Dosyaları düzenleyen yapıya ne ad verilir?', ['Kuyruk', 'Dosya sistemi', 'Yığın', 'Tampon'], 1],
    ['Birden çok işin aynı anda yürütülmesine ne denir?', ['Yedekleme', 'Biçimlendirme', 'Çoklu görev', 'Sıkıştırma'], 2],
    ['Yeni donanımı tanıtan yazılıma ne ad verilir?', ['Uygulama', 'Oyun', 'Virüs', 'Sürücü'], 3],
  ]],
];

// Şıklar soru başına farklı miktarda döndürülür: anahtar düzenli (ABCD…) olmaz, kaydırmalı eşleme hataları yakalanır.
const rotations = [0, 2, 1, 3, 3, 0, 1, 2, 2, 1, 0, 3, 1, 3, 2, 0, 0, 1, 3, 2, 3, 0, 2, 1];
let serial = 0;
for (const [, questions] of courses) for (const q of questions) { const r = rotations[serial++]; q[1] = [...q[1].slice(r), ...q[1].slice(0, r)]; q[2] = (q[2] - r + 4) % 4; }
export const answerKey = courses.flatMap(([, qs]) => qs.map(q => 'ABCD'[q[2]])).join('');

const W = 1191, H = 1684, PT = [595, 842]; // A4, 144 DPI
const font = (size, bold = false) => `${bold ? 'bold ' : ''}${size}px Arial`;
function page(draw) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; g.strokeStyle = '#111'; g.textBaseline = 'top';
  draw(g);
  return c.encodeSync('jpeg', 70);
}
function wrap(g, text, width) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) { const next = line ? line + ' ' + word : word; if (g.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next; }
  return [...lines, line];
}
const center = (g, text, y) => g.fillText(text, (W - g.measureText(text).width) / 2, y);

// PDF baytlarını üretir; dosyaya yalnız betik doğrudan çalıştırıldığında yazılır (testler courses/answerKey'i içe aktarır).
export function buildPdf() {
const pages = [];
// 1. Kapak: başlık, kitapçık, soru sayısı, DERS ADI / SAYFA tablosu, ders başına soru sayısı.
pages.push(page(g => {
  g.font = font(34, true); center(g, 'DENEME MESLEKİ SERTİFİKA SINAVI', 160);
  g.font = font(28, true); center(g, 'B TEST KİTAPÇIĞI', 230);
  g.font = font(24); center(g, 'Soru Sayısı: 24     Sınav Süresi: 40 dakika', 300);
  const x0 = 260, x1 = 760, x2 = 930, top = 400, row = 64;
  g.lineWidth = 2; g.strokeRect(x0, top, x2 - x0, row * (courses.length + 1));
  for (let i = 1; i <= courses.length; i++) { g.beginPath(); g.moveTo(x0, top + row * i); g.lineTo(x2, top + row * i); g.stroke(); }
  g.beginPath(); g.moveTo(x1, top); g.lineTo(x1, top + row * (courses.length + 1)); g.stroke();
  g.font = font(24, true); g.fillText('DERS ADI', x0 + 20, top + 20); g.fillText('SAYFA', x1 + 40, top + 20);
  g.font = font(24); courses.forEach(([name], i) => { g.fillText(name, x0 + 20, top + row * (i + 1) + 20); g.fillText(String(i + 2), x1 + 70, top + row * (i + 1) + 20); });
  g.font = font(24); g.fillText('Her ders için 6 soru bulunmaktadır.', x0, top + row * (courses.length + 1) + 50);
  g.fillText('Her sorunun dört seçeneği vardır.', x0, top + row * (courses.length + 1) + 100);
}));
// 2–5. Soru sayfaları: kutulu ders başlığı, iki sütun, her sütunda 3 soru, 2×2 ızgara şıklar; numaralar kesintisiz.
let number = 1;
for (const [name, questions] of courses) pages.push(page(g => {
  g.lineWidth = 3; g.strokeRect(90, 80, W - 180, 70); g.font = font(28, true); center(g, name, 100);
  g.lineWidth = 1; g.beginPath(); g.moveTo(W / 2, 190); g.lineTo(W / 2, H - 120); g.stroke();
  questions.forEach(([text, options], i) => {
    const x = i < 3 ? 100 : W / 2 + 30, colWidth = W / 2 - 150; let y = 210 + (i % 3) * 460;
    g.font = font(23, true); const label = number++ + '. '; g.fillText(label, x, y);
    g.font = font(23); const indent = g.measureText(label).width + 6;
    for (const line of wrap(g, text, colWidth - indent)) { g.fillText(line, x + indent, y); y += 34; }
    y += 30;
    options.forEach((o, k) => g.fillText(`${'ABCD'[k]}) ${o}`, x + indent + (k % 2) * 230, y + Math.floor(k / 2) * 56));
  });
}));
// 6. Cevap anahtarı: dört sütun, her sütunda 6 satır "N. X".
pages.push(page(g => {
  g.font = font(30, true); center(g, 'B TEST KİTAPÇIĞI CEVAP ANAHTARI', 140);
  const answers = [...answerKey];
  g.font = font(26);
  answers.forEach((a, i) => g.fillText(`${i + 1}. ${a}`, 170 + Math.floor(i / 6) * 240, 280 + (i % 6) * 80));
}));

// Görüntü sayfalı en küçük PDF: her sayfa tek bir JPEG (DCTDecode), tam sayfa çizilir.
const chunks = [], offsets = []; let length = 0;
const push = b => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1'); chunks.push(buf); length += buf.length; };
const obj = (n, body, stream) => { offsets[n] = length; push(`${n} 0 obj\n${body}\n`); if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); } push('endobj\n'); };
push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
obj(1, '<</Type/Catalog/Pages 2 0 R>>');
obj(2, `<</Type/Pages/Kids[${kids}]/Count ${pages.length}>>`);
pages.forEach((jpeg, i) => {
  const p = 3 + i * 3, content = `q ${PT[0]} 0 0 ${PT[1]} 0 0 cm /Im0 Do Q`;
  obj(p, `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PT[0]} ${PT[1]}]/Resources<</XObject<</Im0 ${p + 2} 0 R>>>>/Contents ${p + 1} 0 R>>`);
  obj(p + 1, `<</Length ${content.length}>>`, content);
  obj(p + 2, `<</Type/XObject/Subtype/Image/Width ${W}/Height ${H}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>`, jpeg);
});
const count = 3 + pages.length * 3, xref = length;
push(`xref\n0 ${count}\n0000000000 65535 f \n` + Array.from({length: count - 1}, (_, i) => String(offsets[i + 1]).padStart(10, '0') + ' 00000 n \n').join(''));
push(`trailer\n<</Size ${count}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`);
return Buffer.concat(chunks);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || path.join(root, 'tests/fixtures/scanned-sections.pdf'), bytes = buildPdf();
  fs.writeFileSync(out, bytes);
  console.log(`${path.relative(root, out)}: ${bytes.length} bayt, anahtar ${answerKey}`);
}
