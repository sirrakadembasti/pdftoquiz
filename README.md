# PDF → Online Quiz

Öğretmenlerin PDF sınavlarını, soru ve şık görselleri korunarak paylaşılabilir web sınavlarına dönüştürdüğü Türkçe uygulama. Dönüşüm tarayıcıda yerel olarak yapılır (PDF.js + Tesseract OCR, `tur+eng`); isteğe bağlı AI kalite kontrolü kullanıcının kendi anahtarıyla çalışır.

**Teknoloji:** Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript; veritabanı olarak doğrudan `@libsql/client` ile yerel SQLite (şema `lib/db.ts` içinde, ilk çalıştırmada kendiliğinden oluşur). Harici hizmet veya hesap gerektirmez. PDF.js/OCR worker, WASM ve dil dosyaları `public/vendor/` altındadır; pnpm `tools/pnpm/` ile gelir.

Mimari notlar, test düzeni, referans PDF sonuçları ve bilinen sınırlar: [docs/GELISTIRICI-REHBERI.md](docs/GELISTIRICI-REHBERI.md). LLM sağlayıcı/anahtar paneli (/llm): [docs/LLM-MANAGER.md](docs/LLM-MANAGER.md). Bağımlılık lisansları: [docs/lisanslar/DEPENDENCIES.md](docs/lisanslar/DEPENDENCIES.md).

## Özellikler

- Yerel PDF dönüşümü: kapak/bölüm/soru sayısı, soru ve A–E şık kırpmaları, taranmış sayfalarda OCR, uzun metin ve biçim.
- Düzenleyici: soru/şık için metin ya da görsel gösterimi (iki bağımsız onay kutusu), tek yüzeyli metin editörü (kalın, altı çizili, liste, geri al/yinele), PDF'den soru veya şık görseli seçimi, eksik şık için öğretmen onaylı öneri.
- Cevap anahtarı: PDF'den, Markdown/Excel/tablo yapıştırmadan veya görsel anahtardan (OCR); soru bazlı eşleşme tablosu ve onaylı toplu aktarım.
- Hibrit AI kalite kapısı (Gemini/OpenAI/OpenRouter): önce yerel geçiş, sorunlu alanlar için çağrı tahmini onayı, kabul/ret/geri alma. AI anahtarı yalnız sekme belleğinde tutulur; diske yazılmaz.
- Öğrenci sınavı paylaşım bağlantısıyla; puanlama sunucuda yapılır, öğrenciye doğru cevap, anahtar veya kaynak PDF gönderilmez. Sonuç puanı yalnız cevap anahtarı olan sorulardan hesaplanır.
- Gece modu, hesap/oturum yönetimi, yedekleme.

**Sınırlar:** 20 MB / 100 sayfa PDF, 300 soru, 1200 farklı görsel, sınav JSON'u 24 MiB. Taranmış belgelerde öğretmen kontrolü beklenir. Paylaşım için tüm doğru cevaplar ve kontrol onayı gerekir. HTTPS olmadan bazı tarayıcılarda pano gibi özellikler sınırlanabilir.

## LLM Manager paneli (isteğe bağlı)

`/llm` adresinde, yapay zekâ sağlayıcı/model/API anahtarı profillerini yöneten ayrı bir panel vardır (`@sirrakadembasti/llm-manager` paketi). Giriş için `.env` içine `LLM_ADMIN_USER` ve `LLM_ADMIN_PASSWORD` yazılır (`.env.example`'da var); parola yoksa panel `AUTH_NOT_CONFIGURED` hatası verir. Şu an düzenleyicideki AI düğmeleri bu paneli kullanmaz; onlar sekmeye girilen anahtarla çalışır. Kurulum, kullanım ve sorun giderme: [docs/LLM-MANAGER.md](docs/LLM-MANAGER.md).

## Kurulum (Windows)

Node.js 24 LTS önerilir (>=22.13). Paketteki pnpm kullanılır, global kurulum gerekmez. İlk paket indirme için internet gerekir; `node_modules` işletim sistemine bağlı olduğundan depoda yoktur.

```powershell
git clone https://github.com/sirrakadembasti/pdftoquiz.git
cd pdftoquiz
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs dev
```

http://localhost:3000 adresini açın. İlk kurulum terminalde öğretmen e-postası ve şifresini gösterir; kaydedin ve http://localhost:3000/account üzerinden giriş yapın.

Çift tıklama ile: `scripts/windows/KURULUM-WINDOWS.cmd`, `scripts/windows/CALISTIR-GELISTIRME.cmd`, `scripts/windows/CALISTIR-URETIM.cmd` (gerçek çift tıklama davranışı ayrıca sınanmamıştır).

## Üretim / Linux sunucu

```sh
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs build
node tools/pnpm/dist/pnpm.mjs start
```

Üretim sunucusu varsayılan olarak `127.0.0.1:3000` dinler; farklı port için `PORT`, ağ erişimi için `HOSTNAME` ortam değişkenini kullanın. Geliştirme sunucusu (`dev`) `package.json` içindeki betikle `127.0.0.1:3000` üzerinde açılır; adres veya portu değiştirmek için o betikteki `--hostname`/`--port` değerlerini düzenleyin. Aynı klasörde aynı anda yalnız bir `dev` sunucusu çalışır (ikincisi "Another next dev server is already running" der). İnternete açarken Nginx/Caddy gibi bir ters vekil arkasında çalıştırın ve `.env` içinde `APP_ORIGIN=https://alan-adiniz` (tam adres; origin kontrolü bunu kullanır) ile `COOKIE_SECURE=true` ayarlayın. Ters vekil `Host` ile `X-Forwarded-Host/Proto/For` başlıklarını iletmeli, istek gövdesi sınırını PDF ve görseller için yeterince yüksek tutmalı ve HTTPS sağlamalıdır. Alan adını değiştirmek sınav verilerini değiştirmez; paylaşım bağlantılarını yeni adresle yeniden kopyalayın.

Windows'ta `build`, pnpm bağımlılık bağlantılarını ve SQLite yerel paketini `scripts/standalone-links.mjs` ile standalone çıktısına tamamlar; yalnız `next build` çağırmak bu adımı atlar, `build` komutunu kullanın.

## Hesaplar, veri ve yedek

- Kayıt, düzenleme, kaynak PDF, sonuç listesi ve AI isteği için öğretmen hesabı gerekir; öğrenci yalnız paylaşım bağlantısıyla katılır.
- Şifre scrypt hash'i olarak, oturum rastgele tokenın SHA-256 hash'i olarak SQLite'ta tutulur. Cookie HttpOnly/SameSite (HTTPS'te Secure). Aynı e-posta için 15 dakika içinde 8 hatalı girişten sonra giriş, süre dolana kadar reddedilir. Değiştiren isteklerde `Origin` başlığı uygulamanın adresiyle (`APP_ORIGIN` ya da istek adresi) eşleşmelidir.
- Tablolar: `User`, `Session`, `LoginLimit`, `StoredObject`. Sınav JSON'u, PDF, görseller ve sonuçlar `data/quiz.db` içindedir (`.env` içindeki `DATABASE_URL` ile değiştirilebilir). Depoda gerçek kullanıcı verisi, oturum veya API anahtarı yoktur.
- `INITIAL_ADMIN_PASSWORD` yalnız ilk hesap oluşturulurken kullanılır (12–256 karakter; boşsa rastgele üretilir); `.env`'i sonradan değiştirmek mevcut şifreyi değiştirmez.
- Yeni öğretmen: `node tools/pnpm/dist/pnpm.mjs user:add`. Şifre sıfırlama: `user:reset` (eski oturumları da iptal eder). Şifre terminalde gösterilir.
- Yedek: `node tools/pnpm/dist/pnpm.mjs backup` → `backups/` altında (`BACKUP_DIR` ile değiştirilebilir) `quiz-<tarih>.db` SQLite snapshot'ı (PDF ve görseller dahil). Taşımak için yeni uygulamayı kurup durdurun, veritabanı dosyasını yedekle değiştirin. Tarayıcı IndexedDB taslakları başka alan adına kendiliğinden taşınmaz.

## Testler

```sh
node tools/pnpm/dist/pnpm.mjs typecheck
node tools/pnpm/dist/pnpm.mjs test           # sentetik fixture'larla standart paket
node tools/pnpm/dist/pnpm.mjs build
node tools/pnpm/dist/pnpm.mjs test:server    # gerçek Next sunucusu + SQLite (önce build)
```

`test` harici belge istemez, atlanan teste izin vermez ve `docs/lisanslar` güncel değilse durur. Belgeye özgü kabul kontrolleri ayrıdır (`test:acceptance`, dört `*_REFERENCE_*` yolu ister). Ayrıntılar: [geliştirici rehberi](docs/GELISTIRICI-REHBERI.md).

### Referans PDF'ler

`tests/reference/` altında üç gerçek sınav PDF'i vardır (`grup-36---programci.pdf` taranmış; `saglik2017programci.pdf` ve `hacettepe_programci_2014.pdf` dijital). Standart pakete dahil değildir; gerçek dönüşüm hattını (PDF.js + yerel OCR, AI yok) sınamak içindir:

```sh
node scripts/convert-reference.mjs                  # üç PDF; özet + JSON .test-tmp/reference altına
node scripts/convert-reference.mjs baska-sinav.pdf  # istenen PDF
node tools/pnpm/dist/pnpm.mjs test:ocr              # OCR ölçümü
```

### Tanılama ve ölçüm araçları

```sh
node scripts/replay-diagnostics.mjs paket.json sonuc.json          # öğretmen düzenleyicisinden indirilen tanılama paketini OCR'sız yeniden çözümler (sınav metni içerir)
node scripts/measure-resilience.mjs 30 .audit/resilience-30.json   # sentetik bellek ölçümü
node scripts/measure-leakage.mjs kaynak.pdf ogretmen-taslagi.json sonuc.json   # yerel sızıntı ölçümü
```

## Kaynaklar

- https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- https://github.com/mozilla/pdf.js
- https://github.com/naptha/tesseract.js
