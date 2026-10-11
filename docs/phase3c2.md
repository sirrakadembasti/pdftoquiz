# Faz 3C-2 — kırmızı kalem ve görsel güvenliği

Üretimde OCR girdisi/ayarları ve 3C-1 parser değişmedi. Düz R baskın maske (k=35/60) ve 30 piksellik bileşen filtresi gerçek taramada 46/50'yi geçmedi: 7 geri geldi, 9 şıksız kaldı; 21/23 noktalamasız sayıya dönüştü. Bu nedenle OCR ön temizlemesi uygulanmadı. ≥47/50 kabul koşulu sağlanmadı.

Taranmış soru, şık ve bilgilendirme kırpmalarının öğrenci kopyası beyaza silinir: Güçlü kırmızı: R-G>35 ve R-B>35, alpha>20. Soluk kenar: ≥30 piksellik 8-bağlı güçlü bileşenin en fazla 2 piksel çevresinde R-G>16 ve R-B>16. Siyah/gri pikselin kanal farkı ≤16 ise değişemez; alpha korunur. Daha düşük eşik OCR'da kullanılmaz: soluk/koyu kırmızı görsel izlerini kaldırmak için öğrenci ve AI yoluna özgüdür. Dijital şık metinlerinin önceki griye dönüştürme davranışı korunur.

Öğretmen orijinal kırpma/PDF'yi görür. Koruma bağlaması eski veya sonradan değiştirilmiş görseli öğrenciye göndermez. Kapak/bilgilendirme bağlaması da kaynak değişince geçersiz olur; API varlık adresleri normalleştirilirken yeniden bağlanır. Ayrılan/AI aday blokların güvenli kopyaları da korunur. Gizleme kapalıysa önizleme/paylaşım engellenir.

AI tam sayfa ve hibrit kırpmaları kırmızıdan temizlenir. Gerçek kırmızı şekil ile kalem izi güvenilir biçimde ayrıştırılamaz: temizlenen sayfa/AI gönderimi öğretmene uyarı verir. Silinen renk altındaki baskı yeniden oluşturulmaz. OCR düzeltmesi veya güven puanı değişikliği yapılmadı.

`pnpm test`: piksel koruma, üretilen kırmızı tarama, öğrenci API/öğretmen varlık yetkisi, React önizleme ve paylaşım bağlantısı. Gerçek PDF için REAL_REFERENCE_PDF; doğruluk/görsel testinde isteğe bağlı REAL_OCR_REPLAY PNG hash doğrulamalı önceki ölçümdür, süre kanıtı değildir. API testi eksik şık metni/cevap/kontrol alanlarını yalnız in-memory öğretmen test verisinde tamamlar.

`pnpm test:ocr`: üretim 144 DPI tabanı. `OCR_RED_ABLATION=1 pnpm test:ocr`: yalnız ölçümde maske ve tohumlu kırmızı işaret karşılaştırması. Ayrıntılar scripts/ocr/README.md. Sentetik görsel/PDF binary'si depoya eklenmez; mevcut bağımlılık/vendor dosyaları değişmez.

Son doğrulama: dijital Tapu 50/50, dört şık, OCR callback 0; Tapu 144 OCR 37/50. Gerçek tarama 46/50, tam beş farklı harf 18, şüpheli 30, yanlış sayfa/sütun/fazla/tekrar 0. Gerçek taramadaki 243 ve üretilen kırmızılı taramadaki 21 öğrenci API görselinde kırmızı piksel oranı ≈0 (<%0,01); JPEG tekrar kodlamasında tek piksel kalabilir. Browser QA mevcut değil; React/API entegrasyonu gerçek tarayıcı kontrolünün yerine geçtiği iddia edilmez. 3C-3–3F başlatılmadı.
