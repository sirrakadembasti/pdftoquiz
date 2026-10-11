# Taşınabilir sürüm test raporu — 7 Ekim 2026

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
