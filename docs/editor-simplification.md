# PDF düzenleyici sadeleştirmesi — 11 Ekim 2026

Kullanıcının onayladığı değişiklikler mevcut PDF/OCR, sınav JSON'u ve öğrenci güvenliği yapısıyla uygulandı. Yeni bağımlılık eklenmedi.

- Soru ve şık gösteriminde radio grupları kaldırıldı. “Soru görselini göster” ve “Cevap şıklarını görsel olarak göster” checkbox'ları var. Alanı olmayan yeni/eski kayıtlar varsayılan metin gösterir; checkbox işaretsizdir. Daha önce açıkça kaydedilmiş tercihler korunur. Şık checkbox'ı soru metninden sonra cevap seçeneklerinin hemen üstündedir. Tekrarlanan eski visual/M3 checkbox'ları kaldırıldı; güvenli eski tam görüntü kayıtlarının veri uyumluluğu korunur.
- Soru metni ve ayrı “Dönüştürülmüş metin görünümü” tek düzenlenebilir yüzeyde birleştirildi. Kalın, altı çizili, liste, geri al, yinele ve biçimi temizle araçları var. Yapıştırma düz metin kullanır; JSON yalnız metin ve mevcut kalın/altı çizili aralıklarını saklar. Öğretmen değişikliği AI'ya karşı manuel kilitli kalır; önizleme/yayın aynı metni ve biçimleri kullanır.
- Soru ve her A–E şık görseli için PDF'den seçim düğmeleri var; boş şık görseli yuvaları da görünür. PDF kırpma önizlemesi hedefi isimlendirir; onaylanan kırpma o alana eklenir. Bu işlem görüntü checkbox'ını otomatik açmaz. Orijinal öğretmen kopyası ve korumalı öğrenci kopyası birlikte güncellenir. Marker geometrisi bilinmeyen/eksik bir şık güvenli sayılmaz; mevcut yayın engeli korunur.
- “Toplu cevap anahtarı giriş alanı ve gösterim alanı” altında soru sayısına göre tüm satırlar görünür. PDF'den tespit edilen ve uygulanan/manuel cevap ayrı sütunlardadır. Eksik soruların satırları gösterilir; soru oluşturulmadan cevap uygulanmaz. Bölüm numarası tekrarı, anahtar çakışması, kitapçık uyuşmazlığı veya geçersiz şık tespiti uyarılır. Görsel anahtar yükleme, OCR, metin/tablo yapıştırma ve öğretmen onaylı toplu uygulama korunur. Her soru için doğrudan manuel seçim de vardır.
- 23 Ekim güncellemesinde PDF anahtarı bilgi satırına “Cevapları aktar” düğmesi eklendi. Düğme yalnız tabloda güvenli eşleşme olarak gösterilen cevapları topluca uygular. İşlemden önce aktarım sayısını, farklı bir manuel cevabın üzerine yazılacaksa ayrıca değişecek cevap sayısını gösteren onay açılır. Onay reddedildiğinde sınav değişmez; aktarım sonrasında cevap kaynağı manuel olarak kilitlenir, soru kontrol durumu sıfırlanır ve canlı özet yeniden hesaplanır.

Gerçek Programcı PDF'sinin önceki doğrulanmış dönüşüm verisiyle yeni cevap tablosu sınandı: **50 soru satırı, sayfa 12'den 50 tespit edilmiş cevap, 0 uygulanmış cevap, 0 belirsiz eşleşme**. Bu düzenleme sırasında PDF dönüşüm boru hattı değişmedi; yeniden gerçek OCR çalıştırıldığı iddia edilmez. [Kanıt sayıları](editor-simplification-evidence.json).

Yeni testler checkbox varsayılanını/kapsamını, açık metin biçimlerinin kaydını, eksik soru satırlarını, belirsiz bölüm eşleştirmesini, güvenli kırpma aktarımını, tek editör yüzeyini, satır sonları/biçimlendirme ve öğrenciye biçim aktarımını sınar. Eski React testleri yeni bileşen ve adlandırılmış hedefleri kullanacak şekilde güncellendi; manuel AI kilidi testinin davranışı korunur.

Gerçek tarayıcı aracı zaman aşımına uğradı. Canlı tarayıcı düzenleme, araç çubuğu/native undo, dokunmatik ve görsel yerleşim **doğrulanamadı**; React/DOM sözleşmesi testleri gerçek tarayıcı doğrulaması olarak sunulmaz.

Son doğrulama:

- Standart test paketi: **178 test; 169 geçti, 9 referans testi atlandı, 0 hata**. Yeni düzenleyici testleri 9/9 geçti. Fixture kontrolleri de tamamlandı.
- Son kaynak üzerinde TypeScript kontrolü ve nihai üretim derlemesi: çıkış 0.
- Nihai paket üzerinde gerçek HTTP/SQLite ve taşınabilir paketleme: **9/9 geçti**. İlk deneme boş sunucu günlüğüyle başlangıç zaman aşımına uğradı; aynı test değişiklik yapılmadan tekrarlandığında geçti. İlk zaman aşımının kesin nedeni doğrulanamadı.
- Yeni cevap tablosu gerçek kaynak dönüşümündeki 50 cevabı gösterdi; yeni OCR/AI çağrısı yapılmadı.
- Gerçek tarayıcı, native biçimlendirme/undo ve mobil yerleşim doğrulanamadı.

Uygulama adresi: http://127.0.0.1:3000. Kaynak kopyaları güncellendi; `SHA256SUMS` taşınabilir paket dışa aktarılırken güncel içerikten otomatik üretilir.


## Son bakım doğrulaması — 11 Ekim 2026

Body hydration düzeltmesi sonrası standart paket 180 testtir: 171 başarılı, 9 atlanan, 0 hata; bu toplam yukarıdaki 178 testlik önceki koşuya iki hydration testi ekler. TypeScript ve son üretim derlemesi geçti. [Güncel test raporu](../TEST-REPORT.md) ve [hydration incelemesi](hydration-and-git.md). Eski gerçek PDF ölçümleri ve tarayıcı doğrulama sınırları korunur.


## FAZ 3G güncellemesi — 12 Ekim 2026

Elle şık tamamlama, 250 DPI aday önizlemesi, açık görsel onayı, uyarı yenileme ve konuma göre ölçüm eklendi. Önceki tarihli sayılar korunur; güncel envanter ve doğrulanamayan kontroller [FAZ 3G raporunda](phase3g.md). Gerçek tarayıcı giriş/PDF yükleme simülasyonu tamamlanmadı.

## Toplu PDF cevabı aktarımı — 23 Ekim 2026

Kök Next.js uygulaması ile `sites-source` aynası aynı davranışa getirildi. Saf veri regresyonu güvenli cevapların birlikte uygulanmasını, çakışmalı/geçersiz eşleşmelerin korunmasını ve kaynak sınav nesnesinin değiştirilmemesini sınar. React akış testi onay reddinde manuel seçimlerin değişmediğini, onaydan sonra üç cevabın birlikte aktarıldığını ve durum metninin güncellendiğini doğrular. Güncel paket sonuçları [TEST-REPORT.md](../TEST-REPORT.md) içindedir.
