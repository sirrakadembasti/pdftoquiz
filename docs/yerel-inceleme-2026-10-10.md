# Yerel uygulama incelemesi — 10 Ekim 2026

## 11 Ekim 2026 güncellemesi

Sonraki geliştirmeler için [düzenleyici raporu](editor-simplification.md), [hydration/Git incelemesi](hydration-and-git.md) ve [güncel test raporu](../TEST-REPORT.md) kullanılır. Aşağıdaki yerel inceleme bulguları geçmiş kayıt olarak korunur.

Bu belge ilk incelemenin hata kanıtlarını korur. Ardından yapılan yerel düzeltmeler ve güncel doğrulama sonuçları kökteki `TEST-REPORT.md` dosyasında açıklanır; aşağıdaki başarısızlık tablosu düzeltme öncesine aittir.

İncelenen klasör: `F:\projeler\pdf-to-onlinequiz`. Ortam: Windows, Node.js v22.23.2. Bu klasör bir Git deposu değil; commit/diff geçmişi doğrulanamadı. Uygulama kaynak kodu, .env ve mevcut hesap şifreleri değiştirilmedi. İnceleme araçları ve ham test çıktıları `.audit/` altına kaydedildi. Üretim derlemesi `.next/` ve Prisma üretimi `generated/` dosyalarını yeniledi.

## Uygulama ve klasörler

PDF sınavlarından paylaşılabilir çevrimiçi sınav üreten Türkçe öğretmen uygulaması. Dijital PDF metin/konumlarını PDF.js, taranmış sayfaları Tesseract tur+eng ile tarayıcıda işler. Soru/şık kırpmaları, metin düzenleme, cevap anahtarı eşleştirme, önizleme, öğretmen onayı, öğrenci katılımı ve sunucuda puanlama vardır. İsteğe bağlı AI/hibrit onarım OpenAI, OpenRouter ve Gemini uyumlu uçlarını kullanır. AI anahtarı sekme belleğinden istekle gönderilir; uygulama bunu DB'ye yazmaz.

| Dizin/dosya | Rol |
|---|---|
| app/page.tsx | PDF dönüşümü, düzenleyici, öğretmen kütüphanesi, öğrenci sınavı; büyük ve yoğun ana bileşen |
| app/account, app/api/auth | Yerel öğretmen girişi, oturum, çıkış |
| app/api/exams, app/api/ai, app/api/health | Sınav, sonuç, PDF/görsel, AI aracılığı, DB sağlık kontrolü |
| lib | PDF yerleşimi/OCR, hibrit kalite kapısı, cevap anahtarı, doğrulama, puanlama, güvenli görseller, SQLite ve kimlik doğrulama |
| components/ui, hooks | Arayüz bileşenleri ve mobil yardımcı hook |
| prisma, generated | User/Session/LoginLimit/StoredObject şeması, ilk migration ve üretilmiş istemci |
| data | Mevcut quiz.db: 2 kullanıcı, 0 oturum, 0 saklanan nesne |
| public/vendor | PDF worker/font/cmap/WASM, OCR worker/core ve dil varlıkları; lisanslar |
| scripts | Kurulum, derleme, servis, migration, hesap ekleme/sıfırlama, SQLite snapshot yedeği |
| tests | Yerel HTTP/SQLite entegrasyonu ve regresyon kopyaları |
| sites-source | Sites/Vinext/Cloudflare/R2 kaynak profili; Next derlemesine dahil değil. Standart test komutu bu dizindeki testleri çalıştırıyor |
| docs | Geliştirme faz raporları ve JSON ölçüm kanıtları |
| deploy, Dockerfile, docker-compose.yml | Nginx örneği, Docker dağıtımı, SQLite volume |
| tools/pnpm, VENDOR-LICENSES, DEPENDENCIES.md | Paket yöneticisi dağıtımı ve bağımlılık/lisans envanteri |

`lib/quiz`, `pdf-import`, `pdf-layout`, `hybrid`, `ai`, `answer-key` yerel ve Sites kopyalarında byte düzeyinde aynı. `app/page.tsx` kopyaları aynı değil; Sites profilindeki named export'lar taşınabilir profilde kaldırılmış. Testlerin Sites kopyasını çalıştırması yerel UI/API davranışının tamamını doğruladığı anlamına gelmez.

## Giriş sorunu: kanıtlanmış bulgular

1. **Admin şifresi uyuşmuyor.** Mevcut `admin@local.test` hesabının scrypt hash'i `.env` içindeki INITIAL_ADMIN_PASSWORD ile eşleşmedi. Veritabanının ayrı snapshot kopyasında `authenticate` da bu bilgilerle null döndürdü. `scripts/admin.ts` --init yolunda herhangi bir kullanıcı varsa çıkıyor; yeniden setup veya .env değişikliği mevcut hash'i yenilemiyor. INITIAL_ADMIN_PASSWORD yalnız ilk hesap oluşturma girdisidir.
2. **İkinci öğretmen hesabı mevcut.** `ogretmen@pdftoquiz.com` / ali kayıtlı. `user:add` ve `user:reset` kodu rastgele şifre üretip terminalde gösteriyor; başlangıç admin şifresini bu hesaba uygulamıyor. Kullanıcının bu hesapla denediği gerçek şifre bilinmediğinden o şifrenin neden reddedildiği ayrıca doğrulanmış değildir.
3. **Hesaplar rate limit altında değil.** İnceleme anında iki hesap için LoginLimit kaydı yok. APP_ORIGIN boş, cookie Secure false; mevcut ayarlarda HTTPS cookie/origin uyuşmazlığına kanıt yok. Başlangıç kontrolünde 3000 portunda dinleyen servis bulunmadı.
4. **Üretim paketinde DB bağımlılık bağlantısı eksik.** README test:server yeni derleme ile çalıştırıldı. Next sunucusu hazır mesajı verdi; sağlık API'si `ERR_MODULE_NOT_FOUND: @libsql/core` nedeniyle başarılı olamadı. Prisma adapter'ı kendi @libsql/client 0.17.4 bağımlılığını kullanıyor; root doğrudan bağımlılık 0.18.0. Asıl node_modules içinde client→core bağlantısı var, .next/standalone içindeki eşdeğer bağlantı yok. Core dosyaları standalone içinde bulunsa da çözümleme bağlantısı eksik. Bu paketleme sorunu üretim modunda DB kullanan giriş dahil API'leri engeller. Geliştirme modunda aynı hatanın oluştuğu iddia edilmiyor.
5. **Hash/oturum mantığı tek başına çalışıyor.** Orijinal DB'nin ayrı snapshot'ında rastgele şifreli geçici öğretmen oluşturuldu; authenticate ve sessionUser başarılı oldu. Orijinal hesaplar/oturumlar değiştirilmedi. Standalone sağlık kontrolü başarısız olduğundan HTTP cookie ile başarılı giriş doğrulanamadı.

Hesap erişimi için mevcut hesaba ait kurulum/kullanıcı oluşturma çıktısındaki şifre kullanılmalı veya `node tools/pnpm/dist/pnpm.mjs user:reset` ile ilgili e-posta sıfırlanmalıdır. Bu incelemede reset uygulanmadı. Üretim erişimi için ayrıca standalone bağımlılık bağlantıları düzeltilmeli ve test:server yeniden geçmelidir.

## Bu oturumdaki test sonuçları

İlk pnpm çağrıları sandbox içinde realpath EPERM hatası verdi. README komutları gerekli izinle yeniden çalıştırıldı; aşağıdaki sonuçlar izinli çalıştırmalardır.

| Komut | Sonuç |
|---|---|
| node tools/pnpm/dist/pnpm.mjs typecheck | Başarılı, exit 0 |
| node tools/pnpm/dist/pnpm.mjs build | Başarılı, exit 0; Prisma generate ve Next production build tamamlandı |
| node tools/pnpm/dist/pnpm.mjs test | Başarısız, exit 1; ilk quiz grubu 24 test: 21 başarılı, 3 başarısız. Runner ilk hatada diğer grupları çalıştırmadan duruyor |
| node tools/pnpm/dist/pnpm.mjs test:server | Başarısız, exit 1; kapsayıcı test sağlık kontrolünde durdu, 6 HTTP alt senaryosuna ulaşılamadı |

Kalan 16 grubu ayrı tanı koşusuyla çalıştırdım. İlk quiz grubuyla birlikte TAP toplamı **122: 94 başarılı / 19 başarısız / 9 atlanan**. Bağımsız tail betiği bu toplama dahil değil; o da hata ile durdu ve dört kontrolü tamamlayamadı. `number-gap` ve `reading` sayıları dosya seviyesinde bootstrap başarısızlıklarıdır; içerideki senaryolar çalışmadı. Bu toplam eski rapordaki 136 test ile birebir karşılaştırılmamalıdır.

| Grup | Başarılı / başarısız / atlanan |
|---|---|
| quiz | 21 / 3 / 0 |
| parsing | 4 / 6 / 0 |
| phase1 | 3 / 1 / 1 |
| answer-key | 8 / 0 / 1 |
| ai-redirect | 5 / 0 / 0 |
| layout-quality | 3 / 1 / 1 |
| hybrid | 13 / 0 / 1 |
| answer-color | 1 / 2 / 1 |
| number-sequence | 3 / 1 / 1 |
| text-options | 6 / 0 / 1 |
| crop-quality | 3 / 1 / 1 |
| ocr-columns | 4 / 0 / 0 |
| red-ink | 4 / 2 / 1 |
| option-sequence | 16 / 0 / 0 |
| number-gap | 0 / 1 / 0; dosya başlangıç hatası |
| reading | 0 / 1 / 0; dosya başlangıç hatası |

Başarısızlıklar:

- 17 TAP hatası ve tail: standardFontDataUrl `path.join` ile Windows `\` ayırıcılarına dönüşüyor. PDF.js son karakter olarak `/` istiyor; `Invalid factory url ... must include trailing slash` hatası PDF/OCR senaryosu başlamadan oluşuyor. Bu çıktı PDF dönüştürücünün soru doğruluğu hakkında sonuç vermez.
- number-gap/reading: `new URL('..',import.meta.url).pathname` Windows'ta `/F:/...` üretmiş. createRequire yanlış kökten aradığı için `Cannot find module 'typescript'` oluşuyor; TypeScript root node_modules içinde kurulu. Dosya yolu için fileURLToPath gerekir.
- 9 atlama dış referans PDF/görüntüsü isteyen koşullardan kaynaklanıyor.
- react-test-renderer deprecation mesajları uyarıdır; ana başarısızlık nedeni değildir.
- test:server eksik standalone core bağlantısından etkileniyor; migration ve ilk hesap oluşturma adımları testin start aşamasına geçmesine izin verdi.

Ham kayıtlar: `.audit/typecheck.log`, `build.log`, `test.log`, `server.log`, `auth-check.log`, `all-suites.log`, `suites.json` ve grup logları.

## Belgelerin değerlendirilmesi ve diğer sınırlar

README başlığı 2.0.0 / 7 Ekim, TEST-REPORT 7 Ekim ve 72 ortak kontrol diyor. package.json ve VERSION.json ise **2.0.10**; en yeni faz belgesi **arsiv/phase3d.md (10 Ekim)**. Önceki raporlar geçmiş faz/ortam ölçümleridir; bu Windows oturumunda tüm testler geçmedi.

Faz 1B belgeleri dijital PDF numara, boşluk/kod metni, kırpma ve renkli cevap sızıntısı düzeltmelerini anlatıyor; JSON kanıtları koordinat/önce-sonra çıktıları içeriyor. Faz 3C-2 kırmızı tarama güvenli kopyalarını; 3C-3 harf sırası çıkarımını; follow-up hedefli OCR ile 46→48 okunmuş soruyu anlatıyor. Son 3D raporunda **48 okunmuş + 2 OKUNAMADI = 50 kayıt** var; bu 50 sorunun OCR ile doğru okunduğu anlamına gelmiyor. 43 soruda beş harf algılanmış, 42 soru uyarılı. 5/21 öğretmen çözümü/onayı gerektiriyor; 3E/3F yapılmamış. Bu oturumda telifli dış referanslarla bu ölçümler yeniden üretilmedi.

Pratik sınırlar: OCR kusursuz değil; okuma güveni doğruluk olasılığı değil. Kırmızı temizliği gerçek kırmızı şekilleri de silebilir. Eski güvenli bağ taşımayan görseller öğrenciye kapalı; yeni davranış için tekrar dönüşüm gerekebilir. Gerçek tarayıcı/mobil, canlı ücretli AI, Docker/VPS/HTTPS ve 100 sayfa bellek dayanıklılığı bu incelemede doğrulanmadı. Mevcut öğrenci adı ve süre istemci kaynaklı; yüksek güvence gerektiren sınav doğrulaması sunmuyor. Kütüphane en fazla 100 sınav, sonuç listesi 200 sonuç döndürüyor; API truncated bilgisini veriyor, sayfalama bulunmuyor.

Öncelik: standalone runtime bağlantısını düzeltmek → gereken hesabın doğru şifresini sağlamak/sıfırlamak → Windows test yollarını düzeltip bütün testleri yeniden çalıştırmak → README ve test raporlarını sürüm/ortam sonuçlarıyla güncellemek.
