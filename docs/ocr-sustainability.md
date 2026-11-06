# OCR dönüşüm altyapısı ve sürdürülebilirlik

## Amaç

PDF dönüşüm hattı belirli bir dosyanın soru numaralarına, dosya adına veya soru/şık cümlelerine bağlı olmadan numaralandırılmış çoktan seçmeli sınavları işlemek üzere tasarlanır. Yerel OCR sonucu kesin kabul edilmez; belirsiz alanlar öğretmen önerisi ve açık kalite kapısı olarak kalır.

## Genelleştirilen eksik şık kurtarma akışı

Eksik bir A-E işareti bulunduğunda üretim kodu artık soru içeriğini veya beklenen cümleyi eşleştirmez. Öneri şu yerleşim sinyallerinden üretilir:

1. Önceki ve sonraki güvenilir şık işaretlerinin düşey sırası belirlenir.
2. Eksik yuva için beklenen düşey başlangıç, komşu işaretler arasındaki konumdan hesaplanır.
3. İçerik sütununda bu başlangıca yakın sahipsiz satırlar aranır.
4. Büyük harf, sayı, sembol başlangıcı veya sola hizalama sıfırlanması yeni şık başlangıcı için yardımcı sinyal olur; metnin anlamı kullanılmaz.
5. Aynı fiziksel satırda OCR tarafından ayrı parçalara bölünen içerik soldan sağa yeniden sıralanır.
6. Bozulmuş şık işareti yalnız OCR sembol kutusu marker sütununda kaldığında çıkarılır; kelime düzeltmesi yapılmaz.
7. Sonuç otomatik olarak şık metnine yazılmaz. Öğretmenin “Bu metni Şık X olarak kullan” onayı gerekir.

Belirsiz veya beklenen bölgeden uzak metin için öneri üretilmez. Böylece yanlış metni sessizce bir şık olarak uygulamak yerine mevcut eksik-şık kalite kapısı korunur.

## Korunan kurallar

- Yeni ürün bağımlılığı eklenmedi.
- OCR ayarları `tur+eng`, OEM 1, PSM 11 ve 144 DPI olarak kaldı.
- 3C numara/sütun kuralları ve kırmızı bileşen eşiği değişmedi.
- Otomatik metin düzeltmesi yapılmaz.
- PDF cevap anahtarı algılansa bile otomatik uygulanmaz.
- Öğrenci verisine cevap anahtarı, öğretmen kaynak görseli veya birleşik soru+şık görseli gönderilmez.
- Üretim mantığı tek kaynaktadır (kök `lib/`); eski `sites-source` kopyası kaldırıldı.

## Doğrulama

- Genel sentetik metin: eksik orta şık, çok satırlı içerik ve komşu şık ayrımı.
- Belirsiz durum: uzak/yalnız önceki şık devamı öneriye dönüşmez.
- Marker bozulması: harf artığı metinden değil OCR sembol koordinatından çıkarılır.
- Parçalı satır: aynı fiziksel satırın parçaları soldan sağa birleştirilir.
- Kaynak bağımsızlığı: üretim kodunda referans PDF cümlesi, dosya adı veya hedef soru numarası eşleşmesi bulunmaz.
- Gerçek taranmış referans: 50/50 sıra; Q25-C ve Q39-C genel geometriyle eksiksiz öğretmen önerisi; otomatik uygulama yok.
- FAZ 3I hedef paketi: 16/16.
- Tam standart paket: toplu cevap aktarımı regresyonları eklendikten sonra 232/232 geçti, 0 başarısız, 0 atlanan.
- Belgeye özgü dokuz kabul kontrolü standart paketten ayrıldı; `bun run test:acceptance` gerekli dört dosya yolu verilmeden açık yapılandırma hatasıyla durur.
- Önceden zorla atlanan React öğretmen önizlemesi ve paylaşılan öğrenci bağlantısı testi artık standart pakette çalışır ve geçer.
- TypeScript ve Next.js 16.4.0 üretim build'i başarılı; 7/7 statik sayfa üretildi.

Katmanların ayrıntılı kapsamı ve fixture taşınabilirliği için [test stratejisine](test-strategy.md) bakın.

## Desteklenen kapsam ve sınırlar

Altyapı, numaralandırılmış ve çoğunlukla A-E/2-5 şıklı Türkçe veya İngilizce sınav düzenleri için geneldir. Tek/çift sütun, çok satırlı şık, şekilli şık, kod kutusu ve sayfa devamı desteklenir.

Bu kapsam “her türlü taranmış belgeyi hatasız anlama” garantisi değildir. Farklı alfabe, serbest el yazısı, şık işareti olmayan tablo düzeni veya alışılmadık cevap yerleşimi yeni bir yerleşim stratejisi gerektirebilir. Böyle bir strateji eklenirken içerik/dosya adı sabitlenmemeli; yeni geometri sinyali, belirsizlik kapısı ve bağımsız sentetik regresyon birlikte eklenmelidir.
