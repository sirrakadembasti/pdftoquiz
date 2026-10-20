import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const page=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
const css=fs.readFileSync(path.join(root,'app/globals.css'),'utf8');
const tools=fs.readFileSync(path.join(root,'lib/manual-option-tools.tsx'),'utf8');

test('PDF kırpma yönergesi seçili hedefi ve gerçek onay adımını açıklar',()=>{
 assert.match(page,/Seçili hedef: \{targetLabel/);
 assert.match(page,/1\. Hedefi seçin · 2\. PDF alan seçim aracını açın · 3\. Alanı sürükleyip önizleyin · 4\. Hedef alanına ekleyin/);
 assert.match(page,/`Soru \$\{q\?\.number \?\? current \+ 1\} — \$\{cropTarget === 'question'/);
 assert.match(page,/alanına ekle/);
 assert.doesNotMatch(page,/İlgili soru veya şık alanını sürükleyerek seçin/);
});

test('Sonuç görünümü değerlendirilebilir ve toplam soru sayılarını ayırır',()=>{
 assert.match(page,/result\.total\} değerlendirilebilir soru/);
 assert.match(page,/Toplam \{result\.all\} soru/);
 assert.match(page,/anahtarsız soru puanlamaya katılmadı/);
});

test('Uzun kalite listeleri varsayılan kapalıdır ve gece durumları okunur renklere sahiptir',()=>{
 assert.doesNotMatch(page,/<details open>/);
 assert.match(page,/hybrid-notices/);
 assert.match(css,/\[data-theme=dark\] \.question-nav button\.reviewed/);
 assert.match(css,/\[data-theme=dark\] \.question-quality-status\.pending/);
});

test('Şık güvenli önizlemesi bir kez görünür; kaynak karşılaştırması kapalı bölümdedir',()=>{
 assert.doesNotMatch(tools,/\{imagePreview\}\{clean&&<img/);
 assert.match(tools,/Kaynak kırpımıyla karşılaştır/);
});

test('Placeholder actions wrap inside the narrow editor viewport',()=>{
 assert.match(css,/@media\(max-width:640px\)\{\.edit-fields>\.alert\{flex-wrap:wrap\}/);
 assert.match(css,/\.edit-fields>\.alert \.btn\{max-width:100%;white-space:normal\}/);
});
