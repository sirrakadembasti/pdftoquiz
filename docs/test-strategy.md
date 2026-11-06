# Test stratejisi

## Standart paket

`bun run test` depodaki özgün sentetik PDF/OCR fixture'larını, mock AI/kimlik/depolamayı ve React akışlarını kullanır. Bu katman çevrimdışıdır, kullanıcı belgesine bağlı değildir ve test atlamasına izin vermez. `scripts/check-test-policy.mjs`, regresyon dosyalarındaki `skip` kullanımını standart paket başlamadan reddeder.

Sentetik testler şu genel davranışları kapsar:

| Davranış | Kalıcı kanıt |
| --- | --- |
| Kapak, talimat, dört bölüm, soru/şık sayımı ve toplu cevap anahtarı | `phase1-sections.pdf`, `phase1-regression.mjs` |
| Dört sütunlu cevap anahtarı OCR'ı | Programla çizilen özgün görüntü, `answer-key-regression.mjs` |
| Sözcük birleştirme, 2×2 şıklar, şekil ve kırpma sınırları | `layout-quality.pdf`, `layout-quality-regression.mjs` |
| Yerel/AI kalite kapısı, hata ve kullanıcı onayı | Mock sağlayıcı, `hybrid-regression.mjs` |
| Renkli işaret temizleme ve öğrenci varlığı güvenliği | `answer-colors.pdf`, `scanned.pdf` |
| Soru sırası, kod satırları ve devam eden sorular | Sentetik satır geometrisi, `parse-split.pdf` |
| Boşluk, girinti, kaçış karakteri ve yinelenen şık uyarısı | Sentetik geometri, `text-options-regression.mjs` |
| Başlık/altbilgi dışlama ve gömülü şekil sınırları | Sentetik raster/XObject testleri |
| React öğretmen önizlemesi ve paylaşılan öğrenci bağlantısı | Bellek deposu ve sentetik tarama |

## Hangi kod sınanıyor?

- `test` komutu (`scripts/run-tests.mjs`) kökteki **`tests/`** regresyonlarını doğrudan kök `lib/` ve `app/` kaynaklarına karşı çalıştırır; ayrı bir ayna kopya yoktur (6 Kasım 2026'da `sites-source/` kaldırıldı ve testler köke birleştirildi).
- Testler derlenmiş modüllerini ve çıktılarını git dışı `.test-tmp/qa/` altına yazar (eski adı `.sites-runtime`).
- Kök `lib/db.ts`, `lib/storage.ts` ve `lib/local-auth.ts` birim testlerinde mock/derleme listesiyle yüklenir; gerçek SQLite, oturum ve yetki davranışı `test:server` (üretim derlemesi + gerçek HTTP, 9 test) ile sınanır; önce `build` gerekir.
- ESLint (`eslint app lib`) test paketine dahil değildir ve `package.json`'da betiği yoktur; 6 Kasım 2026 durumu: 183 hata (154'ü `no-explicit-any`), 33 uyarı.
- Gerçek referans PDF'ler `tests/reference/` altındadır. `node scripts/convert-reference.mjs` bunları gerçek dönüşüm hattından geçirir; `test:ocr` (`scripts/ocr/run.mjs`) varsayılan olarak `saglik2017programci.pdf` ve `grup-36---programci.pdf` ile OCR ölçümü yapar (`TAPU_REFERENCE_PDF` / `REAL_REFERENCE_PDF` ile değiştirilebilir).

## Gerçek belge kabul katmanı

Belirli eski belgelerin tam soru sayısı, metni ve koordinatlarına bağlı dokuz kontrol standart başarı sayısından ayrılmıştır. Bunlar genel regresyonların yerine geçmez; yalnız ek kabul kanıtıdır.

`bun run test:acceptance` aşağıdaki dört yolu ister ve eksikse açık hata ile durur:

- `MULTISECTION_REFERENCE_PDF`: çok bölümlü dijital kabul PDF'si
- `ANSWER_KEY_REFERENCE_IMAGE`: bu belgeyle eşleşen cevap anahtarı görüntüsü
- `STRUCTURED_REFERENCE_PDF`: kod, şekil ve iki sütun örnekleri içeren dijital kabul PDF'si
- `SCANNED_REFERENCE_PDF`: taranmış/OCR kabul PDF'si

Eski geliştirme ortamları için önceki değişken adları geriye uyumlu takma ad olarak kabul edilir; yeni belgelerde nötr adlar kullanılmalıdır.

Bu dosyalar yoksa standart geliştirme ve `bun run test` etkilenmez. Kabul testleri `RUN_REAL_ACCEPTANCE=1` değerini yalnız kabul çalıştırıcısı üzerinden alır; normal pakette kaydedilmez ve “atlandı” olarak başarı toplamına karışmaz.

## Fixture üretimi

PDF üreticileri yolları betik konumuna göre çözer. Yazı tipi Linux, Windows ve macOS adaylarından bulunur. Gerekirse `PDFTOQUIZ_FIXTURE_FONT` ve `PDFTOQUIZ_FIXTURE_FONT_BOLD` ile TTF yolları verilebilir. Üretilmiş fixture'lar depoda tutulur; normal test çalışması Python veya ReportLab gerektirmez.
