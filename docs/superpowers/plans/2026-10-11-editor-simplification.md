# Onaylanan düzenleyici sadeleştirmesi

Amaç: Mevcut JSON, öğrenci güvenliği ve PDF/OCR akışını koruyarak checkbox gösterimi, tek metin editörü, görünür kırpma hedefleri ve cevap anahtarı tablosu sağlamak.

- [x] Gösterim: DisplaySettings bileşenini soru/şık kapsamıyla çağır; her kapsamda yalnız işaretsiz varsayılanlı görüntü checkbox'ı kullan. Eski visual ve M3 checkbox'larını kaldır. Kaydedilmiş açık tercihi koru.
- [x] Metin: lib/question-text-editor.tsx tek contenteditable editör; kalın, altı çizili, liste, geri/ileri ve biçim temizleme. lib/editor-text.ts yalnız düz metin + mevcut TextMark modelini üretir. HTML saklama yok; yapıştırma düz metin. manualPatch açıkça verilen textMarks'ı korur.
- [x] Kırpma: lib/editor-crop.ts soru/şık hedefini ve güvenli kopyalarını tek işlemle günceller; gösterim tercihini değiştirmez. Her şık için boş görsel yuvası ve PDF'den seç düğmesi vardır. PDF önizlemesi hedefi adlandırır.
- [x] Anahtar: lib/answer-key.ts answerKeyDisplayRows, bölüm/soru sayısına göre tüm satırları üretir; eksik/çakışan PDF cevapları uyarılır. Mevcut manuel/görsel yükleme ve öğretmen onaylı toplu uygulama korunur. Tablo ilk açılışta da görünür ve soru başına manuel cevap seçilebilir.
- [x] Test: yeni tests/editor-simplification-regression.mjs; önce başarısız checkbox, metin biçimi, eksik cevap satırı, belirsiz bölüm eşleştirmesi ve kırpma tercihi testleri. Eski radio testi yeni onaylanmış checkbox davranışına uyarlanır.
- [x] Doğrulama: hedefli test, tüm README testleri, typecheck, üretim build, HTTP/SQLite. Ortak dosyaları sites-source'a aynala, rapor ve SHA256SUMS güncelle. Tarayıcı doğrulaması yapılamazsa açıkça belirt.

Yeni bağımlılık/OCR parametre değişikliği yok. Kullanıcı bu planın kapsamını onayladı; aynı oturumda doğrudan uygulanır. Dizin Git deposu olmadığından commit yok.
