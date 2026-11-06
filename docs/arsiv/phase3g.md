# FAZ 3G — Elle düzeltme ve eksik doğrulamalar

12 Ekim 2026. Yeni bağımlılık, OCR parametresi, 3C kuralı ve üretim kırmızı eşik değişikliği yok. Metin yalnız öğretmen tarafından değiştirilir. Ölçüm anahtarı yalnız yerel ölçüm betiğinin belleğinde kullanılır; öğrenci yanıtına veya ölçüm raporuna cevap indeksleri eklenmez.

## 1. Soru 9 ve şekilli şıklar

**Bulgu:** Kesik şık görseli kırmızı temizlendiği için güvenli veya tamamlanmış sayılamaz. Önceki tam soru görseli, elle yenilenen şıkları geçersiz kılabilir.

**Kanıt:** Referans Soru 9 eksik görsel kontrolünde kilitli. Regresyonlar onaysız görselin engellendiğini; ham veya güvenli kopya değişince onayın iptal olduğunu doğruluyor. Eski tam görselin yeniden dönüştürmede gövde olarak dönmesi önce başarısız testle yeniden üretildi.

**Değişiklik:** Her şıkta PDF’den elle kırpma, PNG/JPEG/WebP yükleme, şık metnine odaklanma ve mevcut kaynak kutusunun **250 DPI aday önizlemesi** bulunur. Kaynak geometrisi yoksa öğretmen elle kırpar; aday otomatik düzeltilmez veya kaydedilmez. Adayı eklemek onay değildir. Temizlenmiş kopya, varsayılan işaretsiz ayrı kontrol kutusu ve öğretmenin açık onayıyla güvenli kopya sayılır. Onay hem ham hem güvenli görsele bağlıdır; asset URL’sine kayıtta yalnız geçerli onay yeniden bağlanır. Eski tam görsel bağımsız gövde/şık modeline geçirilir; ayrı güvenli gövde yoksa soru görseli kapalı kalır. Büyütme/zoom korunur. Manuel alanlar yeniden dönüştürmeye karşı kilitlidir.

**Sonuç:** Soru 9’da onaysız mevcut/kesik görsellerin yayın engeli sürer. Öğretmenin bütün gerekli şıkları tamamlayıp onaylaması, cevap ve soru kontrol onayıyla ilgili kontrollerin de tamamlanması gerekir. Otomatik testler bu akışı doğrular; gerçek Soru 9’a öğretmen adına içerik veya onay eklenmedi. Öğretmen onayı görselin nesnel olarak sızıntısız olduğunun otomatik kanıtı değildir.

## 2. Soru 6 A, 5 ve 21

**Bulgu:** Metin elle doldurulunca eski boş şık uyarısı kalabiliyor; yer tutucunun okunamadı kodu açık tamamlama sonrasında temizlenmelidir.

**Kanıt:** Regresyonlar boş A’yı doldurma, tekrar boşaltma ve yer tutucuyu açık tamamlama akışını deniyor. Referansta 5/21 yer tutucu; yedi soruda MISSING_OPTION var.

**Değişiklik:** Şık metni alanları korunur; yeni araçtan ilgili alana doğrudan odaklanılır. Elle değişiklikte eksik şık listesi tekrar hesaplanır; boşluk giderildiğinde yalnız MISSING_OPTION/EMPTY_OPTION kaldırılır. Yer tutucu otomatik kapanmaz: soru/şıklar ve cevap tamamlandıktan sonra mevcut açık tamamlama işlemi UNREADABLE kodunu kaldırır, kaynak kutusunu korur. LOW_READING ve çözülemeyen sınır uyarıları korunur. Şık sayısı değişince eski onay dizisi yeniden boyutlandırılır ve eski eşleştirmeler geçersiz olur.

**Sonuç:** Tamamlanan içeriğe ait yapısal engel güncellenir; diğer engeller sürer. Kaynağın gerçek metni tahmin edilmedi. 5/21 ve 6 A’nın gerçek öğretmen düzeltmesi henüz yapılmadı. Sentetik testte doldurulmuş soru yayın kapısını geçiyor; bu gerçek PDF içeriği doğrulaması değildir.

## 3. Konuma göre sızıntı normalizasyonu

**Bulgu:** E marker kutusundaki fazla boşluk ve harflerin farklı koyuluğu ham karşılaştırmayı etkiliyor.

**Kanıt:** [Tüm 50 soru için fark/z tablosu](phase3g-assets/leakage-summary.md) ve [ham, hizalı, normalize ölçümler](phase3g-assets/leakage-measurement.json). Gerçek Programcı PDF’si ve önceki gerçek OCR dönüşümünün kayıtlı geometrisi kullanıldı; yeni OCR koşumu yapılmadı.

**Değişiklik:** Her şıkkın kendi x/y başlangıcı korunur; A–D medyan ilk satır yüksekliği ortak ölçüm penceresidir. E’nin aşağı uzayan boşluğu paydayı büyütmez. Her harf/konumun koyuluk tabanı en az sekiz diğer sorunun sağlam medyanıyla çıkarılır; incelenen sorunun bütün gözlemleri dışarıda tutulur. Normalizasyon cevap anahtarına göre ayarlanmaz. OCR kutusuna dayalı bu yaklaşım kesin glif sınırı tespiti olarak doğrulanmadı. Üretim temizleme/maskesi değiştirilmedi.

**Sonuç:** 50 kayıt raporlandı; 43’ünde tam geometri var. **5, 6, 16, 21, 23, 25, 39 bilinmiyor.** Ham temiz marker işareti 7/43 iken normalize ölçümde 22/43; ham öncesi 6/43, normalize öncesi 20/43. Hedef sorularda temiz normalize z: 1 −8,299; 18 −0,205; 19 2,191; 24 −1,742. İlk ve üçüncü değer keşif amaçlı eşiği aşıyor. Silinen bölge 14/43, gövde kaybı 10/43. İncelenen 174 kayıtlı korumalı görselde maksimum kırmızı oranı 0; bu sızıntı yok demek değildir. Yeniden oluşturulmuş üretim marker şeridi 0/43 işaret veriyor; bu ölçüm kayıtlı görsellerin bütün markerlarının birebir ölçümü değildir. Eşikler betiğin tanımlayıcı istatistiğidir; kalibre güvenlik testi veya çoklu karşılaştırma düzeltmesi değildir.

## 4. Soru envanteri ve gerekçe kodları

**Bulgu:** Varsayılan metin seçimi, görsel kullanılabilirliği ve yayın kilidi ayrı sayılmalıdır.

**Kanıt:** Son kodla [validation-evidence.json](phase3g-assets/validation-evidence.json) yeniden hesaplandı. Kaynak `.audit/phase3f-current-open/exam.json`; SHA-256 `9daff3f26e5fa98d6054ac7352b2108acfa701641ab52f3983d4b8da1ceb6270`. Önceki gerçek dönüşümün kaydıdır; canlı veritabanının son taslağıyla eşitlendiği doğrulanmadı.

**Değişiklik:** Soru bazında gösterim, kullanılabilirlik, kalite sınıfları, sınır ve yayın gerekçeleri rapora eklendi. Sayılar aşağıda birbirinden ayrılır.

| Sayım | Sonuç |
|---|---:|
| Soru yuvası / okunan / yer tutucu | 50 / 48 / 2 |
| M1 varsayılanı, soru ve şık metni | 50 |
| Soru görseli seçilebilir / şık görseli seçilebilir | 3 / 3 |
| Güvenli eski tam görsel kullanılabilir | 3 (16, 29, 40) |
| En az bir uyarı kodu taşıyan soru | 50 |
| Yapısal / metin / bilgi uyarısı taşıyan soru | 47 / 8 / 50 |
| Yayın kilitli soru / toplam yayın kontrolü | 50 / 250 |
| Önizleme kontrolü | 56 |

3/3 görsel kullanılabilirliği eski tam görsel yolunu da içerir; üç sorunun bağımsız, onaylanmış A–E kırpmaları bulunduğu anlamına gelmez. Kilit sayımı 250 ayrı soru değildir; aynı soru birden fazla gerekçeye sahiptir. Sınav adı da boş.

| Kod/gerekçe | Soru sayısı |
|---|---:|
| NO_ANSWER_KEY, cevap uygulanmamış | 50 |
| REVIEW_REQUIRED, öğretmen kontrol onayı yok | 50 |
| INCOMPLETE_OPTION_IMAGE, mevcut görsel tamamlanmamış | 44 |
| UNREADABLE | 2 |
| MISSING_OPTION / boş şık metni | 7 |
| NUMBER_INFERENCE | 1 |
| LOW_READING | 3 |
| SEQUENCE_INFERENCE | 28 |
| CODE_CONTENT | 18 |
| RED_CONTENT_REVIEW / LOCAL_WARNING | 48 / 48 |
| TARGETED_OCR | 1 |

**Sonuç:** Güvenlik kilidi zayıflatılmadı. Otomatik sınır kontrolü ek HEADER/FOOTER/NEIGHBOR kodu üretmedi; bu gerçek tarayıcıda kutuların doğru olduğunun kanıtı değildir. Tamamlanmış sentetik elle düzeltme testi, bu değişmemiş gerçek kayıt envanterinden ayrıdır.

## 5. Bağımsız koşum ve gerçek tarayıcı

**Bulgu:** Gerekli iki bağımsız kaynak dosya bulunamadı; tarayıcı webview bağlantısı kurulamadı.

**Kanıt:** Çalışma alanı, ayrıca `.audit` PDF’leri ve Masaüstü tarandı. Yalnız fixture PDF’leri/kopyaları ve gerçek Programcı PDF’si bulundu. Önceki 49 kayıt testi, 50 yuvalı sonuçtan 23’ün çıkarıldığı simüle taslaktı. Ana ajan görünür IAB denemesi **411,282 saniyede zaman aşımı/kernel reset** verdi; diğer bağlantı denemeleri [doğrulama kaydında](phase3g-assets/validation-evidence.json).

**Değişiklik:** Yapılamayan kontroller başarı olarak yazılmadı. PDF/canvas görselleri gerçek tarayıcı ekran görüntüsü olarak sunulmadı. README ve test raporu güncellendi.

Verilen öğretmen hesabıyla gerçek yerel HTTP giriş testi ayrıca yapıldı: POST /api/auth/login **200**, aynı oturumla GET /api/auth/me **200**, hesap eşleşti. Şifre ve çerez rapora yazılmadı. Bu kontrol tarayıcıda PDF yüklemesi veya düzenleyici simülasyonu değildir. Geliştirme sunucusu 3000 portunda health 200 / ok:true / SQLite yanıtıyla yeniden doğrulandı.

**Sonuç ve gerekenler:**

- Bağımsız 49 soruluk OCR koşumu: **yapılmadı**. Orijinal bağımsız 49 soruluk PDF veya önceki 49 sonucunun kesin kaynak dosyası/koşum bilgileri gerekli; OCR ayarları değiştirilmeyecek.
- Dijital Tapu 50/50: **yapılmadı**. Beklentinin dayandığı orijinal, metin katmanlı 50 soruluk Tapu PDF’si gerekli.
- Gerçek tarayıcı giriş → Programcı PDF yükleme → düzenleme/önizleme simülasyonu: **tamamlanmadı**. Yerel uygulamaya erişen çalışan tarayıcı araç bağlantısı gerekli. Bağlantı sağlanamazsa 1280/768/390/360 genişliklerinde 1/5/6/7/9/16 sorularının gerçek ekran görüntüleri ve konsol/ağ kayıtları görsel inceleme için gerekli. Bunlar otomatik giriş/yükleme simülasyonunu kendi başına doğrulamaz.

## Otomatik doğrulama

Standart paket: **195 test, 186 geçti, 9 dış kaynak testi atlandı, 0 hata**; dört PDF fixture kontrolü de geçti. 14 elle düzeltme regresyonu pakete dahil. Metric regresyonu E geometrisi, kaymış başlangıç, harf tabanı, dışarıda bırakılan soru ve yetersiz örnek/geometri durumlarını deniyor. Asset kaydında onay imzası ve öğrenci veri alanları test edildi. Gerçek HTTP/SQLite, TypeScript ve üretim derlemesi sonuçlarının güncel kaydı [TEST-REPORT.md](../../TEST-REPORT.md) içindedir.


Üretim derlemesinde tekrar kullanılan Webpack dosya/symlink snapshot hash hatası, yerel next.config.ts içinde yalnız üretim önbelleği kapatılarak ele alındı. Temiz önbellekli ara derleme geçti; son paket bu kalıcı ayarla doğrulanır. Geliştirme önbelleği ve standalone çıktısı ayrı kontrol edildi. Webpack hook sonrası Next’in otomatik Turbopack koruması geliştirmeyi durdurdu; boş turbopack:{} ile varsayılan ayarlar açıkça korundu, geliştirme sunucusu yeniden başlatıldı ve gerçek health 200 doğrulandı. Next dev’in ürettiği AGENTS.md korundu; kurulu sürümün webpack/turbopack rehberleri okundu. Kullanılan yapılandırma: [Webpack cache](https://webpack.js.org/configuration/cache/) ve [Next webpack hook](https://nextjs.org/docs/app/api-reference/config/next-config-js/webpack).

HTTP testinin iki tekrar denemesi sırasıyla 90 saniyelik toplam bütçe ve 60 saniyelik health hazırlık sınırında durdu. Test hazırlığı/başlangıç süreleri ve son HTTP durum/hata gövdesi tanılamaya eklendi; bütün işlevsel assertler korunuyor. Toplam test bütçesi 240 saniye, başlangıç 60 saniye, tek health isteği 3 saniye ile sınırlı. Son koşum 9/9 geçti: hazırlık 41.353 saniye, ilk health 13.107 saniye. Önceki geç hazır olmanın kesin kök nedeni **doğrulanmadı**; yalnız bütçe artırılmasıyla uygulama sorununun kalıcı çözüldüğü iddia edilmez.

DUR
