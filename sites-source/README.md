# PDF → Online Quiz

Güncel sürüm: **2.0.9 — 9 Ekim 2026, Faz 3C ara kontrol devamı**.

Öğretmen PDF sınavını yerel, AI veya hibrit yöntemle dönüştürür; metin/şık/görselleri düzeltir, cevap anahtarını önizleyip uygular ve sınavı öğrenci bağlantısıyla paylaşır. Sonuç doğru/yanlış/boş ve 100 üzerinden puandır. Ana tasarım, yerel akış ve kayıt biçimi korunur.

## İki çalışma profili

| Profil | Çalışma ortamı | Kimlik | Kalıcı veri |
|---|---|---|---|
| Sites (bu repo kökü) | Vinext/Vite → Cloudflare Worker | ChatGPT oturumu | R2 JSON, PDF ve görseller |
| Taşınabilir ZIP | Next.js / Node.js | Yerel öğretmen oturumu | Prisma ORM 7 / SQLite |

ZIP profilinde kaynakları yeniden yazmak yerine aynı app/lib/public dosyaları aktarılır; yalnız platform bağımlı oturum/depolama, derleme ve dağıtım katmanı uyarlanır. `portable/template` yerel adaptör ve kurulum kaynaklarıdır; `portable/pnpm-lock.yaml` doğrulanmış bağımlılık kilididir. Aktarım betiği `scripts/export-portable.mjs` bu kaynaklarla paketi üretir. `.env`, gerçek veriler, oturumlar, Git kimlik bilgileri ve node_modules aktarılmaz. Telifli referans PDF repoda bulunmaz.

## Güncel özellikler

- PDF.js dijital metin/konum; Türkçe/İngilizce yerel Tesseract OCR; iki sütun ve sayfa devamı.
- Kapak/bilgilendirme/talimat/soru/anahtar/boş sayfa ayrımı; 4/5 şık, dersler, beklenen sayı/süre/kitapçık ve geri alınabilir ayrılan bloklar.
- Soru/şık görselleri, büyütme, kontrollü manuel kırpma; madde/paragraf, hece birleştirme ve güvenilir vurgu bilgisi.
- Markdown/Excel/CSV/dersli toplu anahtar ve görsel anahtar OCR'ı; kitapçık/şık/sayı kontrolü ve onay önizlemesi.
- Hibrit kalite kapısı: şık eksikliği, OCR <0.65, sınır uyarısı, formül/şekil, boş metin, beklenen sayı. Temiz alanlar AI'ya gönderilmez.
- Gönderim onayı ve çağrı tahmini; Otomatik / Yerel-önce / AI-önce; yerel/AI/manuel kaynak, güven ve koordinat metadata.
- Manuel alan kilitleri, dijital yerel–AI farkı, kabul/ret/geri al; parçalı yedekleme, 2 eşzamanlı çağrı, en fazla 3 deneme, geri çekilme ve iptal.
- API anahtarı yalnız sekme belleğinde; kaynak PDF ve doğru cevaplar öğrenci başlangıç yanıtında bulunmaz. Öğrenci sonucu sunucuda hesaplanır.

20 MB/100 sayfa, 300 soru, 600 farklı görsel sınırları vardır. Paylaşım için bütün doğru cevaplar ve öğretmen kontrol onayı gereklidir. AI/OCR güvenleri heuristiktir; kaynak kontrolü gerekir.

## ZIP ile yerel çalışma

ZIP'i `D:\dnm\pdf-to-onlinequiz` içine açın. Node.js 24 LTS kurulu olmalı. Pakette pnpm vardır; yönetici/global pnpm kurulumu gerekmez. İlk kurulum paketleri internetten indirir.

```powershell
cd D:\dnm\pdf-to-onlinequiz
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs dev
```

http://localhost:3000 · öğretmen girişi `/account`. İlk hesabın şifresi kurulum terminalinde gösterilir. Üretim için build ve start; başka sunucu için Docker Compose, kalıcı SQLite volume ve Nginx örneği ZIP'tedir. Ayrıntılı komutlar, hesap/yedek yönetimi ve sınırlar ZIP README'sindedir.

Taşınabilir kaynak üretimi (repo geliştiricisi):

```sh
PORTABLE_PNPM_BUNDLE=/path/to/pnpm-11.25.0/package node scripts/export-portable.mjs /absolute/empty/output
```

Çıktıya resmi pnpm dağıtımının tamamı eklenmelidir. Geliştirici çıktı README'sindeki kurulum/testleri çalıştırır. Sites'teki özel kayıtlar yeni SQLite'ya otomatik taşınmaz.

## Sites profili geliştiricisi

Kök package.json ve pnpm-lock.yaml mevcut Sites sürümünün test edilen paketlerini korur. Temiz klonda portable çalışma profili varsayılır; yayın derlemesi Sites helper ile hazırlanır. Cloudflare/ChatGPT katmanı genel Node.js sunucusunda kendiliğinden çalışmaz; yerel kullanım için ZIP profili seçin.

```sh
pnpm install --frozen-lockfile
pnpm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm build
```

Gerçek kabul dosyaları isteğe bağlı: `REFERENCE_PDF=/path/5_sinifA_26_compressed.pdf` ve `REFERENCE_KEY_IMAGE=/path/key.png`. Gerçek belge/görseller repoda yoktur. Normal testler özgün sentetik PDF/OCR, mock AI/kimlik/depolama ve React olaylarını kullanır. Gerçek tarayıcı ve canlı sağlayıcı sonucu bu testlerden çıkarılamaz.

## Bağımlılık politikası

Taranmış sayfalarda şık onarımı OCR kelime/karakter kutuları, komşu harf sırası ve sütun içi geometri kullanır. Numara okunamayan ikinci şık dizisi önceki sorunun şıklarını ezmez; öğretmen incelemesi için ayrılır. Uygulamadaki yerel dönüşüm, sıra boşluklarına küçük 300 DPI numara şeritleriyle ikinci geçiş yapar; mevcut worker/PSM/dil ayarları korunur, tam sayfa OCR süresinin %7'si hedef bütçedir. Tek OCR çağrısı bitmeden kesilemediği için bu bir kesin zaman aşımı değildir. `convertPDF` doğrudan çağrılarında bu geçiş geriye uyum için isteğe bağlıdır (`recoverNumberGaps: true`).

Seyrek tarama lekeleri boş sayfa olarak ayrılır. Başlıksız `Soru - 1 E ... Soru - 26 B` tablosu PDF cevap anahtarı önerisi üretir; öğretmen eşleşme önizlemesi ve onayı olmadan uygulanmaz. Öğrenci/AI görsellerindeki kırmızı temizleme korunur. Beş harf bulunması, OCR metninin doğru veya eksiksiz olduğunu kanıtlamaz; içerik ve sıra çıkarımı sayıları düzenleyicide ayrıca gösterilir.

OCR kıyaslaması: `TAPU_REFERENCE_PDF=/path/tapu.pdf REAL_REFERENCE_PDF=/path/scan.pdf pnpm test:ocr`. `OCR_GAP_REPAIR=0` ikinci geçişi ölçüm için kapatır. `OCR_VARIATIONS=shift-minus3,shift-plus3,skew-minus1,skew-plus1,margin-inset,margin-outset,combined` saf JS varyasyonlarını üretir; PDF/binary repoya eklenmez. Referanslarla tam test: `TAPU_REFERENCE_PDF=... REAL_REFERENCE_PDF=... REAL_GAP_REPAIR=1 pnpm test`.

Taşınabilir profil Next 16.4.0, React 19.3.0, Tailwind 4.3.3 ve Lucide 1.52.0'a güncellendi; yeni Prisma 7.10.0 SQLite adaptörüyle çalışır. PDF.js 5.4.296 ve Tesseract 5.1.1, eşleşen worker/WASM/dil varlıkları ve regresyonları nedeniyle korunur. pnpm 11.25.0 JavaScript paketi taşınabilirlik için kullanılır. Major sürümler yalnız sürüm numarası yükseltmek amacıyla değiştirilmez. Tüm taşınabilir bağımlılıklar frozen lock ile tekrar kurulabilir.

## Belgeler

- Taşınabilir paket README, DEPENDENCIES, TEST-REPORT, VERSION ve SHA256 manifesti.
- Önceki incelemeler: `docs/arayuz-test-raporu.md`, `docs/son-sik-hata-raporu.md`, `docs/pdf-cozumleme-raporu.md`.
- Tarihsel değişiklik notları: `docs/README-history.md`; güncel kurulum için bu README ve ZIP README'sini kullanın.
- Resmi teknik kaynaklar: https://nextjs.org/docs/app/api-reference/config/next-config-js/output ve https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite .


## FAZ 3F doğrulaması

Gösterim, sızıntı ölçümü, sıra/kırpma ve doğrulama sınırları: [FAZ 3F raporu](docs/phase3f.md). Yeni regresyonlar standart `test` komutuna dahildir. Yerel ölçüm: `node scripts/measure-leakage.mjs kaynak.pdf ogretmen-taslagi.json sonuc.json`; anahtar yalnız yerel ölçümde kullanılır. Gerçek tarayıcı/mobil, bağımsız gerçek 49 sorulu OCR, Tapu A ve OOM doğrulanamadı.


## Güncel PDF düzenleyicisi

Checkbox gösterim tercihleri, birleşik basit metin editörü, PDF kırpma hedefleri ve soru bazında cevap anahtarı tablosu: [düzenleyici değişiklikleri ve doğrulama](docs/editor-simplification.md). Yeni testler standart `test` komutuna dahildir.


## FAZ 3G — 12 Ekim 2026

Şık başına elle kırp/yükle, 250 DPI aday önizlemesi, açık güvenli kopya onayı ve şık metnine erişim eklendi. Boş şık/yer tutucu uyarıları yalnız öğretmenin ilgili tamamlamasıyla güncellenir. Eski tam görselin elle yenilenen şıkları veya yeniden dönüştürmede güvenli gövdeyi atlaması engellendi. OCR/3C/kırmızı eşik ve bağımlılıklar değişmedi.

[FAZ 3G raporu](docs/phase3g.md) her madde için bulgu, kanıt, değişiklik ve sonucu; 50 soru envanterini ve normalize sızıntı ölçümünü içerir. 43 soruda geometri yeterli, 7 soru ölçülemedi. Normalize sonuçlar sızıntısızlık kanıtı değildir. Bağımsız 49/Tapu kaynakları bulunamadı; gerçek tarayıcı giriş ve PDF yükleme simülasyonu bağlantı zaman aşımı nedeniyle tamamlanmadı. Gereken girdiler raporda yazılıdır.

## Güncel geliştirmeler

- Soru ve şık görüntüsü için iki bağımsız checkbox; varsayılan işaretsiz/metin. Şık tercihi soru metninin altında, cevapların hemen üstündedir. Eksik veya güvenli olmayan görsel sessizce başka moda geçmez; kontrol uyarısı verir.
- Soru metni ve dönüştürülmüş görünüm tek basit editörde: kalın, altı çizili, liste, geri al/yinele ve biçim temizleme. Metin/biçimler önizleme ve yayında aynı veriden gösterilir.
- PDF alan seçimi soru veya A–E şık görseli yuvasına aktarılır. Boş yuvalardan da hedef seçilebilir; görsel eklemek gösterim checkbox'ını açmaz.
- Toplu cevap anahtarı giriş alanı ve gösterim alanı, tespit edilen soru sayısına göre satırları gösterir. PDF'den tespit edilen ve uygulanan/manuel cevap ayrıdır; görsel ve manuel giriş korunur. Programcı referans dönüşümünde 50 satır/50 tespit, 0 otomatik uygulama doğrulandı.
- Numara sıralaması, komşu kırpma/üst-alt bant kontrolleri, eşit marker maskesi ve açık kalem izi onayı korunur. Öğrenci yanıtı doğru cevap/anahtar/orijinal PDF içermez.
- Tarayıcı tarafından body'ye eklenen nitelikler için dar hydration istisnası eklendi; alt bileşen uyuşmazlıkları bastırılmaz. Ayrıntılar: [hydration incelemesi](docs/hydration-and-git.md).

Gerçek tarayıcı/native metin araçları ve mobil yerleşim doğrulanamadı; otomatik test sonuçları bu kontrollerin yerine geçmez. Güncel kanıtlar [TEST-REPORT.md](TEST-REPORT.md), [düzenleyici raporu](docs/editor-simplification.md) ve [Faz 3F raporu](docs/phase3f.md) içindedir.

