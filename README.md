# PDF → Online Quiz — taşınabilir sürüm 2.0.10

12 Ekim 2026 · Faz 3D/3E/3F/3G, elle şık tamamlama ve güvenli görsel onayı, birleşik PDF metin editörü, checkbox gösterim tercihleri, cevap anahtarı tablosu ve body hydration uyumluluk düzeltmesi dahil.

Next.js App Router + Node.js/Bun + React + Tailwind; doğrudan libSQL istemcisiyle yerel SQLite. Çalışma zamanında üretilmiş Prisma istemcisi veya Prisma motoru indirmesi gerekmez. Sites hizmeti veya Cloudflare hesabı gerektirmez. Kaynaklar, görseller, PDF.js/OCR worker/WASM dosyaları, Türkçe/İngilizce OCR dil modelleri, SQLite şeması, testler, Docker ve pnpm paketin içindedir. `sites-source/` güncel barındırılan uygulamanın kaynaklarını da içerir; bu klasör Next.js tarafından derlenmez.

## FAZ 3G — 12 Ekim 2026

Şık başına elle kırp/yükle, 250 DPI aday önizlemesi, açık güvenli kopya onayı ve şık metnine erişim eklendi. Boş şık/yer tutucu uyarıları yalnız öğretmenin ilgili tamamlamasıyla güncellenir. Eski tam görselin elle yenilenen şıkları veya yeniden dönüştürmede güvenli gövdeyi atlaması engellendi. OCR/3C/kırmızı eşik ve bağımlılıklar değişmedi.

[FAZ 3G raporu](docs/phase3g.md) her madde için bulgu, kanıt, değişiklik ve sonucu; 50 soru envanterini ve normalize sızıntı ölçümünü içerir. 43 soruda geometri yeterli, 7 soru ölçülemedi. Normalize sonuçlar sızıntısızlık kanıtı değildir. Bağımsız 49/Tapu kaynakları bulunamadı; gerçek tarayıcı giriş ve PDF yükleme simülasyonu bağlantı zaman aşımı nedeniyle tamamlanmadı. Gereken girdiler raporda yazılıdır.

## Güncel geliştirmeler

- FAZ 3I görsel ayrımı: öğrenciye giden soru görseli yalnız gövdeyi, her şık görseli yalnız kendi harfsiz içeriğini taşır. Kalem izi kontrolü gövde ve A–E şıkları için ayrı uygulanır; elle kırpımda şık işareti algılanamazsa kayıt engellenmeden kaynak doğrulama uyarısı gösterilir. Kapı paneli güncel durumu “Son kontrol” zamanı ve soru/şık adresiyle açıklar.
- Eksik şık kurtarma artık örnek PDF cümlelerine bağlı değildir. Komşu işaretlerin düşey sırası, içerik sütunu, satır başlangıcı, OCR sembol kutuları ve fiziksel satır birleştirmesi kullanılır; sonuç yalnız öğretmen önerisidir ve otomatik uygulanmaz. Kapsam, doğrulama ve yeni düzen ekleme kuralları: [OCR sürdürülebilirlik notu](docs/ocr-sustainability.md).
- Sonuç puanı yalnız cevap anahtarı bulunan, değerlendirilebilir sorular üzerinden hesaplanır; toplam soru ve anahtarı eksik yanıt sayısı sonuç ekranında ayrıca gösterilir.
- Elle seçilen soru kırpımı eski OCR sınır uyarısını geçersiz kılar. Şık kırpımında harf seçimin dışında kaldığında içerik korunur ve hedef doğrulama uyarısı verilir; güvenli önizleme yinelenmez.
- Gece modu; soru gezinmesi, kalite/uyarı durumları ve sonuç ekranını kapsar. Uzun şüpheli soru ve hibrit AI sonuçları varsayılan kapalı, kaydırılabilir bölümlerdir.
- Soru ve şık görüntüsü için iki bağımsız checkbox; varsayılan işaretsiz/metin. Şık tercihi soru metninin altında, cevapların hemen üstündedir. Eksik veya güvenli olmayan görsel sessizce başka moda geçmez; kontrol uyarısı verir.
- Soru metni ve dönüştürülmüş görünüm tek basit editörde: kalın, altı çizili, liste, geri al/yinele ve biçim temizleme. Metin/biçimler önizleme ve yayında aynı veriden gösterilir.
- PDF alan seçimi soru veya A–E şık görseli yuvasına aktarılır. Boş yuvalardan da hedef seçilebilir; görsel eklemek gösterim checkbox'ını açmaz.
- Toplu cevap anahtarı giriş alanı ve gösterim alanı, tespit edilen soru sayısına göre satırları gösterir. PDF'den tespit edilen ve uygulanan/manuel cevap ayrıdır; görsel ve manuel giriş korunur. Programcı referans dönüşümünde 50 satır/50 tespit, 0 otomatik uygulama doğrulandı.
- Numara sıralaması, komşu kırpma/üst-alt bant kontrolleri, eşit marker maskesi ve açık kalem izi onayı korunur. Öğrenci yanıtı doğru cevap/anahtar/orijinal PDF içermez.
- Tarayıcı tarafından body'ye eklenen nitelikler için dar hydration istisnası eklendi; alt bileşen uyuşmazlıkları bastırılmaz. Ayrıntılar: [hydration incelemesi](docs/hydration-and-git.md).
- Kalite kontrolü ve hibrit AI incelemesi artık teknik hata kodları yerine soru numarası, eksik alan ve kullanıcıdan beklenen işlemi açıklayan Türkçe durum metinleri gösterir. AI önerisinin uygulanıp uygulanmadığı ayrıca belirtilir; düzenleme veya öneri uygulama sonrasında Çözümleme özeti, şüpheli sorular ve paylaşım kontrolleri sayfa yenilemeden yeniden hesaplanır.

Kalite/AI inceleme akışı uygulama içi gerçek tarayıcıda doğrulandı; native metin araçları ve mobil yerleşim ayrıca doğrulanmalıdır. Güncel kanıtlar [TEST-REPORT.md](TEST-REPORT.md), [AI inceleme doğrulaması](output/playwright/ai-review-live/ai-review-verification.md), [düzenleyici raporu](docs/editor-simplification.md) ve [Faz 3F raporu](docs/phase3f.md) içindedir.

## Windows'ta hızlı başlatma

GitHub kaynağı: [sirrakadembasti/pdftoquiz](https://github.com/sirrakadembasti/pdftoquiz). ZIP yerine Git kullanıyorsanız önce `git clone https://github.com/sirrakadembasti/pdftoquiz.git` çalıştırın ve `pdftoquiz` klasöründe aşağıdaki kurulum komutlarını uygulayın. `.env`, hesaplar/veritabanı ve bağımlılık kurulumu depoya dahil değildir; mevcut yerel verilerinizi ayrıca yedekleyin.

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

`INITIAL_ADMIN_PASSWORD` yalnız ilk hesap oluşturulurken kullanılır; `.env` değerini sonradan değiştirmek mevcut hesabın şifresini güncellemez. Şifre 12–256 karakter olmalı; boş bırakılırsa rastgele üretilir. `user:add` ile eklenen öğretmenin şifresi ayrıca terminalde gösterilir. Unutulan mevcut şifre için `node tools/pnpm/dist/pnpm.mjs user:reset` kullanın. `localhost` veya `127.0.0.1` ile giriş desteklenir; üretim alan adında `APP_ORIGIN` tam adresle sabitlenir.

Bun kullanan mevcut kurulumlarda eşdeğer akış:

```powershell
bun run setup:bun
bun dev
```

`bun install` tek başına ilk yönetici hesabını hazırlamaz. `setup:bun` bağımlılık kilidini doğrular, SQLite şemasını hazırlar ve `.env` değerleriyle ilk hesabı oluşturur.

Çift tıklama seçenekleri: `KURULUM-WINDOWS.cmd`, `CALISTIR-GELISTIRME.cmd`, `CALISTIR-URETIM.cmd`. Windows terminal komutlarının güncel doğrulaması `TEST-REPORT.md` içindedir; çift tıklama ve gerçek tarayıcı görünümü ayrıca sınanmalıdır.

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
- `User`, `Session`, `LoginLimit`, `StoredObject` SQLite tabloları. Sınav JSON'u, PDF, soru/şık görselleri ve sonuçlar SQLite dosyasında saklanır; mevcut JSON/bölüm/provenance biçimi korunur.
- Yerel dosya: `data/quiz.db`. `.env` DATABASE_URL ile başka kalıcı dosya seçebilirsiniz. Kaynak pakette gerçek kullanıcı verisi, oturum veya API anahtarı yoktur.
- Yeni öğretmen: `node tools/pnpm/dist/pnpm.mjs user:add`; şifre sıfırlama: `node tools/pnpm/dist/pnpm.mjs user:reset`. Komut rastgele yeni şifreyi terminalde gösterir. Sıfırlama eski oturumları da iptal eder.
- Yedek: `node tools/pnpm/dist/pnpm.mjs backup`. SQLite snapshot'ı `backups/` altına alınır; PDF ve görseller dahil kayıtlı tüm veriler bundadır. Başka sunucuya taşımak için yeni uygulamayı kurun, durdurun, veritabanı dosyasını yedekle değiştirin; DATABASE_URL doğru dosyayı göstermeli. Eski dosyayı önce koruyun.
- Sites üzerinde kayıtlı özel sınavlar bu ZIP'e alınmadı. Bu paket kaynak kod dağıtımıdır; yeni SQLite deposu boştur. Sites verileri kendiliğinden eşitlenmez. Tarayıcı IndexedDB taslakları da farklı alan adına kendiliğinden taşınmaz.

## Özellikler ve güncel sınırlar

Yerel PDF dönüşümü, yerel OCR, kapak/bölüm/soru sayısı, soru ve şık kırpmaları, uzun metin/biçim, Markdown/Excel cevap anahtarı ve görsel anahtar OCR'ı, eşleşme önizlemesi, öğrenci sınavı ve doğru/yanlış/boş/100'lük puan korunur.

Hibrit önce yerel geçiş yapar; kalite kapısında sorunlu alanları seçer ve gönderimden önce sayfa/blok ile çağrı tahmini onayı alır. Manuel alanlar kilitlidir. Dijital metindeki AI farkı öneri olarak kalır; kabul/ret/geri alma vardır. Otomatik/Yerel-önce/AI-önce; hata başına yerel sonuç, en fazla iki eşzamanlı çağrı, sınırlı geri çekilme ve iptal vardır. AI anahtarı yalnız sekme belleğindedir; `.env`, SQLite veya JSON'a kaydedilmez.

20 MB/100 sayfa PDF, 300 soru, 1200 farklı görsel; sınav JSON'u 24 MiB. Karmaşık sınırlar ve düşük OCR öğretmen kontrolü gerektirir. Sınav paylaşımı tüm doğru cevaplar ve kontrol onayı gerektirir. Gemini/OpenAI/OpenRouter canlı kalite kontrolü kullanıcı anahtarı gerektirir; testlerde mock sağlayıcı kullanılır. HTTPS olmadan bazı tarayıcılarda pano gibi özellikler sınırlanabilir.

## Bağımlılıklar ve testler

`package.json`, `bun.lock`, `pnpm-lock.yaml`, `DEPENDENCIES.md` ve lisanslar pakette. Next 16.4.0, React 19.3.0, Tailwind 4.3.3, Lucide 1.52.0 güncellendi. SQLite çalışma zamanı doğrudan `@libsql/client` kullanır; çevrimdışı başlatma için Prisma istemcisi üretimi gerekmez. Prisma 7 paketleri geçiş uyumluluğu ve şema referansı için dağıtımda tutulmaktadır. PDF.js 5.4.296 / Tesseract 5.1.1 worker/dil varlıklarıyla eşleşen test edilmiş sürümlerde korundu. pnpm 11.25.0 JavaScript dağıtımı Windows/Linux uyumluluğu için ZIP'e eklendi; Bun kilidi ayrıca desteklenir.

```sh
node tools/pnpm/dist/pnpm.mjs typecheck
node tools/pnpm/dist/pnpm.mjs test
# Üretim derlemesi sonrasında gerçek Node HTTP + SQLite testi:
node tools/pnpm/dist/pnpm.mjs test:server
```

`test` ortak uygulama mantığını ve sentetik gerçek PDF/OCR belgelerini, mock AI ve React olaylarını doğrular. `test:server` geçici SQLite'da gerçek Next.js üretim sunucusunu başlatıp giriş/yetki, paylaşım, varlık/PDF, puanlama, kalıcılık ve yedeklemeyi sınar; gerçek kullanıcı dosyanızı değiştirmez. Referans telifli PDF/görsel ZIP'te yoktur. Kendi kopyanızla REFERENCE_PDF / REFERENCE_KEY_IMAGE ortam değişkenlerini kullanabilirsiniz.

Faz 3D düzeltme 2 bulguları ve doğrulama sınırları: [rapor](docs/phase3d2.md). İptal, tanılama ve bellek ölçümleri: [ayrı Faz 3E raporu](docs/phase3e.md).

Tanılama paketini öğretmen düzenleyicisinden yerel olarak indirin; sınav metni içerir. OCR çalıştırmadan parser tekrar yürütmesi:

```bash
node scripts/replay-diagnostics.mjs paket.json sonuc.json
```

Sentetik bellek ölçümü (PDF binary kaydetmez; Tapu referansı yoksa fixture kullanır):

```bash
node scripts/measure-resilience.mjs 30 .audit/resilience-30.json
```

Windows'ta üretim derlemesi, pnpm bağımlılık bağlantılarını ve dinamik yüklenen SQLite native paketini `scripts/standalone-links.mjs` ile standalone çıktısına tamamlar. Derlemeyi çalıştırmadan yalnız `next build` çağırmak bu son paketleme adımını atlar; README'deki `build` komutunu kullanın.

Gerçek tarayıcı, Windows çalışma ortamı, Docker motoru, harici VPS ve canlı AI doğrulama durumu `TEST-REPORT.md` içindedir. README'deki komutlar bu sınırlarla değerlendirilmelidir.

## Kaynaklar

- https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite
- https://github.com/mozilla/pdf.js
- https://github.com/naptha/tesseract.js


## FAZ 3F doğrulaması

Gösterim, sızıntı ölçümü, sıra/kırpma ve doğrulama sınırları: [FAZ 3F raporu](docs/phase3f.md). Yeni regresyonlar standart `test` komutuna dahildir. Yerel ölçüm: `node scripts/measure-leakage.mjs kaynak.pdf ogretmen-taslagi.json sonuc.json`; anahtar yalnız yerel ölçümde kullanılır. Gerçek tarayıcı/mobil, bağımsız gerçek 49 sorulu OCR, Tapu A ve OOM doğrulanamadı.


## Güncel PDF düzenleyicisi

Checkbox gösterim tercihleri, birleşik basit metin editörü, PDF kırpma hedefleri ve soru bazında cevap anahtarı tablosu: [düzenleyici değişiklikleri ve doğrulama](docs/editor-simplification.md). Yeni testler standart `test` komutuna dahildir.
