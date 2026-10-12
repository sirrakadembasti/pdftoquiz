# FAZ3G doğrulama kaynakları ve sınırlar

12 Ekim 2026 tarihinde `.audit/phase3g-validation.mjs`, önceki gerçek Programcı OCR tekrar yürütme dosyası `.audit/phase3f-current-open/exam.json` üzerinde güncel `quiz`, `question-quality` ve bağımlılıklarını transpile ederek çalıştırıldı. Bu kaynak canlı veritabanının son haliyle doğrulanmış değildir. Son kodla envanter yeniden hesaplandı; canlı taslakla eşitleme yapılmadı.

- Gerçek referans: **50 yuva, 48 okunan soru, 2 yer tutucu (5 ve 21)**. 50 sorunun tamamında gövde ve şık metni varsayılanı (M1) vardır.
- Bu snapshot ve ölçüm sırasında kullanılan güvenlik işlevleriyle gövde/şık/tam görsel kullanılabilirliği **3/3/3** bulundu. Bu değer, seçili öğrenci görselinin imza doğrulamasını ve mevcut güvenlik kilitlerini içerir; ham görsel sayısı veya yeni canlı taslak durumu değildir.
- Yayın kilitli: 250 sorun; bütün 50 kayıt etkilenir, ayrıca sınav adı boş. Öğrenci önizlemesi kilitli: 56 sorun. Otomatik geometri sınır kontrolünde ayrı HEADER/FOOTER/NEIGHBOR kodu bulunmadı; bu tarayıcıda görsel doğrulama değildir.
- Kaynak alan uyarı sayıları: SEQUENCE_INFERENCE 28, CODE_CONTENT 18, LOW_READING 3, RED_CONTENT_REVIEW 48, LOCAL_WARNING 48, NO_ANSWER_KEY 50, UNREADABLE 2, MISSING_OPTION 7, NUMBER_INFERENCE 1, TARGETED_OCR 1. Bu sayımlar her soruda kodu yalnız bir kez sayar; kalite sınıfı ayrımı JSON satırlarında vardır.

## Bağımsız 49 soru

Çalışma alanının PDF dosyaları (`node_modules`, `.git`, `.audit` dışarıda), `.audit` PDF dosyaları ayrıca ve `C:/Users/ahmet/Desktop` PDF/ad filtreleri kontrol edildi. Çalışma alanında yalnız test fixture dosyaları ve kopyaları; Masaüstünde yalnız `grup-36---programci(1).pdf` bulundu. Bağımsız 49 soruluk gerçek kaynak bulunmadığı için yeni OCR çalıştırılmadı.

Önceki 49 kayıt senaryosu, gerçek 50 yuvalı sonuçtan 23. sorunun çıkarılmasıyla hazırlanmış **simüle taslak regresyonudur**. Bağımsız OCR koşumu sayılmaz. Gerekli girdi: orijinal 49 soruluk PDF veya önceki 49 sonucunun kesin kaynak PDF’si ve değişmeyen, yeniden üretilebilir OCR ayarları.

## Dijital Tapu 50/50

Aynı konumlarda dijital Tapu kaynak PDF’si bulunmadı. Gerçek 50/50 dönüşüm ölçümü yapılmadı. Gerekli girdi: daha önceki 50/50 beklentisinin dayandığı orijinal metin katmanlı Tapu 50 soruluk PDF.

## Gerçek tarayıcı ölçümü

Computer Use skill okundu. İlk `cua.getState()` 31,808 saniyede zaman aşımı ve kernel reset üretti. İkinci deneme 26,654 saniyede envanter döndürdü: yalnız boş IAB/MCP Apps sekmeleri, erişilebilir native uygulama yok. `http://127.0.0.1:3000` için gizli IAB sekmesi 16,286 saniyede `Timed out waiting for the Browser webview to attach for this browser-use page` hatası verdi. Görünür deneme `IAB visibility is not supported in a subagent thread` hatası verdi.

Ana ajanın görünür IAB denemesi de 411,282 saniyede zaman aşımı ve kernel reset verdi. Gerçek giriş/PDF yükleme, 1280/768/390/360 viewport ölçümü veya tarayıcı ekran görüntüsü üretilmedi. Çalışan yerel tarayıcı bağlantısı gerekli; kaynak PDF/canvas çıktıları tarayıcı kanıtı sayılmadı.

Son envanter: 50 kilitli ve 50 uyarılı soru; 47 yapısal, 8 metin, 50 bilgi uyarılı kayıt. 44 soruda mevcut eksik şık görseli yayın engeli var.

Makinece okunabilir kanıt: [validation-evidence.json](validation-evidence.json).
