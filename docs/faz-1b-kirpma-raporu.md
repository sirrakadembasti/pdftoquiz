# Faz 1B — Kırpma kalitesi: gerçek PDF çalıştırması

8 Ekim 2026. Tapu Programcı referansı, 2.0.3 öncesi/sonrası çıktıları ile karşılaştırıldı. Düzeltme genel yerel ayrıştırıcıdadır; dosya adı veya belirli soru numaraları kurala sabitlenmedi. Kaynak PDF ve renkli öğretmen kaynağı değiştirilmedi. Eski numara, metin/şık, renk güvenliği ve hibrit onay akışları korunur.

## Gerçek çalıştırma

Gerçek PDF dosyası Node.js ortamında PDF.js ile açıldı, bütün sayfaları canvas üzerine işlendi ve `convertPDF(mode: local)` baştan çalıştırıldı. Bu bir mock PDF veya önceki JSON'u okumak değildir. AI ve OCR kullanılmadı; bu kaynak dijital metin katmanına sahiptir. Aynı gerçek dönüşüm otomatik testte de tekrarlandı. Kaynak sayfalarla 12, 16, 23 ve 30'un güvenli soru/şık kırpmaları karşılaştırıldı.

Bu oturumda gerçek tarayıcıdaki öğretmen/öğrenci akışı ve Windows/yerel SQLite sunucusu çalıştırılmadı. Gerçek PDF işleme sonucu ile tarayıcı uçtan uca test sonucu birbirine karıştırılmamalıdır.

## 3.1 — Üst/alt sınır

Önce: soru 16'nın üst kırpması kitapçık A'sının alt kısmını içeriyordu. Sayfa üstü metin analizinden çıkartılsa da orijinal sayfa piksellerinde kalıyordu. Soru başlangıcına uygulanan 0,009 sayfa yüksekliği (7,58 pt) üst boşluğu harfin alanına taşıyordu.

| Ölçüm | Önce | Sonra |
| --- | --- | --- |
| Kitapçık A'sının dikey alanı | 35,88–57,84 pt | Kaynak değişmedi |
| Soru 16 kırpma başlangıcı | 55,06 pt | 59,52 pt |
| Harf alanıyla çakışma | 2,78 pt | 0 pt |
| Soru numarası metin başlangıcı | 62,64 pt | Korundu |
| Alt bilginin başlangıcı | 795,10 pt | Kırpmanın dışında |

Sonra: kendi soru/sütun alanıyla kesişen, soru başlamadan önce biten ve üst bilgi/gürültü olarak tanınan satırlar kırpmanın üst sınırını belirler. Metin kutusundan sonra 0,002 sayfa yüksekliği boşluk bırakılır. Alt bilgi satırının önünde de 0,003 sayfa yüksekliği sınırı uygulanır; mevcut güvenli alt sınır korunur. Sayfanın üst kısmı her PDF'de körlemesine kesilmez: üst bilgi bulunmayan erken başlayan soru sentetik testte korunur.

Akış şemasının içindeki **A?** etiketi üst bilgi değildir ve korunur. Şekle ait satırlar soru başlangıcından sonraysa üst sınır hesabına alınmaz.

Önce/sonra görseli: `phase1b-crop-evidence/question16-before-after.png`.

## 3.2 — Şekil, kod ve metin tamlığı

İlk görsel incelemede dört sorunun ana içerikleri görünüyordu. Ek PDF.js görüntü operatörü ölçümü, soru 23'ün kod panelinin sağ kenarında 7,32 pt kayıp olduğunu ortaya çıkardı; bu da düzeltildi. Soru kökü ile ilk şık arasındaki alt boşluk 0,009 yerine 0,002 sayfa yüksekliğine çekilerek kökün altına daha fazla nefes alanı bırakıldı; ilk şık yine soru görseline alınmaz.

| Soru | Kaynak PDF sayfası | Gerçek dönüşümde kontrol |
| --- | --- | --- |
| 12 | 3 | Pseudocode, soru kökü ve dört şık mevcut. |
| 16 | 3 | Akış şeması, iç A?/F?/I? etiketleri ve dört uzun pseudocode şıkkı tam; dış kitapçık A'sı yok. |
| 23 | 4 | Dört Java kod paneli sağ kenarıyla birlikte tam; soru kökü ve dört şık mevcut. B/C eşitliği uyarısı korunuyor. |
| 30 | 6 | Fiyat formu, TL/USD/EUR/GBP sekmeleri, min/max alanları, kod/metin ve dört şık mevcut. |

PDF.js `paintImageXObject` / `paintInlineImageXObject` operatörlerinin dönüşüm matrisi gerçek görsel dikdörtgenlerini verir. Görselin merkezi sorunun gövdesi veya şık hücresindeyse o alan gerçek görsel sınırına ve küçük kenar boşluğuna genişletilir. Üst/alt bilgi sınırı korunur. İç içe Form XObject matrisleri açılıp kapanırken geri yüklenir. Sayfa dışına taşan büyük/tile görüntü dikdörtgenleri genişletme için kullanılmaz; mevcut yerel kırpma korunur. Böylece yalnız bir bölümü gösterilen arka plan görüntüsü tüm soru alanını büyütmez. Bu yol dijital PDF'lere uygulanır; OCR sayfasının bütün sayfa bitmap'i soru görseli sayılmaz.

Soru 23 görseli **303,96–587,76 pt** yatay alanını kaplıyor; eski sağ kırpma **580,44 pt**, yeni sağ kırpma **588,65 pt**. Görselin tamamı artık içeride. Soru 16 akış şeması ve soru 30 formu için de gerçek operatör dikdörtgeninin bütünü otomatik olarak doğrulanır. Yeni bağımsız ölçüm, ilk gözle incelemenin sınırını ortaya çıkardığı için raporda açıkça kaydedildi.

Gerçek PDF testi şekil/kod alanlarının kaynak koordinatlarıyla soru kırpmasının içinde kaldığını, güvenli gövde ve tüm şık görsellerinin açılabilir olduğunu ve soru/şık hücrelerinin alt bilgi alanına girmediğini doğrular. Sentetik raster testinde siyah üst bilgi pikselleri kaldırılırken şeklin 9.600 mavi pikseli eksiksiz korunmuştur. Görseller ayrıca gözle incelendi.

## 3.3 — Gerçek devam uyarısı

Önce: `lastY > 0,85` koşulu yalnız sayfadaki konuma bakarak uyarı çıkarıyordu. 841,92 pt sayfada eşik 715,63 pt idi. Sonraki sayfada devam bulunması kontrol edilmiyordu.

| Soru | Kaynak sayfa | Son metin konumu | Önce | Sonra |
| --- | --- | --- | --- | --- |
| 6 | 2 | %87,43 | Yanlış yakınlık uyarısı | Uyarı yok |
| 11 | 2 | %86,84 | Yanlış yakınlık uyarısı | Uyarı yok |
| 21 | 4 | %91,06 | Yanlış yakınlık uyarısı | Uyarı yok |
| 39 | 7 | %87,03 | Yanlış yakınlık uyarısı | Uyarı yok |
| 50 | 8 | %92,34 | Yanlış yakınlık uyarısı | Uyarı yok |

Sonra: sırf sayfanın altına yakın diye uyarı üretilmez. Mevcut devam tespiti gerçek bir sonraki sayfa parçasını eşleştirip birleştirdiğinde kaynak sayfaları belirten “sayfalardaki parçalar birleştirildi; sınırı kontrol edin” uyarısı korunur. Gerçekten iki sayfaya bölünmüş sentetik PDF bunu doğrular. Eksik şık, eşleşmeyen görsel veya çözülemeyen devam gibi bağımsız uyarılar kaldırılmadı.

Bu referansta **50/50 soru**, her soruda dört şık, 70 dakika, tek bölüm ve tüm sorularda tek kaynak sayfa korunur. Bu nedenle hiçbir soruda sayfa devamı uyarısı yoktur.

## Test sonucu ve kullanım

Son `npm test` turu tamamlandı: **92 kontrol geçti** (4 PDF sınır kontrolü dahil); isteğe bağlı gerçek OCR ekran görüntüsü testi girdisi sağlanmadığı için **1 test atlandı**. Yeni 5 kırpma testi, gerçek Tapu dönüşümü, önceki 80 soruluk PDF'nin 80×4 çıkarımı ve paylaşım/öğrenci sonucu, renk güvenliği, kod/metin, numara sırası, OCR ve mock React/API regresyonları geçti. TypeScript ve `git diff --check` geçti. Üretim derlemesi paketleme sırasında ayrıca doğrulanır.

Regresyonda bir ara 80 soruluk PDF'nin görüntü genişletmesi paylaşım boyut sınırını aşmıştı. Sayfa dışında kalan tile/arka plan görüntüsü genişletmeden çıkarıldı; veri boyutu sınırı artırılmadı ve aynı 80 soruluk paylaşım testi yeniden geçti. Önceki çok satırlı şık düzenleyicisi değişikliği için React testinin alan türü de `textarea` olarak güncellendi. Koordinat kanıtları: `phase1b-crop-evidence/crop-diagnostics.json`. Referans PDF kaynak repoya veya ZIP'e eklenmedi.

Önceden kaydedilmiş taslaklar otomatik yeniden yazılmaz; öğretmen düzenlemelerini ezmemek için **PDF yeniden dönüştürülmelidir**.

```bash
TAPU_REFERENCE_PDF='/dosyalar/tapu.pdf' node --test tests/crop-quality-regression.mjs
```
