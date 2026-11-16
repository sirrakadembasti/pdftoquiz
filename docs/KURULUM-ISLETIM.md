# Kurulum ve işletim — kurulum, üretim, hesaplar, veri ve yedek

Kısa başlangıç için [README](../README.md). Test, geliştirme ve bağımlılık sorunları için [GELISTIRICI-REHBERI.md](GELISTIRICI-REHBERI.md); `/llm` paneli için [LLM-MANAGER.md](LLM-MANAGER.md).

## 1. Kurulum (Windows)

Node.js 24 LTS önerilir (>=22.13). Paket yöneticisi pnpm 11.25.0'dır (`package.json` içindeki `packageManager` alanı). Yoksa `corepack enable` (Node ile gelir; ilk kullanımda indirir) ya da `npm install -g pnpm@11.25.0` ile kurun. `bun run` ve `npm run` da `package.json` betiklerini çalıştırır, ama kilit dosyası pnpm'e aittir. İlk paket indirme için internet gerekir; `node_modules` işletim sistemine bağlı olduğundan depoda yoktur.

Komutlar [README](../README.md) içindeki "Hızlı başlangıç" bölümündedir (`git clone`, `pnpm install`, `.env` kopyalama, `pnpm dev`).

`pnpm install` bağımlılıkları kilit dosyasına göre kurar. SQLite dosyası (`data/quiz.db`) ve şeması ilk çalıştırmada kendiliğinden oluşur.

**İlk öğretmen hesabı:** Hesap olmadan giriş yapılamaz (kayıt sayfası yoktur). Sunucu her açılışta (`instrumentation.ts` → `lib/initial-account.ts`) veritabanında hiç hesap yoksa ve `.env` içinde `INITIAL_ADMIN_PASSWORD` doluysa hesabı kendisi oluşturur: e-posta `INITIAL_ADMIN_EMAIL` (varsayılan `admin@local.test`), ad `INITIAL_ADMIN_NAME` (varsayılan `Öğretmen`). Şifre 12–256 karakter, e-posta geçerli olmalıdır; aksi hâlde sunucu açılır, günlüğe uyarı yazar ve hesap oluşturmaz. Şifre boşsa hiçbir şey yapılmaz; bu durumda `pnpm user:add` ile hesap oluşturun. Hesap bir kez oluşunca bu üç değer yok sayılır; `.env`'i değiştirmek giriş bilgisini değiştirmez.

`.env` dosyası git dışıdır; şifre düz metin olarak orada durur. İlk girişten sonra satırı silebilirsiniz, hesap veritabanında kalır.

Çift tıklama ile: `scripts/windows/CALISTIR-GELISTIRME.cmd`, `CALISTIR-URETIM.cmd` (çift tıklama davranışı ayrıca sınanmamıştır).

`dev` sunucusu `package.json` içindeki betikle `127.0.0.1:3000` üzerinde açılır; adres veya portu değiştirmek için betikteki `--hostname`/`--port` değerlerini düzenleyin. Aynı klasörde aynı anda yalnız bir `dev` sunucusu çalışır (ikincisi "Another next dev server is already running" der).

## 2. Üretim / Linux sunucu

```sh
pnpm install
pnpm build
pnpm start
```

Üretim sunucusu varsayılan olarak `127.0.0.1:3000` dinler; farklı port için `PORT`, ağ erişimi için `HOSTNAME` ortam değişkenini kullanın. İnternete açarken Nginx/Caddy gibi bir ters vekil arkasında çalıştırın ve `.env` içinde `APP_ORIGIN=https://alan-adiniz` (tam adres; origin kontrolü bunu kullanır) ile `COOKIE_SECURE=true` ayarlayın. Ters vekil `Host` ile `X-Forwarded-Host/Proto/For` başlıklarını iletmeli, istek gövdesi sınırını PDF ve görseller için yeterince yüksek tutmalı ve HTTPS sağlamalıdır. Alan adını değiştirmek sınav verilerini değiştirmez; paylaşım bağlantılarını yeni adresle yeniden kopyalayın.

Windows'ta `build`, pnpm bağımlılık bağlantılarını ve SQLite yerel paketini `scripts/standalone-links.mjs` ile standalone çıktısına tamamlar; yalnız `next build` çağırmak bu adımı atlar, `build` komutunu kullanın.

## 3. Hesaplar ve güvenlik

- Kayıt, düzenleme, kaynak PDF, sonuç listesi ve AI isteği için öğretmen hesabı gerekir; öğrenci yalnız paylaşım bağlantısıyla katılır.
- Şifre scrypt hash'i olarak, oturum rastgele tokenın SHA-256 hash'i olarak SQLite'ta tutulur. Cookie HttpOnly/SameSite (HTTPS'te Secure).
- Aynı e-posta için 15 dakika içinde 8 hatalı girişten sonra giriş, süre dolana kadar reddedilir.
- Değiştiren isteklerde `Origin` başlığı uygulamanın adresiyle (`APP_ORIGIN` ya da istek adresi) eşleşmelidir.
- Şifre 12–256 karakter olmalıdır; `user:add` ve `user:reset` rastgele bir şifre üretip terminalde gösterir.
- Yeni öğretmen: `pnpm user:add`. Şifre sıfırlama: `user:reset` (eski oturumları da iptal eder). Şifre terminalde gösterilir.

## 4. Veri ve yedek

- Tablolar: `User`, `Session`, `LoginLimit`, `StoredObject`. Sınav JSON'u, PDF, görseller ve sonuçlar `data/quiz.db` içindedir (`.env` içindeki `DATABASE_URL` ile değiştirilebilir). Depoda gerçek kullanıcı verisi, oturum veya API anahtarı yoktur.
- Yedek: `pnpm backup` → `backups/` altında (`BACKUP_DIR` ile değiştirilebilir) `quiz-<tarih>.db` SQLite snapshot'ı (PDF ve görseller dahil).
- Taşıma: yeni uygulamayı kurup durdurun, veritabanı dosyasını yedekle değiştirin. Tarayıcı IndexedDB taslakları başka alan adına kendiliğinden taşınmaz.
- `/llm` paneline ait `data/llm-profiles.json` ve `data/llm-encryption.key` dosyaları ayrıca yedeklenmelidir ([LLM-MANAGER.md](LLM-MANAGER.md)).
