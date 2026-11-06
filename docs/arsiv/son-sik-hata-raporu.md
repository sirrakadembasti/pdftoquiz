# Son şıkta alakasız PDF metni — 7 Ekim 2026

## Kök neden

1. `analyzePage` şık görüntüsü için bir alt sınır hesaplıyordu; metin biriktiren döngü bu sınırı kullanmıyordu. `Sayfa 7` temizlense bile sonrasındaki `KONTROL KODU` ve talimat, son şık metnine katılıyordu. Aynı sınır artık hem metne hem görsel alanına uygulanır.
2. PDF.js satır birleştirme işlemi yalnız yatay boşluğa bakıyordu. Dar aralıkla aynı yükseklikte duran iki sütunun şıkları tek satırda birleşiyor; aynı harfli sağ şık sol şıkkın üzerine yazılıyordu. Soru başlangıçlarından sütun ayırıcı hesaplanır; PDF metin parçaları ve OCR sözcükleri sütunlar arasında birleştirilmez. Okuma sırası sol sütun yukarıdan aşağı → sağ sütun yukarıdan aşağıdır.
3. Tekrar algılama OCR öncesindeki dijital metinle yapılıyordu; taranmış sayfalarda görülecek metin yoktu. OCR ilk geçişe taşındı. Dijital/OCR satırları toplandıktan sonra belge boyunca tekrar eden marj metinleri bulunur. Değişen sayfa numaraları ve OCR'ın `•` işaretini `*`/`«` okuması normalize edilir.
4. Talimat ve ders başlıkları yeterince tanınmıyordu. Bağımsız talimat başlıkları, sayfa kenarındaki çıplak numaralar, bilinen filigranlar ve tekrar eden üst/alt bilgiler ayrı sınıflanır. `Talimatı öğrenci okur.` gibi normal bir şık devamı kesilmez.
5. Taranmış örnekte C harfi `©)` olarak okunuyordu. Mevcut dar kapsamlı OCR düzeltmesi, aynı hizada B ve D arasında bulunan bu biçimi de kapsayacak şekilde genişletildi; genel telif işaretleri C şıkkına dönüştürülmez.

## Aynı PDF'lerin gerçek önce/sonra çıktıları

Eski sürümün kodu ile yeni kod aynı dört test PDF'sine uygulandı. Önce kayıtları düzeltme öncesinde oluşturuldu. Tam metin çıktısı: [../tail-comparison.json](../tail-comparison.json).

| PDF | Önce | Sonra |
|---|---|---|
| `tail-single.pdf`, soru 1 / D | `Gerçek şık metni ikinci satırda devam eder. KONTROL KODU: ZX-41 Talimat: Sonraki bölüme geçiniz.` | `Gerçek şık metni ikinci satırda devam eder.` |
| `tail-columns.pdf`, soru 1 / C | `Sağ C` | `Sol C` |
| `tail-columns.pdf`, soru 1 / D | `Sağ D TALİMAT: Cevapları kontrol edin.` | `Sol D` |
| `tail-columns.pdf`, soru 2 | Yalnız `Sağ A`, `Sağ B` | `Sağ A`, `Sağ B`, `Sağ C`, `Sağ D` |
| `tail-repeated.pdf`, soru 1 / D | `4 KURUM İÇİ KOPYA • 1` | `4` |
| `tail-scanned.pdf`, soru 1 / D | `4 KURUM İÇİ KOPYA * 1 ÖRNEKTİR DİKKAT: Kitapçığı teslim ediniz.` | `4` |

## Doğrulama

- Dört yeni gerçek PDF dosyası üretildi: çok satırlı şık + sayfa geçişi; dar iki sütun; numaralı tekrar eden marj metni; aynı sayfaların raster/taranmış sürümü. Bunlar kullanıcı tarafından yüklenen gerçek sınavlar değil, hatayı yeniden üretmek için hazırlanmış örneklerdir.
- Her PDF PDF.js ile açılıp `convertPDF` üzerinden dönüştürüldü. Raster örnekte gerçek Türkçe/İngilizce Tesseract OCR kullanıldı.
- Çıkarılan soru sayıları sırasıyla 2, 3, 2, 2 olarak doğrulandı. Son seçeneklerde talimat, kontrol kodu, kurum alt bilgisi, filigran ve sonraki başlık bulunmadığı assert edildi.
- Dar sütun örneğinde soru sırası 1 → 2 → 3, her sütunun tüm şık metinleri ve şık görsellerinin varlığı doğrulandı.
- Çok satırlı D şıkkının ikinci satırı korunuyor. D şıkkının görsel kutusu `Sayfa 7` satırından önce bitiyor.
- Geçerli `12 sayfa okunmuştur.` ve `Talimatı öğrenci okur.` devamları korunuyor. Metin tabanlı `parsePages` yolu için talimat sonlandırma testi de var.
- Mevcut 20 regresyon testi (önceki dijital/taranmış PDF'ler, arayüz ve API akışları dahil) geçti. Yeni PDF testi ayrı çalıştırıldı. TypeScript kontrolü ve üretim derlemesi yapıldı.

Tek komut: `pnpm test` veya `node tests/quiz-regression.mjs && node tests/tail-regression.mjs`.
PDF üretimi: `python3 tests/create-tail-fixtures.py` (ReportLab, PyMuPDF ve DejaVu Sans gerekir).

## Sınırlar

Soru/şık metniyle aynı yerde üst üste basılmış filigranın pikselleri yeniden oluşturulmaz; tanınan filigran metni ve ayrı filigran alanı şık dışına alınır. Örtüşen görüntü için öğretmenin elle alan seçimi veya filigransız kaynak kullanması gerekir.

Bilinmeyen tek seferlik metin, son şıkla aynı biçim ve aralıkta yazılmışsa anlamsal sınırı kesin çıkarmak mümkün olmayabilir. Mevcut uzak satır kesme kontrolü korunur; bu belirsiz sınır için öğretmene uyarı eklenir. Çok sütunlu/magazin düzenleri ve sayfalar arası devam eden sorular ayrıca kontrol gerektirir.

AI'ya sütun sırası ve son şık sınırı talimatı eklendi; bu sağlayıcıların canlı çıktısı kullanıcı API anahtarı olmadan doğrulanmadı. Yukarıdaki kesin sonuçlar yerel PDF/OCR yoluna aittir. Gerçek tarayıcı görsel QA'sı bu ortamda yapılmadı.

Mevcut tasarım, dosya düzeni, paylaşım ve öğrenci akışları korunmuştur. Eski paylaşımlardaki kayıtlı soru metinleri otomatik yeniden yazılmaz; PDF yeni kodla tekrar içe alınmalı ve yeni sürüm olarak paylaşılmalıdır.
