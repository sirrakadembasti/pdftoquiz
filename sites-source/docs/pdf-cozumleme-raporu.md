# Madde 3 — PDF çözümleme ve soru sayısı

## 11 Ekim 2026 güncellemesi

PDF/OCR parametreleri korunarak gösterim, sıra ve kırpma güvenliği için [Faz 3F](phase3f.md), editör ve cevap tablosu için [düzenleyici raporu](editor-simplification.md) geçerlidir. Programcı dönüşümündeki anahtar, öğretmen tablosunda 50 soru karşısında gösterilir; otomatik uygulanmaz. Aşağıdaki 7 Ekim verileri geçmiş ölçümlerdir.

7 Ekim 2026. Mevcut tasarım, paylaşım/öğrenci akışları ve Vinext/Worker/R2 yapısı korunarak PDF çözümleme yolu geliştirildi.

## Talimatlarla karşılaştırma

| Talimat | Önceki durum | Yapılan değişiklik ve kanıt |
|---|---|---|
| `1.`, `1)`, `1-`, `Soru 1` | İlk üçü destekleniyordu; Soru 1 noktalama gerektiriyordu | Noktalamasız `Soru 1`, bitişik `Soru1` ve ayrı numara satırları desteklenir. Numara/biçim testleri. |
| `A)`, `A.`, `(A)` ve 4/5 şık | İlk ikisi vardı; parantezli biçim eksikti | Parantezli satır ve inline şıklar desteklenir. Gerçek PDF'de 4/5/4 şık testi. |
| Bölünmüş soruları birleştirme | Sayfalar bağımsızdı; 0/1 şıklı başlangıç parçaları düşüyordu | Kısmi sorular tutulur. Ardışık sayfada gövde, devam eden şık harfleri veya sayfa sonundaki şık metni eşleştirilir. Metin ve görüntüler birleştirilir; kaynak sayfaları ve kontrol uyarısı saklanır. |
| Soru/şık/şüphe özeti ve düzeltme | Toplam/eksik numara uyarıları ve tekil düzenleyici vardı | Çözümleme özeti: toplam, kaynakta yazan sayı, 4/5/diğer şık dağılımı, cevap eşleşmesi ve şüpheli soru listesi. Liste düğmeleri ilgili soruya götürür. Şık, kaynak numarası, görsel, doğru cevap ve kontrol onayı düzenlenebilir. |
| Cevap anahtarı / elle giriş | Ayrı başlıklı anahtar ve yatay tablo destekleniyordu; çelişki son değere ezilebiliyordu | Boşluksuz OCR anahtarı `1E2C`, parantezli harfler ve çelişki denetimi eklendi. Belirsiz, tekrarlı veya şık sayısına uymayan eşleşme otomatik atanmaz; elle seçim istenir. |
| Anlaşılır başarısızlık | Genel hata mesajı / soru yok uyarısı vardı | Bozuk ve parola korumalı PDF için özel mesaj; hiç soru bulunmadığında kaynağı kontrol etme, elle ekleme veya AI deneme yönlendirmesi. |

## Kök nedenler ve sınır kontrolü

Soru/şık regex'leri bazı biçimleri kapsamıyordu. `analyzePage` iki şıktan az parçaları atıyordu ve belge dönüştürücü her sayfada yeni liste oluşturuyordu. Bu yüzden sınırda yarım kalan gövde/şıklar kaybolabiliyordu. Yeni yerel belge akışı bu parçaları tamamlanıncaya kadar korur; yalnız ardışık sayfadaki devam adaylarını birleştirir. Başlık/alt bilgi filtresi kullanılır. Birleştirme sonucu otomatik onaylanmaz; öğretmen kaynak sayfalarını kontrol eder.

Sayfa başındaki tek numara satırının sayfa numarası sanılması ve seçenek olmayan kısmi soruda üst başlığın alt sınır olarak alınması da düzeltildi. Açıklama başlığı altında şıksız numaralı talimatlar soru sayısına eklenmez. Sıfır/bir şıklı gerçek soru adayları kaybolmak yerine boş düzenleme alanları ve uyarılarla tutulur; bu boş alanlar algılanmış şık sayısı olarak sayılmaz.

OCR taranmış anahtarı `1E2C` okuyordu; boşluk zorunluluğu eşleşmeyi engelliyordu. Tam anahtar satırı biçimi ayrıca çözümlenir. Yatay tablo satırları arasında yanlış numara/harf eşleştirmesi oluşmaması için düz anahtar eşleştirmesi satır sınırını geçmez.

## Gerçek PDF testleri

Altı yeni dosya kontrollü test örnekleridir; kullanıcıdan alınmış sınavlar değildir. PDF.js üzerinden açılıp gerçek dönüşüm fonksiyonundan geçirilmiştir. Raster örnek gerçek Türkçe/İngilizce Tesseract OCR kullanır.

| Dosya | Doğrulanan sonuç |
|---|---|
| `parse-formats.pdf` | 3 soru; 4/5/4 şık; noktalamasız Soru 1, `2-`, `3)`, `A.`, `(A)`, `A)`; ayrı sayfadan D/E/B anahtarı |
| `parse-split.pdf` | 3 soru; soru 1 gövdesi sayfa 1–2, soru 2 D şıkkı sayfa 2–3 arasında metin/görüntüyle birleşir; normal soru 3 ayrı kalır |
| `parse-split-options.pdf` | 2 soru; ilk sorunun A/B şıkları ilk sayfada, C/D/E ikinci sayfada; tek 5 şıklı soruya birleşir; sonraki soru ayrı |
| `parse-incomplete.pdf` | 3 aday soru korunur; tek şık, eksik C, metinsiz gövde, çelişkili ve şık sayısına uymayan cevaplar işaretlenir |
| `parse-empty.pdf` | 0 soru; elle ekleme / kaynak kontrolü yönlendirmesi |
| `parse-split-scanned.pdf` | Taranmış sayfa devamı birleşir; 2 soru ve ilk soruda 5 şık; OCR anahtarı E/C eşleşir |

Tam metin/şık/anahtar sonuçları: [pdf-cozumleme-ornekleri.json](pdf-cozumleme-ornekleri.json).

Ek testler: normal sayısal cümle soru kabul edilmez; numaralı açıklama maddeleri sayılmaz; inline parantezli şıklar ayrılır; anahtar çelişkisi silinir; bozuk dosya hata mesajı doğrulanır. Parola mesajı hata türüyle test edildi; gerçek şifreli PDF örneği kullanılmadı. Metin yardımcı yolu sayfa alt bilgisinden sonraki C/D/E devamını da birleştirir.

React testi özet → şüpheli soru düğmesi → seçenek ekle/doldur → doğru cevabı seç → kontrolü onayla akışını çalıştırır; özetin güncellenmesini doğrular. Gerçek DOM/tarayıcı görsel testi değildir.

## Kontroller

- 21 uygulama/API/React regresyon testi.
- 10 çözümleme testi; altı yeni gerçek PDF dahil.
- Önceki dört son-şık PDF testi.
- TypeScript kontrolü ve üretim derlemesi.

`pnpm test` bütün test gruplarını çalıştırır. Yeni dosyalar `python3 tests/create-parsing-fixtures.py` ile üretilebilir (ReportLab, PyMuPDF ve DejaVu Sans gerekir).

## Pratik sınırlar

Bölünmüş sorularda sayfa numarası ardışıklığı, şık sırası, devam başlığı ve son satır konumu kullanılır. Standart olmayan sütun devamları, atlanan sayfalar, başlığı olmayan bağımsız cevap anahtarları ve kaynakta birden fazla testin aynı numaraları kullanması öğretmen kontrolü gerektirebilir. Belgeden tam soru sayısı çıkmadığında tahmini sayı gerçek sayı gibi sunulmaz; algılanan adaylar ve varsa kaynakta belirtilen sayı ayrı gösterilir.

OCR'ın harf/sayıları yanlış okuduğu her durum düzeltilemez; bilinmeyen cevap üretilmez. Çok sayfalı birleştirilmiş görsel boyut sınırını aşarsa kullanıcıdan alanı elle daraltması istenir. Yerel PDF/OCR yolu sayfa birleştirme testlerinden geçti; canlı AI sağlayıcısının aynı kalitede çözümlemesi doğrulanmadı ve AI'nın ayrı sayfalardaki parçaları otomatik birleştirmesi garanti edilmez. Gerçek tarayıcı görsel QA'sı bu ortamda yapılmadı.

Eski kaydedilmiş sınavlar değiştirilmez; yeni çözümleme için PDF yeniden yüklenip yeni sürüm paylaşılır.
