# PDF → Online Quiz — taşınabilir sürüm 2.0.0

7 Ekim 2026 · Faz 2 hibrit dönüşüm dahil son uygulama kaynakları.

Next.js App Router + Node.js + React + Tailwind; Prisma ORM 7 / yerel SQLite. Sites hizmeti veya Cloudflare hesabı gerektirmez. Kaynaklar, görseller, PDF.js/OCR worker/WASM dosyaları, Türkçe/İngilizce OCR dil modelleri, SQLite migration, testler, Docker ve pnpm paketin içindedir. `sites-source/` güncel barındırılan uygulamanın kaynaklarını da içerir; bu klasör Next.js tarafından derlenmez.

## Windows'ta hızlı başlatma

Node.js 24 LTS önerilir (>=22.13). Kurulum, Node.js ve ilk paket indirme için internet gerektirir. Yönetici/global pnpm kurulumu gerekmez; paketteki pnpm kullanılır. Ağınız paket indirmeyi engelliyorsa kurulum yapılabilecek bir bilgisayarda hazırlayın. `node_modules` işletim sistemi/mimariye bağlı olduğundan ZIP'te bulunmaz.

1. ZIP'i `D:\dnm\pdf-to-onlinequiz` içine açın. Bu klasörde `package.json` bulunmalı.
2. PowerShell'de:

```powershell
cd D:\dnm\pdf-to-onlinequiz
node --version
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs dev
```

3. http://localhost:3000 açın. İlk kurulum terminalde öğretmen e-postası ve şifresini gösterir; bilgileri kaydedin. http://localhost:3000/account üzerinden giriş yapın. Sunucu ilk kez SQLite dosyasını oluşturur; yeniden kurulum mevcut hesabın şifresini değiştirmez.

Çift tıklama seçenekleri: `KURULUM-WINDOWS.cmd`, `CALISTIR-GELISTIRME.cmd`, `CALISTIR-URETIM.cmd`. Windows komut dosyaları bu ortamda çalıştırılmadı; terminal komutları Linux'ta doğrulandı.

## Yerel üretim / Linux sunucu

```sh
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs build
node tools/pnpm/dist/pnpm.mjs start
```

Üretim Node.js sunucusu varsayılan olarak `127.0.0.1:3000` dinler. Sunucuda Nginx/Caddy arkasında çalıştırın; `.env` içinde `APP_ORIGIN=https://quiz.example.com` ve `COOKIE_SECURE=true` ayarlayın. APP_ORIGIN tam adres olmalı; origin kontrolü bunu kullanır. `deploy/nginx.conf` örneğindeki alan adını değiştirin ve HTTPS sertifikanızı ekleyin. Alan adını değiştirmek sınav verilerini değiştirmez; bağlantıları yeni alan adıyla yeniden kopyalayın.

PORT farklıysa sunucuya ortam değişkeniyle verin. Geliştirme komutu için `node tools/pnpm/dist/pnpm.mjs dev --port 3001` kullanılabilir. LAN erişiminde geliştirmede `--hostname 0.0.0.0`; üretimde HOSTNAME değişkenini ayarlayın. İnternete açılan sunucuda HTTPS kullanın.

## Docker / başka sunucu

Docker ve Compose kurulu bir sunucuda:

```sh
# Örnek ayarları .env içine kopyalayın; ilk hesap şifresini isterseniz belirleyin.
docker compose up -d --build
docker compose logs quiz
```

İlk hesap yoksa başlangıçta oluşturulur; boş şifrede rastgele şifre logda bir kez gösterilir. SQLite `quiz-data` kalıcı volume'ündedir. Konteyner root olarak çalışmaz. Varsayılan port yalnız sunucunun 127.0.0.1 adresine açılır; Nginx örneği buna bağlanır. Lokal Docker denemesi için aynı sunucuda http://localhost:3000 açın. `.env` için `APP_ORIGIN` ve `COOKIE_SECURE` ayarını gerçek alan adınıza göre yapın.

Docker imajının derlenmesi internet gerektirir. SQLite volume'ünü silmeyin (`down -v` verileri siler). Tek yazıcı sunucu/tek replica içindir; bu dosyayı farklı VPS'lerden aynı anda kullanmayın. Ölçekleme/veritabanı değişikliği ayrı iştir.

## Hesaplar, depolama ve yedek

- Öğretmen hesabı gerektiren işlemler: kayıt, düzenleme, kaynak PDF, sonuç listesi, AI isteği. Öğrenci yalnız paylaşım bağlantısıyla sınava katılır.
- Şifre scrypt hash'i; oturum rastgele tokenın SHA-256 hash'i olarak SQLite'da tutulur. Cookie HttpOnly/SameSite; HTTPS ayarında Secure. Hatalı girişte sınırlama vardır. ChatGPT kimlik başlıkları yerelde öğretmen yetkisi vermez.
- `User`, `Session`, `LoginLimit`, `StoredObject` Prisma modelleri. Sınav JSON'u, PDF, soru/şık görselleri, sonuçlar SQLite dosyasında saklanır; mevcut JSON/bölüm/provenance biçimi korunur.
- Yerel dosya: `data/quiz.db`. `.env` DATABASE_URL ile başka kalıcı dosya seçebilirsiniz. Kaynak pakette gerçek kullanıcı verisi, oturum veya API anahtarı yoktur.
- Yeni öğretmen: `node tools/pnpm/dist/pnpm.mjs user:add`; şifre sıfırlama: `node tools/pnpm/dist/pnpm.mjs user:reset`. Komut rastgele yeni şifreyi terminalde gösterir. Sıfırlama eski oturumları da iptal eder.
- Yedek: `node tools/pnpm/dist/pnpm.mjs backup`. SQLite snapshot'ı `backups/` altına alınır; PDF ve görseller dahil kayıtlı tüm veriler bundadır. Başka sunucuya taşımak için yeni uygulamayı kurun, durdurun, veritabanı dosyasını yedekle değiştirin; DATABASE_URL doğru dosyayı göstermeli. Eski dosyayı önce koruyun.
- Sites üzerinde kayıtlı özel sınavlar bu ZIP'e alınmadı. Bu paket kaynak kod dağıtımıdır; yeni SQLite deposu boştur. Sites verileri kendiliğinden eşitlenmez. Tarayıcı IndexedDB taslakları da farklı alan adına kendiliğinden taşınmaz.

## Özellikler ve güncel sınırlar

Yerel PDF dönüşümü, yerel OCR, kapak/bölüm/soru sayısı, soru ve şık kırpmaları, uzun metin/biçim, Markdown/Excel cevap anahtarı ve görsel anahtar OCR'ı, eşleşme önizlemesi, öğrenci sınavı ve doğru/yanlış/boş/100'lük puan korunur.

Hibrit önce yerel geçiş yapar; kalite kapısında sorunlu alanları seçer ve gönderimden önce sayfa/blok ile çağrı tahmini onayı alır. Manuel alanlar kilitlidir. Dijital metindeki AI farkı öneri olarak kalır; kabul/ret/geri alma vardır. Otomatik/Yerel-önce/AI-önce; hata başına yerel sonuç, en fazla iki eşzamanlı çağrı, sınırlı geri çekilme ve iptal vardır. AI anahtarı yalnız sekme belleğindedir; `.env`, SQLite veya JSON'a kaydedilmez.

20 MB/100 sayfa PDF, 300 soru, 600 farklı görsel. Karmaşık sınırlar ve düşük OCR öğretmen kontrolü gerektirir. Sınav paylaşımı tüm doğru cevaplar ve kontrol onayı gerektirir. Gemini/OpenAI/OpenRouter canlı kalite kontrolü kullanıcı anahtarı gerektirir; testlerde mock sağlayıcı kullanılır. HTTPS olmadan bazı tarayıcılarda pano gibi özellikler sınırlanabilir.

## Bağımlılıklar ve testler

`package.json`, `pnpm-lock.yaml`, `DEPENDENCIES.md` ve lisanslar pakette. Next 16.4.0, React 19.3.0, Tailwind 4.3.3, Lucide 1.52.0 güncellendi. Prisma 7.10.0 SQLite ile seçildi; Prisma 8'e SQLite desteği varsayılarak geçilmedi. PDF.js 5.4.296 / Tesseract 5.1.1 worker/dil varlıklarıyla eşleşen test edilmiş sürümlerde korundu. pnpm 11.25.0 JavaScript dağıtımı Windows/Linux uyumluluğu için ZIP'e eklendi; pnpm 12 native geçişi uygulanmadı.

```sh
node tools/pnpm/dist/pnpm.mjs typecheck
node tools/pnpm/dist/pnpm.mjs test
# Üretim derlemesi sonrasında gerçek Node HTTP + SQLite testi:
node tools/pnpm/dist/pnpm.mjs test:server
```

`test` ortak uygulama mantığını; paketteki özgün sentetik PDF/OCR fixture'ları, mock AI ve React olaylarıyla doğrular. Standart paket kullanıcı belgesi istemez ve atlanan teste izin vermez. `test:server` geçici SQLite'da gerçek Next.js üretim sunucusunu başlatıp giriş/yetki, paylaşım, varlık/PDF, puanlama, kalıcılık ve yedeklemeyi sınar; gerçek kullanıcı dosyanızı değiştirmez.

Belgeye özgü dokuz ek kontrol `test:acceptance` komutundadır. Komut `MULTISECTION_REFERENCE_PDF`, `ANSWER_KEY_REFERENCE_IMAGE`, `STRUCTURED_REFERENCE_PDF` ve `SCANNED_REFERENCE_PDF` yollarını ister; dosyalar verilmezse açık yapılandırma hatasıyla durur ve standart test sonucuna “atlandı” olarak eklenmez. Ayrıntılar `docs/test-strategy.md` içindedir.

Gerçek tarayıcı, Windows çalışma ortamı, Docker motoru, harici VPS ve canlı AI doğrulama durumu `TEST-REPORT.md` içindedir. README'deki komutlar bu sınırlarla değerlendirilmelidir.

## Kaynaklar

- https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite
- https://github.com/mozilla/pdf.js
- https://github.com/naptha/tesseract.js
