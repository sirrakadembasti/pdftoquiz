# PDF → Online Quiz — taşınabilir sürüm 2.0.10

23 Ekim 2026 · Faz 3D/3E/3F/3G, elle şık tamamlama ve güvenli görsel onayı, birleşik PDF metin editörü, checkbox gösterim tercihleri, toplu cevap aktarımı ve body hydration uyumluluk düzeltmesi dahil.

Next.js App Router + Node.js + React + Tailwind; doğrudan libSQL istemcisiyle yerel SQLite. Prisma/ORM kullanılmaz; SQLite şeması `lib/db.ts` içinde tek kaynaktır ve ilk çalıştırmada kendiliğinden oluşur. Sites hizmeti veya Cloudflare hesabı gerektirmez. Kaynaklar, görseller, PDF.js/OCR worker/WASM dosyaları, Türkçe/İngilizce OCR dil modelleri, SQLite şeması, testler, referans sınav PDF'leri ve pnpm paketin içindedir. Eski ChatGPT Sites geliştirme profili (`sites-source/`) 6 Kasım 2026'da kaldırıldı; geçmişi Git'te (commit `316897a` ve öncesi) durur, `docs/` altındaki tarihli raporlardaki `sites-source` ve `.sites-runtime` atıfları tarihseldir.

## FAZ 3G — 12 Ekim 2026

Şık başına elle kırp/yükle, 250 DPI aday önizlemesi, açık güvenli kopya onayı ve şık metnine erişim eklendi. Boş şık/yer tutucu uyarıları yalnız öğretmenin ilgili tamamlamasıyla güncellenir. Eski tam görselin elle yenilenen şıkları veya yeniden dönüştürmede güvenli gövdeyi atlaması engellendi. OCR/3C/kırmızı eşik ve bağımlılıklar değişmedi.

[FAZ 3G raporu](docs/arsiv/phase3g.md) her madde için bulgu, kanıt, değişiklik ve sonucu; 50 soru envanterini ve normalize sızıntı ölçümünü içerir. 43 soruda geometri yeterli, 7 soru ölçülemedi. Normalize sonuçlar sızıntısızlık kanıtı değildir. Bağımsız 49/Tapu kaynakları bulunamadı; gerçek tarayıcı giriş ve PDF yükleme simülasyonu bağlantı zaman aşımı nedeniyle tamamlanmadı. Gereken girdiler raporda yazılıdır.

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
- “Cevapları aktar” düğmesi, güvenle eşleşen PDF cevaplarını açık kullanıcı onayıyla manuel cevap alanlarına topluca taşır. Mevcut farklı cevapların kaçının değişeceği onayda belirtilir; çakışmalı, kitapçığı uyuşmayan veya şık sınırı dışında kalan cevaplar aktarılmaz.
- Numara sıralaması, komşu kırpma/üst-alt bant kontrolleri, eşit marker maskesi ve açık kalem izi onayı korunur. Öğrenci yanıtı doğru cevap/anahtar/orijinal PDF içermez.
- Tarayıcı tarafından body'ye eklenen nitelikler için dar hydration istisnası eklendi; alt bileşen uyuşmazlıkları bastırılmaz. Ayrıntılar: [hydration incelemesi](docs/hydration-and-git.md).
- Kalite kontrolü ve hibrit AI incelemesi artık teknik hata kodları yerine soru numarası, eksik alan ve kullanıcıdan beklenen işlemi açıklayan Türkçe durum metinleri gösterir. AI önerisinin uygulanıp uygulanmadığı ayrıca belirtilir; düzenleme veya öneri uygulama sonrasında Çözümleme özeti, şüpheli sorular ve paylaşım kontrolleri sayfa yenilemeden yeniden hesaplanır.

Kalite/AI inceleme akışı uygulama içi gerçek tarayıcıda doğrulandı; native metin araçları ve mobil yerleşim ayrıca doğrulanmalıdır. Güncel kanıtlar [TEST-REPORT.md](TEST-REPORT.md), [AI inceleme doğrulaması](docs/ai-review-verification.md), [düzenleyici raporu](docs/editor-simplification.md) ve [Faz 3F raporu](docs/arsiv/phase3f.md) içindedir.

## Windows'ta hızlı başlatma

GitHub kaynağı: [sirrakadembasti/pdftoquiz](https://github.com/sirrakadembasti/pdftoquiz). ZIP yerine Git kullanıyorsanız önce `git clone https://github.com/sirrakadembasti/pdftoquiz.git` çalıştırın ve `pdftoquiz` klasöründe aşağıdaki kurulum komutlarını uygulayın. `.env`, hesaplar/veritabanı ve bağımlılık kurulumu depoya dahil değildir; mevcut yerel verilerinizi ayrıca yedekleyin.

Node.js 24 LTS önerilir (>=22.13). Kurulum, Node.js ve ilk paket indirme için internet gerektirir. Yönetici/global pnpm kurulumu gerekmez; paketteki pnpm kullanılır. Ağınız paket indirmeyi engelliyorsa kurulum yapılabilecek bir bilgisayarda hazırlayın. `node_modules` işletim sistemi/mimariye bağlı olduğundan ZIP'te bulunmaz.

1. ZIP'i herhangi bir klasöre (örnek: `D:\dnm\pdf-to-onlinequiz`) açın. Bu klasörde `package.json` bulunmalı.
2. PowerShell'de:

```powershell
cd <açtığınız klasör>
node --version
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs dev
```

3. http://localhost:3000 açın. İlk kurulum terminalde öğretmen e-postası ve şifresini gösterir; bilgileri kaydedin. http://localhost:3000/account üzerinden giriş yapın. Sunucu ilk kez SQLite dosyasını oluşturur; yeniden kurulum mevcut hesabın şifresini değiştirmez.

`INITIAL_ADMIN_PASSWORD` yalnız ilk hesap oluşturulurken kullanılır; `.env` değerini sonradan değiştirmek mevcut hesabın şifresini güncellemez. Şifre 12–256 karakter olmalı; boş bırakılırsa rastgele üretilir. `user:add` ile eklenen öğretmenin şifresi ayrıca terminalde gösterilir. Unutulan mevcut şifre için `node tools/pnpm/dist/pnpm.mjs user:reset` kullanın. `localhost` veya `127.0.0.1` ile giriş desteklenir; üretim alan adında `APP_ORIGIN` tam adresle sabitlenir.

Çift tıklama seçenekleri: `KURULUM-WINDOWS.cmd`, `CALISTIR-GELISTIRME.cmd`, `CALISTIR-URETIM.cmd`. Windows terminal komutlarının güncel doğrulaması `TEST-REPORT.md` içindedir; çift tıklama ve gerçek tarayıcı görünümü ayrıca sınanmalıdır.

## Yerel üretim / Linux sunucu

```sh
node scripts/setup.mjs
node tools/pnpm/dist/pnpm.mjs build
node tools/pnpm/dist/pnpm.mjs start
```

Üretim Node.js sunucusu varsayılan olarak `127.0.0.1:3000` dinler. Sunucuda Nginx/Caddy arkasında çalıştırın; `.env` içinde `APP_ORIGIN=https://quiz.example.com` ve `COOKIE_SECURE=true` ayarlayın. APP_ORIGIN tam adres olmalı; origin kontrolü bunu kullanır. `deploy/nginx.conf` örneğindeki alan adını değiştirin ve HTTPS sertifikanızı ekleyin. Alan adını değiştirmek sınav verilerini değiştirmez; bağlantıları yeni alan adıyla yeniden kopyalayın.

PORT farklıysa sunucuya ortam değişkeniyle verin. Geliştirme komutu için `node tools/pnpm/dist/pnpm.mjs dev --port 3001` kullanılabilir. LAN erişiminde geliştirmede `--hostname 0.0.0.0`; üretimde HOSTNAME değişkenini ayarlayın. İnternete açılan sunucuda HTTPS kullanın.

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

`package.json`, `pnpm-lock.yaml`, `DEPENDENCIES.md` ve lisanslar pakette; son ikisi `scripts/licenses.mjs` ile otomatik üretilir (`build` yazar, `test` güncelliği denetler). Next 16.4.0, React 19.3.0, Tailwind 4.3.3, Lucide 1.52.0 güncellendi. SQLite çalışma zamanı doğrudan `@libsql/client` kullanır; Prisma paketleri ve `prisma/` klasörü 6 Kasım 2026'da kaldırıldı. PDF.js 5.4.296 / Tesseract 5.1.1 worker/dil varlıklarıyla eşleşen test edilmiş sürümlerde korundu. pnpm 11.25.0 JavaScript dağıtımı Windows/Linux uyumluluğu için ZIP'e eklendi;

```sh
node tools/pnpm/dist/pnpm.mjs typecheck
node tools/pnpm/dist/pnpm.mjs test
# Üretim derlemesi sonrasında gerçek Node HTTP + SQLite testi:
node tools/pnpm/dist/pnpm.mjs test:server
```

`test` ortak uygulama mantığını; depodaki özgün sentetik PDF/OCR fixture'ları, mock AI ve React olaylarıyla doğrular. `test:server` geçici SQLite'da gerçek Next.js üretim sunucusunu başlatıp giriş/yetki, paylaşım, varlık/PDF, puanlama, kalıcılık ve yedeklemeyi sınar; gerçek kullanıcı dosyanızı değiştirmez.

Standart `node tools/pnpm/dist/pnpm.mjs test` harici belge istemez ve atlanan teste izin vermez. Belgeye özgü dokuz ek kontrol ayrı `node tools/pnpm/dist/pnpm.mjs test:acceptance` katmanındadır. Bu komut `MULTISECTION_REFERENCE_PDF`, `ANSWER_KEY_REFERENCE_IMAGE`, `STRUCTURED_REFERENCE_PDF` ve `SCANNED_REFERENCE_PDF` yollarını ister; dosyalar verilmezse açık yapılandırma hatasıyla durur ve standart test sonucuna “atlandı” olarak eklenmez. Ayrıntılı kapsam, eski değişken adlarının uyumluluk eşlemesi ve fixture politikası: [test stratejisi](docs/test-strategy.md).

Faz 3D düzeltme 2 bulguları ve doğrulama sınırları: [rapor](docs/arsiv/phase3d2.md). İptal, tanılama ve bellek ölçümleri: [ayrı Faz 3E raporu](docs/arsiv/phase3e.md).

Tanılama paketini öğretmen düzenleyicisinden yerel olarak indirin; sınav metni içerir. OCR çalıştırmadan parser tekrar yürütmesi:

```bash
node scripts/replay-diagnostics.mjs paket.json sonuc.json
```

Sentetik bellek ölçümü (PDF binary kaydetmez; Tapu referansı yoksa fixture kullanır):

```bash
node scripts/measure-resilience.mjs 30 .audit/resilience-30.json
```

Windows'ta üretim derlemesi, pnpm bağımlılık bağlantılarını ve dinamik yüklenen SQLite native paketini `scripts/standalone-links.mjs` ile standalone çıktısına tamamlar. Derlemeyi çalıştırmadan yalnız `next build` çağırmak bu son paketleme adımını atlar; README'deki `build` komutunu kullanın.

Gerçek tarayıcı, Windows çalışma ortamı, harici VPS ve canlı AI doğrulama durumu `TEST-REPORT.md` içindedir. README'deki komutlar bu sınırlarla değerlendirilmelidir.

## Referans PDF'ler ve gerçek dönüşüm simülasyonu

`tests/reference/` altında üç gerçek sınav PDF'i bulunur: `grup-36---programci.pdf` (taranmış, 12 sayfa, 50 soru, 5 şık), `saglik2017programci.pdf` (dijital, 9 sayfa, 50 soru, 4 şık, sayfa 9'da cevap anahtarı) ve `hacettepe_programci_2014.pdf` (dijital, 16 sayfa, 50 soru, 5 şık, cevap anahtarsız). Bunlar standart test paketinin parçası değildir; uygulamanın gerçek dönüşüm hattını (PDF.js + yerel Tesseract OCR, AI yok) sınamak için kullanılır:

```sh
node scripts/convert-reference.mjs                      # üç PDF'yi dönüştürür, özet + ayrıntı JSON (.test-tmp/reference)
node scripts/convert-reference.mjs baska-sinav.pdf      # istenen PDF
node tools/pnpm/dist/pnpm.mjs test:ocr                   # OCR ölçümü (varsayılan: saglik2017 + grup-36)
```

Başka PDF'ler için `TAPU_REFERENCE_PDF` / `REAL_REFERENCE_PDF` / `MULTISECTION_REFERENCE_PDF` / `SCANNED_REFERENCE_PDF` ile yol verilebilir. Güncel sonuçlar [TEST-REPORT.md](TEST-REPORT.md) içindedir.

## Kaynaklar

- https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- https://github.com/mozilla/pdf.js
- https://github.com/naptha/tesseract.js


## FAZ 3F doğrulaması

Gösterim, sızıntı ölçümü, sıra/kırpma ve doğrulama sınırları: [FAZ 3F raporu](docs/arsiv/phase3f.md). Yeni regresyonlar standart `test` komutuna dahildir. Yerel ölçüm: `node scripts/measure-leakage.mjs kaynak.pdf ogretmen-taslagi.json sonuc.json`; anahtar yalnız yerel ölçümde kullanılır. Gerçek tarayıcı/mobil, bağımsız gerçek 49 sorulu OCR, Tapu A ve OOM doğrulanamadı.


## Güncel PDF düzenleyicisi

Checkbox gösterim tercihleri, birleşik basit metin editörü, PDF kırpma hedefleri, soru bazında cevap anahtarı tablosu ve güvenli toplu cevap aktarımı: [düzenleyici değişiklikleri ve doğrulama](docs/editor-simplification.md). Yeni testler standart `test` komutuna dahildir.
