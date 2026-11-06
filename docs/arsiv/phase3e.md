# Faz 3E — 11 Ekim 2026

## Tanılama

Öğretmen düzenleyicisindeki “Tanılama paketini indir” yalnız bu cihaza JSON indirir. Uygulama sürümü, cihaz/tarayıcı bilgisi, OCR kutu/metin/güvenleri, parametreler, sayfa süreleri, PNG SHA256 ve uyarı kodları içerir; PDF/görsel içermez. Ekran sınav metni içerdiğini bildirir. Diagnostik callback verilmezse PNG hash maliyeti oluşmaz.

Tekrar yürütme: node scripts/replay-diagnostics.mjs paket.json sonuc.json. Gerçek kaynak paketinde12 tanılama kaydı,48 parser bölgesi, **OCR çağrısı0**; parser betiği dönüştürücünün yer tutucu/depolama sürecini taklit etmez. Boş sayfa da boş kutular ve PNG hash ile kaydedilir. Tanılama süreleri tekrar yürütmede gerçek OCR süresi yerine tekrar yürütme maliyetini içerir; performans kıyası için gerçek OCR ölçümünü kullanın.

## Dayanıklılık değişiklikleri

AbortSignal çalışan OCR'ı terminate eder, worker fabrikası sıfırlanır; geç gelen sonuç kabul edilmez. Worker oluşturulurken iptal olursa geç oluşan worker da sonlandırılır. Sayfa OCR varsayılan60sn, toplam dönüşüm30dk sınırına sahiptir. Zaman aşımında sayfa OCR_FAILED/TIMEOUT olarak öğretmen incelemesine kalır. İptal kısmi dönüşümü kaydetmez; bellek hatası soru oluştuysa açıkça kısmi taslakla döner ve “PDF'i bölün” yönlendirmesi verir.

Sayfa canvas/safeCanvas ölçüleri sayfa bitince1×1 yapılır; finally geçici canvas'ları temizler, page.cleanup çağrılır. Kaydetmede aynı varlık depolama önbelleğiyle tekrar yazılmaz. Her sayfa sonunda ana iş parçacığına yield; x/N ilerleme, geçen süre, yaklaşık kalan süre,120sn'den sonra uzun işlem uyarısı. ETA yüzde ilerlemesine dayanır; OCR ve kırpma farklı maliyetli olduğundan garanti değildir. İkinci worker eklenmedi; ölçülmüş fayda olmadan bellek çoğaltılmadı. OCR worker iptalinin doğrulanması, tarayıcı WASM belleğinin GC sonrası kesin serbestliğini kanıtlamaz.

Testler: çalışan OCR iptali/terminate/reset, geç sonucun reddi; oluşturma sırasında iptal;15ms test zaman aşımı ve yeni worker ile tekrar okuma; tanılama paketi parametre/metin/no-image. Kontrollü gerçek cihaz OOM ve tarayıcı yeniden yükleme/bellek ölçümü yapılmadı; bu kabul kalemi açık.

## Bellek/süre ölçümleri

Tapu referansı workspace/Desktop/Downloads'ta bulunamadı. Betik tests/fixtures/scanned.pdf ikinci sayfasından JPEG tabanlı taranmış PDF'leri bellekte üretti; PDF binary eklenmedi. Tapu sayfalarından üretilmiş sayılmaz. Her kopyada iki soru bulundu; aynı numaraların tekrar etmesi gerçek sınav bütünlüğü kabulü değil, işlem/bellek stresidir.

Node süreç RSS'i50ms aralıkla ölçüldü. Eğim ikinci işleme aşamasının ilk/son RSS farkı/(N−1); regresyon eğimi veya JS heap değildir. Eşzamanlı işler süreleri etkiledi. PDF boyutu sıkıştırılmış kaynağa, bellek canvas/şık sayısına da bağlıdır.

| Sayfa | Kayıt | PDF MiB | Süre sn | Tepe MiB | Eğim MiB/sayfa |
|---|---|---|---|---|---|
| 30 | 60 | 1.38 | 257.35 | 477.34 | 4.35 |
| 60 | 120 | 2.77 | 339.01 | 474.11 | 1.09 |
| 100 | 200 | 4.61 | 443.45 | 529.09 | 1.25 |

Gerçek12sayfalık belge (10 tam sayfa OCR +3 hedefli şerit): tepe548.99MiB. OCR kayıtları arasındaki kaba RSS eğimi1.48MiB/kayıt; hedefli şeritler de içerdiği için temiz11sayfa eğimi değildir. Eksiksiz sayfa bazlı tarayıcı heap profili alınmadı. Başlangıç/son RSS ve tüm örnekler ölçüm JSON'larında; belleğin sayfalarla monoton arttığı sonucu çıkarılamaz.

## 20 MB ilişkisi

20MB sınırına yakın test: 20848686bayt (~19.88MiB),1sayfa/2soru/1OCR,19.73sn,389.32MiB tepe. Boyutun20800000baytı **referanssız dolgu stream'i**; OCR karmaşıklığını artırmaz. Bu, dosya baytı ile OCR süresinin zorunlu doğrusal olmadığını gösterir; gerçek20MB yoğun taramanın süresini tahmin etmez. Gerçek20MB tarama ve Tapu tabanlı sentetik ölçüm eksiktir. 20MiB PDF yükleme sınırı korunuyor; sınav JSON'unun M2 nedeniyle24MiB olması ayrı bütçedir.

## Tekrarlama ve sınırlar

node scripts/measure-resilience.mjs 30 .audit/resilience-30.json;60/100 için sayıyı değiştirin. TAPU_REFERENCE_PDF verilirse kaynak bu dosya olur; yoksa sentetik fixture etiketi açıkça kalır. Betik yalnız ölçüm içindir, uygulama OCR ayarlarını değiştirmez. .audit/resilience-*-questions.json son soru içeren ölçümlerdir; önceki kapak-only kayıt0 ölçümleri geçerli soru ölçümü olarak kullanılmadı.

Faz3E uygulaması ve erişilebilen ölçümler bu raporda sonlandırılır. Gerçek tarayıcı, kesin GC/OOM, Tapu ve gerçek20MB kabul kalemleri tamamlandı diye işaretlenmez. Son doğrulama sonucu aşağıdaki ekte yer alır.

## Son doğrulama

- Tam regresyon: node scripts/run-tests.mjs, çıkış0;152test,143geçti,0hata,9harici referans testi atlandı. Ayrıca tail betiğinin dört sentetik gerçek PDF kontrolü geçti.
- Yeni Faz3D2/3E testleri16/16geçti.
- Gerçek Programcı taslağı API/görsel erişim testi1/1geçti;324güvenli görüntü piksel ölçümünde kırmızı%0. Gerçek kaynakla Node ölçümü yapıldı; tarayıcı testinin yerine geçmez.
- TypeScript kontrolü çıkış0. Üretim build çıkış0; eski webpack önbelleği WasmHash hatası verdi, .audit altında korunarak ayrıldıktan sonra yeniden derleme geçti.
- Geçici SQLite ile üretim HTTP/taşınabilir paket testleri9/9geçti; kullanıcı veritabanı test için değiştirilmedi.
- Son özel kayıtlar: .audit/phase3-tests-final.log, phase3-server-tests.log, phase3-real-api.log, phase3-typecheck-final.log, phase3-build-complete.log. Paket manifesti son raporlarla yeniden hesaplanır.

Çalışma bu iki raporla durduruldu; açık kabul eksikleri başarı diye işaretlenmedi.
