# Güncel doğrulama — 13 Ekim 2026 / Bun ve çevrimdışı SQLite düzeltmesi

`bun install` sonrasında Turbopack'in `../generated/prisma/client` modülünü bulamaması giderildi. Sunucu veri katmanı doğrudan `@libsql/client` kullanıyor; `db:generate` artık ağ veya üretilmiş istemci gerektirmeyen uyumluluk adımıdır. Mevcut `User`, `Session`, `LoginLimit` ve `StoredObject` tabloları ile veriler korunur.

| Kontrol | Sonuç |
|---|---|
| Bun geliştirme sunucusu / health | HTTP 200; `ok:true`, `storage:sqlite` |
| `.env` öğretmen hesabı | İlk hesap oluşturuldu; gerçek HTTP login 200, oturum kontrolü 200, HttpOnly + SameSite=Lax |
| Gerçek tarayıcı | `/account` giriş formu başarılı; `/` yönlendirmesi ve öğretmen ekranı doğrulandı; konsol hatası/uyarısı yok |
| TypeScript | Çıkış 0 |
| Üretim derlemesi | Next.js 16.4 Webpack, TypeScript, 7 statik sayfa ve standalone paketleme başarılı |
| Standalone HTTP/SQLite | 9/9 geçti; yetki, CSRF, kalıcılık, yedek, rate limit ve paket taşıma dahil |
| Seçili UI/PDF regresyonları | 36/36 geçti |
| Yeni dosyalar ESLint | `lib/db.ts`, `lib/draft-storage.ts`, `scripts/prisma-command.mjs`: 0 hata |

Ana `app/page.tsx` için mevcut ESLint borcu ayrıca sürüyor: 47 hata ve 20 uyarı. İlk modülerleştirme olarak IndexedDB taslak katmanı `lib/draft-storage.ts` dosyasına ayrıldı; kalan büyük bileşenler davranış korunarak aşamalı ayrılmalıdır.

Git metadatası kaynak arşivinde bulunmadığından commit/diff doğrulaması yapılamadı; `VERSION.json` içindeki eski commit iddiası kaldırıldı.

---

# Önceki doğrulama — 12 Ekim 2026 / FAZ 3G

Bu kayıt son FAZ 3G kaynakları içindir; önceki tarihli sonuçlar aşağıda korunur.

| Kontrol | Sonuç |
|---|---|
| Standart README test paketi | 195 TAP testi: 186 geçti, 9 dış kaynak testi atlandı, 0 hata; ayrıca 4 PDF fixture kontrolü geçti |
| Elle düzeltme regresyonları | 14/14 geçti; ham/güvenli görsel onayı, eski tam görsel, yeniden dönüştürme, asset URL kaydı, eksik/yer tutucu içerik, şık sayısı ve bekleyen aday iptali |
| Metric regresyonu | Geometri, E boşluğu, kaymış başlangıç, harf tabanı, leave-one-question-out ve yetersiz geometri/örnek kontrolleri geçti; standart paket içinde |
| TypeScript | Son kaynaklarla çıkış 0, tsc --noEmit --incremental false |
| Üretim derlemesi | Çıkış 0; son doğrudan onay düzeltmesi dahil Prisma, Next/Webpack, TypeScript, statik sayfalar ve standalone paketleme tamamlandı |
| HTTP/SQLite ve taşınabilirlik | 9/9 geçti; gerçek yerel Next HTTP, SQLite, oturum ve paket taşıma kontrolleri |
| Verilen öğretmen hesabı / gerçek HTTP | POST giriş 200; aynı çerez oturumuyla hesap kontrolü 200 ve hesap eşleşti; şifre/çerez rapora alınmadı. Tarayıcı/PDF yükleme simülasyonu değildir |
| Geliştirme sunucusu | Turbopack ile 3000 portu hazır; health 200 / ok:true / storage:sqlite |
| Git diff --check | Çıkış 0 |
| Dosya/sır denetimi | Özel veri yolları ve yapılandırılmış sırlarla eşleşme yok; yeni bağımlılık yok |

Önbellek kullanılan üç derleme, Webpack dosya/symlink snapshot hash'i sırasında undefined length iç hatasıyla durdu. Üretim Webpack önbelleği silinmeden .audit altında yedeklendi ve temiz önbellekli derleme yapıldı. Yerel Next yapılandırmasında yalnız üretim Webpack önbelleği kapatıldı; geliştirme önbelleği ve standalone çıktısı korunuyor. Bağımlılıklar değiştirilmedi. Webpack hook eklendiğinde varsayılan Turbopack geliştirmesi uyumluluk kontrolünde durdu; boş turbopack:{} ayarı eklendi ve 3000 portu yeniden başlatıldı. Son health HTTP 200, ok:true/storage:sqlite. Next dev tarafından oluşturulan AGENTS.md korundu ve ilgili kurulu sürüm rehberleri okundu.

Gerçek tarayıcıda giriş ve PDF yükleme simülasyonu **tamamlanmadı**: ana ajan görünür webview denemesi 411,282 saniyede zaman aşımı/kernel reset verdi. Otomatik React/API ve HTTP testleri gerçek tarayıcı görüntüsü sayılmaz. Bağımsız 49 soruluk kaynak ve dijital Tapu kaynağı bulunamadı; ilgili dış kaynak kontrolleri başarı olarak yazılmadı.

[FAZ 3G: beş maddede bulgu → kanıt → değişiklik → sonuç](docs/phase3g.md), [tüm soru ölçümleri](docs/phase3g-assets/leakage-summary.md), [envanter ve doğrulanamayanlar](docs/phase3g-assets/validation-evidence.json).

HTTP testinin iki tekrar denemesi sırasıyla 90 saniyelik toplam bütçe ve 60 saniyelik health hazırlık sınırında durdu. Test hazırlığı/başlangıç süreleri ve son HTTP durum/hata gövdesi tanılamaya eklendi; bütün işlevsel assertler korunuyor. Toplam test bütçesi 240 saniye, başlangıç 60 saniye, tek health isteği 3 saniye ile sınırlı. Son koşum 9/9 geçti: hazırlık 41.353 saniye, ilk health 13.107 saniye. Önceki geç hazır olmanın kesin kök nedeni **doğrulanmadı**; yalnız bütçe artırılmasıyla uygulama sorununun kalıcı çözüldüğü iddia edilmez.

---

# Güncel doğrulama — 11 Ekim 2026

Bu bölüm en son yerel kaynakların doğrulamasıdır; aşağıdaki eski sayılar tarihli kayıtlar olarak korunur.

| Kontrol | Sonuç |
|---|---|
| Standart README test paketi | 180 TAP testi: 171 geçti, 9 dış referans testi atlandı, 0 hata; ayrıca 4 PDF fixture kontrolü geçti |
| Yeni hydration regresyonları | 2/2 geçti; düzeltme öncesinde body bayrağı testi başarısızdı |
| Birleşik düzenleyici regresyonları | 9/9 geçti; standart pakete dahil |
| TypeScript kontrolü | Çıkış 0 |
| Üretim derlemesi | Çıkış 0; Prisma, Next derleme/TypeScript/statik sayfalar ve standalone paketleme tamamlandı |
| HTTP/SQLite ve taşınabilirlik | 9/9 geçti; gerçek Next HTTP, SQLite, oturum ve paket taşıma kontrolleri |
| Üretim SSR ve health | 127.0.0.1:3001 sayfası HTTP 200, html lang=tr/body doğrulandı; health ok:true/storage:sqlite |

Body'ye dışarıdan eklenen nitelik farkı için yalnız body seviyesinde hydration istisnası eklendi. Nitelikler uygulamaya taşınmadı, alt bileşen uyuşmazlıkları bastırılmaz. [Hydration ve Git incelemesi](docs/hydration-and-git.md), [birleşik editör ve cevap tablosu](docs/editor-simplification.md), [Faz 3F ölçümleri](docs/phase3f.md).

İlk sandbox derlemesi SWC'nin Windows yolunu canonicalize ederken erişim hatası vermesiyle durdu; aynı kaynaklar gerekli izinle yeniden derlendi ve son paket tamamlandı. Yeni bağımlılık veya OCR parametre değişikliği yoktur. Gerçek tarayıcı/eklenti hydration koşusu, native metin araçları ve mobil yerleşim bu testlerle doğrulanmış sayılmaz.

Güncel yerel loglar Git dışında: .audit/phase3f-all.log, .audit/phase3f-types.log, .audit/phase3f-build.log, .audit/hydration-server.log. Git deposu bu teslim için main dalıyla oluşturuldu; eski raporlardaki "Git yok" ifadesi inceleme tarihindeki durumu anlatır. Hesap şifreleri, .env, SQLite verileri ve yedekler Git'e eklenmez.

---

# Taşınabilir sürüm test raporu — 10 Ekim 2026

## Güncel Windows doğrulaması — 2.0.10 yerel düzeltmeleri

Windows / Node.js v22.23.2 üzerinde bu klasörde çalıştırıldı. Bu bölüm güncel sonuçtur; aşağıdaki 7 Ekim bölümleri geçmiş ortamın kayıtlarıdır.

| Kontrol | Güncel sonuç |
|---|---|
| README typecheck | Başarılı, exit 0 |
| README build | Başarılı, exit 0; Prisma generate, Next webpack/TypeScript ve son standalone paketleme tamamlandı |
| README test | 136 TAP testi: 127 başarılı, 0 başarısız, 9 atlanan; ayrıca 4 gerçek PDF kuyruk kontrolü başarılı |
| README test:server | 9/9 başarılı: 7 HTTP alt senaryosu + kapsayıcı + paket taşınma regresyonu |
| Gerçek yerel öğretmen | Kullanıcının verdiği mevcut şifreyle localhost:3000 ve 127.0.0.1:3000 giriş/me/exams/logout başarılı |
| Gerçek yerel admin | DB snapshot sonrası yenilenen güçlü şifreyle iki adreste giriş/me/exams/logout başarılı |
| Gerçek standalone taşıma | Klasör geçici olarak taşındı; SQLite health HTTP 200 / ok:true; klasör geri taşındı |

### Düzeltilen kök nedenler

- **Standalone pnpm ve SQLite:** Windows Next tracing bağımlılık bağlantılarını eksik bırakıyor, dinamik libsql native paketini izlemiyordu. `scripts/build.mjs` artık `scripts/standalone-links.mjs` ile eksikleri tamamlıyor. Windows'ta mutlak junction yerine gereken paketler ve bağımlılıkları dosyalarıyla kopyalanıyor; mevcut POSIX yolunda göreli bağlantılar kullanılıyor. Başka klasöre taşıma regresyonu önce MODULE_NOT_FOUND verdi, düzeltme sonrası geçti. Gerçek üretim çıktısının taşınması da doğrulandı.
- **Yerel origin:** APP_ORIGIN boşken Next'in normalize ettiği Request URL localhost, tarayıcı Host'u 127.0.0.1 olabiliyordu. `sameOrigin` bu durumda gerçek Host'u kullanıyor; açık APP_ORIGIN varsa o adres sabit kalıyor. Farklı origin hâlâ reddediliyor. Yeni gerçek HTTP testi önce 400≠200 ile başarısız oldu, düzeltme sonrası geçti.
- **Windows PDF test yolları:** Font dizinleri `/` ile bitecek biçimde normalize edildi; iki testte URL.pathname yerine fileURLToPath kullanıldı. Kök ve sites-source test kopyaları güncellendi.
- **Eski HTTP görsel fixture'ı:** Öğretmen orijinaliyle güvenli öğrenci kopyası açıkça bağlandı. Test öğrenciye güvenli görselin 200, öğretmen orijinalinin 401 dönmesini ve öğretmen erişimini doğruluyor. Üretim görsel güvenliği gevşetilmedi.
- **Windows geçici DB temizliği:** İşlev testleri sonrasında EBUSY oluşabiliyordu. Geçici dizin yolu doğrulaması ve sınırlı silme yeniden denemesi eklendi; son test komutu tamamen geçti.
- **Admin erişimi:** Eski kayıtlı hash ile .env ilk kurulum değeri eşleşmiyordu; mevcut ilk kurulum değeri ayrıca 12 karakter sınırından kısaydı. Önce `backups/quiz-2026-10-10T19-34-22.196Z.db` snapshot'ı alındı. Admin için güçlü rastgele şifre oluşturuldu ve .env INITIAL_ADMIN_PASSWORD ile eşleştirildi; admin oturumları iptal edildi. Öğretmen şifresi değiştirilmedi. Şifreler bu rapora veya test loglarına yazılmadı. User şemasında ayrı admin rolü yok; bu hesap da öğretmen yetkisi taşır.
- **Belgeler ve paket envanteri:** README sürümü/Windows açıklamaları güncellendi, bu test raporu yenilendi; `.audit` Git/Docker kapsamı dışında bırakıldı. SHA256SUMS güncel dosyalara göre yenilendi.

Son derlemelerden birinde Webpack WasmHash hatası görüldü. Eski webpack cache silinmeden `.audit/webpack-cache-beforefix` dizinine ayrıldı; aynı kaynaklarla sonraki derleme başarılı oldu. Bir paket veya framework sürümü değiştirilmedi.

Kanıtlar `.audit/test-fixed.log`, `typecheck-fixed.log`, `build-fixed.log`, `server-fixed.log`, `login-final.log`, `relocation-final.log` içindedir. Düzeltme öncesi inceleme: `docs/yerel-inceleme-2026-10-10.md`. Git deposu bulunmadığından commit/diff geçmişi yoktur.

### Güncel doğrulama sınırları

9 atlama dış referans PDF/görüntülerine bağlıdır; bu kontroller geçmiş sayılmadı. React test renderer uyarıları gerçek tarayıcı QA'sı değildir. Gerçek tarayıcı/mobil görünümü, çift tıklanan CMD dosyaları, Docker/VPS/HTTPS proxy, canlı ücretli AI ve 100 sayfa bellek dayanıklılığı bu çalışmada sınanmadı. Linux/POSIX paketleme değişikliğinin canlı koşusu yapılmadı. OCR'ın metin doğruluğu ve Faz 3D'deki 48 okunmuş + 2 yer tutucu sınırı korunuyor; bu bakım genel OCR kusursuzluğu iddiası taşımaz.

## 7 Ekim 2026 — geçmiş ortam raporu

## Kök neden → değişiklik → sonuç

| Alan | Kök neden | Değişiklik | Test sonucu |
|---|---|---|---|
| Genel Node.js çalışması | Cloudflare R2 ve ChatGPT kimlik başlıkları bağımlılığı | Aynı UI/quiz işlevleriyle Prisma/SQLite bucket ve yerel öğretmen oturumu | Gerçek Next.js üretim HTTP testleri geçti; sahte ChatGPT başlığı yetki vermedi. |
| Next.js derlemesi | Sites profilindeki named page exports ve native SQLite paketinin bundle edilmesi Next build'e uygun değildi | Taşınabilir kopyada yalnız sayfa default export'u; SQLite adapter/native paketler server external | Next 16.4.0 üretim derlemesi ve TypeScript geçti. |
| İlk DB kurulumu | Prisma schema engine boş dosyayı bu ortamda oluşturamadı | Migrate öncesi SQLite bağlantısıyla dosya başlatılıyor, aynı Prisma SQL migration uygulanıyor | Yeni dosyada migration, tekrar deploy ve ilk öğretmen hesabı kurulumu geçti. |
| Tekrar kurulabilir paketler | Platforma bağımlı node_modules ve farklı package manager giriş noktaları | Resmi pnpm 11.25 JavaScript dağıtımının dist giriş noktası, frozen lock ve açık root workspace | Install / frozen install / setup komutları geçti. Global pnpm/npm komutuna ihtiyaç yok. |
| Kalıcılık ve yetki | R2 yerine yeni depolama adapter'ının bütün akışlarda sınanması gerekiyordu | PDF/görsel/JSON/sonuç SQLite'da; session hash'i ve cookie; giriş sınırlaması | Paylaşım, kaynak PDF/görsel, öğrenci anahtar gizliliği, 100 puan, başka öğretmen engeli, restart ve logout testleri geçti. |
| Yedek | Normal dosya kopyası açık SQLite'nın tutarlı snapshot'ı olmayabilir | VACUUM INTO ile ayrı SQLite yedeği | Çalışan sunucu yanında snapshot alınıp beş saklanan nesnenin tamamı doğrulandı. |
| Güncel UI/PDF/AI davranışı | Kütüphane güncellemesi önceki dönüşüm davranışını etkileyebilir | Next/React/Tailwind/Lucide güncellendi; PDF/OCR worker sürümleri korundu | 72 ortak kontrol geçti: 68 Node testi + 4 son-şık PDF kontrolü. Referans gerçek PDF 80 soru ve dört bölüm ×20; gerçek anahtar görüntüsü 80/80. AI yanıtları mock. |

## Yeni Node sunucu doğrulaması

`test:server`: 6 alt senaryo + kapsayıcı test, çıktı **7/7 geçti**. Geçici gerçek SQLite ve gerçek Next.js üretim sunucusu kullanıldı. Giriş/CSRF/cookie, paylaşım/PDF/asset, doğru–yanlış–boş puanı/yetki, restart/oturum kalıcılığı, çalışan DB snapshot'ı, logout ve rate limit doğrulandı. Veriler test sonunda silinir.

`setup`: fresh DB + migration + ilk kullanıcı oluşturma doğrulandı. Next standalone derlemesi, asset kopyalanması, typecheck ve frozen-lock kurulumu geçti. Üretim health endpoint'i gerçek HTTP'de kontrol edildi.

## Doğrulanmayanlar ve elle kontroller

Gerçek tarayıcı görünümü, Windows çalıştırması, Docker motoru/imaj çalışması, harici VPS/HTTPS proxy ve canlı Gemini/OpenAI/OpenRouter bu ortamda denenmedi. Docker executable yoktu. Docker/Compose/Nginx dosyaları örnek dağıtım yapılandırmalarıdır; canlı çalıştıkları iddia edilmez.

1. Windows'ta ZIP'i çıkarıp kurulum ve dev komutlarını çalıştırın. localhost:3000 ve /account girişini kontrol edin.
2. Masaüstü/mobilde PDF, cevap anahtarı önizlemesi, kırpma, kaynak rozetleri ve hibrit karşılaştırma ekranını kontrol edin. AI gönderiminde vazgeçince yerel taslak kalmalı.
3. Kendi anahtarınızla bağlantı/görsel desteği testi yapın; dijital AI önerisini kabul/ret/geri al ve manuel kilidi kontrol edin. Anahtar ekran görüntüsüne alınmamalı; sekme yenilemede anahtar yeniden girilmeli.
4. Docker sunucuda compose up --build; health endpoint'inde ok:true; terminalde ilk hesap; kalıcı volume ve restart sonrası sınav/sonuç kontrolü.
5. HTTPS alan adını APP_ORIGIN'a yazın, COOKIE_SECURE=true ayarlayın. Nginx/Caddy Host ve gövde boyutu/timeout ayarlarını kontrol edin; öğrenci bağlantısını ayrı tarayıcıda deneyin.
6. Backup komutuyla snapshot alıp ayrı test kurulumunda geri yükleyin; eski dosyayı silmeden saklayın.

## Paket sınırları

Kaynak, testler, vendor worker/WASM/dil varlıkları, paket kilidi, pnpm dağıtımı, migration, lisanslar ve dağıtım dosyaları dahil. OS/CPU'ya bağlı node_modules, derleme/cache, özel Sites kayıtları, oturumlar, .env ve telifli referans PDF hariç. İlk dependency kurulumu ve hedef ortam derlemesi internet/Node gerektirir. Bu ZIP yeni SQLite deposuyla başlar; Sites kayıtlarını otomatik eşitlemez.
