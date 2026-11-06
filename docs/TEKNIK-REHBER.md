# Teknik rehber

Bu belge uygulamanın geçerli davranışını, test düzenini ve bilinen sınırlarını özetler. Kurulum ve kullanım için [README](../README.md), bağımlılık lisansları için [lisanslar/DEPENDENCIES.md](lisanslar/DEPENDENCIES.md). Eski faz raporları ve tarihli test kayıtları kaldırılmıştır; geçmişleri Git'te durur (`git log -- docs/`).

## 1. Test düzeni

| Komut | Ne yapar |
|---|---|
| `test` (`scripts/run-tests.mjs`) | Önce `skip` kullanımını ve lisans envanterinin güncelliğini denetler, sonra `tests/*-regression.mjs` dosyalarını doğrudan kök `lib/` ve `app/` kaynaklarına karşı çalıştırır. Çevrimdışıdır, mock AI/kimlik/depolama kullanır, atlanan test kabul etmez. Derlenmiş modüller git dışı `.test-tmp/` altına yazılır. |
| `test:server` | Üretim derlemesi + gerçek HTTP + gerçek SQLite (giriş, oturum, yetki, paket taşıma). Önce `build` gerekir. |
| `test:acceptance` | Belirli bir belgeye bağlı dokuz kabul kontrolü. `MULTISECTION_REFERENCE_PDF`, `ANSWER_KEY_REFERENCE_IMAGE`, `STRUCTURED_REFERENCE_PDF`, `SCANNED_REFERENCE_PDF` yollarını ister, eksikse açık hatayla durur; standart sonuca karışmaz. Bu testler eski belgelerin içeriğine göre yazıldığından tüm referans PDF'lerle geçmez. |
| `test:ocr` (`scripts/ocr/run.mjs`) | OCR ölçümü; varsayılan `saglik2017programci.pdf` ve `grup-36---programci.pdf`. |
| `reference` (`scripts/convert-reference.mjs`) | `tests/reference/` altındaki PDF'leri gerçek yerel dönüşüm hattından (PDF.js + Tesseract, AI yok) geçirip özet JSON yazar (`.test-tmp/reference`). |

Fixture PDF'leri `tests/fixtures/` altındadır; üretici betikler kaldırılmıştır. ESLint kullanılmaz; statik denetimi `tsc` yapar.

**Son doğrulama (6 Kasım 2026, Windows, Node 24):** standart paket 232/232 (0 atlanan), `tsc` çıkış 0, üretim derlemesi başarılı, `test:server` 9/9.

**Referans PDF sonuçları** (yerel hat, AI yok):

| PDF | Tür | Sonuç |
|---|---|---|
| `saglik2017programci` | dijital, 9 sayfa | 50/50 soru, 4 şık; PDF'deki 50 cevap tespit edildi; uyarı yok |
| `hacettepe_programci_2014` | dijital, 16 sayfa | 50/50 soru, 5 şık; anahtar yok; 3 soruda kırpma sınırı uyarısı |
| `grup-36---programci` | taranmış, 12 sayfa | 50/50 soru, 5 şık; 47 soruda öğretmen kontrol uyarısı, 6 boş şık, 44/50 soruda tüm şık görselleri |

Taranmış belgelerde yoğun öğretmen kontrolü beklenir; bu uygulamanın belgelenmiş sınırıdır.

## 2. PDF dönüşümü ve OCR ilkeleri

- Hat belirli bir dosyaya, soru numarasına veya cümleye bağlı değildir; numaralandırılmış, çoğunlukla A–E (2–5 şık) Türkçe/İngilizce sınavlar içindir. Tek/çift sütun, çok satırlı ve şekilli şık, kod kutusu ve sayfa devamı desteklenir.
- OCR ayarları: `tur+eng`, OEM 1 (LSTM), PSM 11, 144 DPI. Yalnız LSTM çekirdekleri paketlenir.
- Yerel OCR sonucu kesin sayılmaz; belirsiz alanlar öğretmen önerisi ve kalite kapısı olarak kalır. Otomatik metin düzeltmesi yapılmaz.
- **Eksik şık kurtarma:** eksik bir A–E işareti için komşu güvenilir işaretlerin düşey sırası, içerik sütunu, satır başlangıcı ve OCR sembol kutuları kullanılır; aynı fiziksel satırın parçaları soldan sağa birleştirilir. Sonuç otomatik uygulanmaz; öğretmen "Bu metni Şık X olarak kullan" ile onaylar. Belirsiz ya da beklenen bölgeden uzak metin için öneri üretilmez.
- PDF'deki cevap anahtarı algılansa bile otomatik uygulanmaz. Öğrenci verisine cevap anahtarı, öğretmen kaynak görseli veya birleşik soru+şık görseli gönderilmez.
- Yeni bir yerleşim stratejisi eklenirken içerik/dosya adı sabitlenmez; yeni geometri sinyali, belirsizlik kapısı ve bağımsız sentetik regresyon birlikte eklenir.
- Desteklenmeyenler: farklı alfabe, serbest el yazısı, şık işareti olmayan tablo düzeni, alışılmadık cevap yerleşimi. "Her taranmış belgeyi hatasız okuma" garantisi yoktur.

## 3. Düzenleyici davranışları

- Soru ve şıklar için "Soru görselini göster" ve "Cevap şıklarını görsel olarak göster" onay kutuları vardır; varsayılan metin gösterimidir, açıkça kaydedilmiş tercih korunur.
- Soru metni ve dönüştürülmüş metin görünümü tek editördür (kalın, altı çizili, liste, geri al/yinele, biçimi temizle). Yapıştırma düz metindir; JSON yalnız metin ve kalın/altı çizili aralıklarını saklar. Öğretmen değişikliği AI'ya karşı manuel kilitlidir.
- Soru ve her A–E şık görseli için PDF'den seçim düğmeleri vardır; onaylanan kırpma yalnız adlandırılan alana eklenir ve görüntü onay kutusunu otomatik açmaz. Geometrisi bilinmeyen bir şık güvenli sayılmaz, yayın engeli korunur.
- Toplu cevap anahtarı tablosu soru sayısı kadar satır gösterir: PDF'den tespit edilen ve uygulanan/manuel cevap ayrı sütunlardadır. Bölüm numarası tekrarı, anahtar çakışması, kitapçık uyuşmazlığı ve geçersiz şık uyarılır; soru olmadan cevap uygulanmaz.
- "Cevapları aktar" yalnız güvenli eşleşen cevapları topluca uygular; üzerine yazılacak manuel cevap varsa sayısını gösterip onay ister. Reddedilirse sınav değişmez; aktarım sonrası kaynak manuel kilitlenir ve özet yeniden hesaplanır.

## 4. AI inceleme açıklamaları

- Kalite hedefleri ham kod yerine Türkçe neden, soru numarası, sayfa ve bölüm adıyla gösterilir; eksik şıklar A–E harfleriyle belirtilir.
- AI sonucu şu durumlardan biri olarak açıklanır: uygulandı, onay bekliyor, yerel sonuç korundu, kullanıcı işlemi gerekiyor, atlandı, teknik olarak tamamlanamadı. Geçersiz yanıt ve sağlayıcı hataları yerel içeriğin değişmediğini belirtir.
- Kırmızı piksel temizleme yalnız sağlayıcıya giden geçici kopyayı değiştirir; yerel taslak korunur.
- AI önerisi uygulanınca kalite planı, çözümleme özeti ve şüpheli soru listesi anında yeniden hesaplanır.
- AI anahtarı yalnız sekme belleğindedir; diske, `.env`'e veya veritabanına yazılmaz.

## 5. Tarayıcı notu: body hydration

Tarayıcı eklentilerinin `<body>`'ye eklediği nitelikler (ör. `cz-shortcut-listen`) sunucu/istemci farkı uyarısı üretebilir. `app/layout.tsx` yalnız `<body suppressHydrationWarning>` kullanır; bu body seviyesindeki dış nitelik uyarısını bastırır, nitelikleri silmez, alt bileşen uyuşmazlıklarını bastırmaz. `tests/hydration-regression.mjs` bunu sınar.

## 6. Doğrulanamayanlar ve bilinen borçlar

- Sıfırdan bağımlılık kurulumu bu geliştirme bilgisayarında (ağ yok) tamamlanamadı; kilit dosyası tutarlılığı doğrulandı, gerçek kurulum ağı olan makinede denenmelidir.
- Gerçek tarayıcıda PDF yükleme arayüzü, native metin araçları (geri al, araç çubuğu), dokunmatik/mobil yerleşim, çift tıklamalı `.cmd` başlatıcılar, harici VPS/Nginx dağıtımı ve canlı AI sağlayıcı çağrıları bu ortamda doğrulanmadı. Yalnız tarayıcıda yerel OCR çalışması ayrıca denendi.
- `app/page.tsx` (~107 KB) ve `app/globals.css` (~47 KB) tek dosyada; bileşenlere bölünmesi ayrı bir iş.
- Öğrenci sonuç gönderimi (POST) kimlik doğrulamasız ve hız sınırsızdır.
