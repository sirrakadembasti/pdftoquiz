# PDF to Online Quiz

Öğretmenlerin PDF sınavlarını, soru ve şık görselleri korunarak paylaşılabilir web sınavlarına dönüştürdüğü Türkçe uygulama. > **Tarihsel not (6 Kasım 2026):** Bu belge Sites/Cloudflare dönemini anlatır. Güncel taşınabilir sürüm Next.js + yerel SQLite kullanır; R2 yerine SQLite `StoredObject` tablosu vardır. Güncel işleyiş için [README](../README.md) esastır.

Mevcut Vinext/React, Cloudflare Worker ve R2 yapısı o dönemde korunmuştu.

## Dönüştürme

- PDF.js metin parçaları konumlarıyla okunur; soru ve şık sınırları sütunlara göre ayrılır.
- Matematik sembolleri, geometrik şekiller, tablolar, grafikler ve resimli şıklar yeniden yazılmadan kaynak sayfadan ayrı görseller olarak alınır. OCR metni düzenleme ve erişilebilirlik için korunur.
- Taranmış sayfalarda Türkçe/İngilizce Tesseract OCR, kelime/satır koordinatları ve seyrek metin düzeni kullanılır.
- Üst/alt bilgiler, sayfa numaraları ve cevap anahtarı son şık metnine eklenmez. Beklenen soru sayısı, eksik numaralar ve düşük OCR güveni öğretmene gösterilir.
- İlk açıklama sayfaları sınav öncesi bilgilendirme alanına taşınır; öğretmen görsel veya düzenlenmiş metin gösterimini seçer.
- Öğretmen kaynak PDF'den soru gövdesine, tek bir şıkka veya bilgilendirmeye elle görsel alan seçebilir.
- PDF.js, OCR worker/core ve Türkçe/İngilizce dil modelleri kendi site varlıklarından yüklenir; dönüştürme CDN erişimine bağlı değildir.

Alan koordinatları, metin, şekil ve formül işlemesini ayıran yaklaşım için resmi MinerU/PDF-Extract-Kit belgeleri incelendi. Bu projelerin Python/GPU motorları Worker içine kurulmadı: mevcut tarayıcı tabanlı yapıda bölge görüntüleri korunur.

## Önizleme ve paylaşım

Önizleme eksik cevap anahtarıyla da açılır; sınav öncesi açıklama, soru/şık görselleri ve gezinme kontrol edilebilir. Paylaşım, eksik metin/görsel, cevap anahtarı veya kontrol onayı varsa ilgili soru numaralarını listeler. Yeni paylaşım ayrı sürüm ve bağlantı oluşturur.

Öğrenci ekranında PDF seçme/görüntüleme yoktur. Kaynak PDF adresi yalnız sınav sahibine açıktır. Cevap anahtarı başlangıçtaki öğrenci API yanıtına gönderilmez; sonuç sunucuda hesaplanır:

`Puan = doğru cevap sayısı / cevap anahtarı bulunan soru sayısı × 100` (güncel kod: `grade`, `lib/quiz.ts`; cevap anahtarı olmayan sorular puana katılmaz ve sonuç ekranında ayrıca belirtilir. Önceki sürümlerde payda toplam soru sayısıydı.)

Son ekranda doğru, yanlış, boş sayıları ve 100 üzerinden puan gösterilir; sonuç öğretmenin sınav kaydına eklenir. Yeni paylaşımlarda tüm doğru cevaplar zorunludur. Eski sürümlerde anahtarı eksik sorular ayrıca belirtilir.

Site erişim politikası korunur. Site özel ise öğrenci bağlantıları ayrıca Sites erişim izni gerektirir. Uygulama deneme/alıştırma amaçlıdır; öğrenci adını kendisi yazar ve süre tarayıcıda izlenir.

## İsteğe bağlı AI

OpenAI, OpenRouter ve Gemini OpenAI uyumlu uçları desteklenir. API anahtarı sekme belleğinde tutulur; sunucu isteğinde yalnız seçilen izinli sağlayıcıya iletilir ve saklanmaz. Sunucu aracılığı CORS sorununu kaldırır; farklı adreslere yönlendirme engellenir.

“Bağlantıyı ve görsel desteğini test et” seçilen modelle küçük bir görsel + JSON isteği yapar. Geçersiz anahtar, kota, desteklenmeyen model ve geçersiz yanıt ayrı bildirilir. AI soruları çözerek cevap anahtarı uydurmamalıdır; kaynakta açık anahtar yoksa öğretmen girer. AI koordinatları da kontrol edilmelidir.

Canlı sağlayıcı testi geçerli kullanıcı API anahtarı gerektirir. Otomatik testlerde sahte sağlayıcı yanıtları kullanılır; bu testler canlı API/model kalitesinin doğrulaması değildir.

## Doğrulama

```sh
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm test
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-d/scripts/build-site.mjs
```

Güncel paket 72 kontrolü kapsar (referans PDF/görsel dahil; 4 son-şık PDF kontrolü bağımsız betiktedir): dijital ve taranmış gerçek PDF dosyaları, iki sütun, formül/grafik/geometri/resimli şıklar, ayrı/yatay cevap anahtarı, son şık temizliği, puanlama, paylaşım ve öğrenci sonuç API akışı, yetki/PDF engeli, AI istek/hata senaryoları ve React düğme işlevleri. React test renderer bileşen olaylarını çalıştırır; gerçek tarayıcı görünümü/yerleşimi ve kullanıcı PDF'lerinin tamamı için uçtan uca garanti sağlamaz.

Test PDF'leri `tests/fixtures` altında bulunur. Yeniden üretim için `tests/create-fixtures.py` Python ReportLab/PyMuPDF ve DejaVu Sans yazı tipini kullanır.

## Sınırlar

20 MB/100 sayfa PDF, 300 soru, 600 farklı görsel. Karmaşık çapraz sayfa soruları, bozuk taramalar veya sıra dışı kitapçık düzenleri elle alan seçimi gerektirebilir. Eksik numaralar uyarılır; hayali soru oluşturulmaz. Öğretmen paylaşmadan önce kaynak alanlarını ve tüm doğru cevapları kontrol etmelidir.

## Kaynaklar

- https://github.com/mozilla/pdf.js
- https://github.com/naptha/tesseract.js
- https://github.com/tesseract-ocr/tessdata_fast
- https://github.com/opendatalab/MinerU
- https://github.com/opendatalab/PDF-Extract-Kit

## Arayüz düzeltmeleri — 7 Ekim 2026

Önizlemeden dönüş temizliği, sonuç gönderim hatasında süre/cevap koruması ve yeniden deneme, pano reddinde seçilebilir bağlantı, PDF olmayan durumlarda araçların pasifleştirilmesi ve küçük gezinme/alan seçimi düzeltmeleri eklendi. 20/20 test, TypeScript kontrolü ve üretim derlemesi geçti. Ayrıntılı kök neden ve doğrulama sınırları: [Arayüz test raporu](docs/arayuz-test-raporu.md). Gerçek tarayıcı konsol/ağ ve tüm elemanların tek tek uçtan uca testleri bu ortamda yapılmadı.

## Son şık metni ve sütun sırası — 7 Ekim 2026

Metin biriktirme artık şık görseliyle aynı alt sınırda durur. Soru başlangıçlarından hesaplanan sütun ayırıcısı PDF.js/OCR satır birleştirmesinde korunur. OCR belge genelindeki tekrar algılamasından önce çalışır; değişen sayfa numaraları ve marj noktalama işaretleri normalize edilir. Bağımsız talimat/başlık ve bilinen filigran metinleri filtrelenir; gerçek çok satırlı şık metni korunur.

`pnpm test` mevcut 20 testi ve dört yeni PDF ile son şık regresyonlarını çalıştırır. Önce/sonra örnekleri ve sınırlar: [Son şık hata raporu](docs/son-sik-hata-raporu.md). Kaydedilmiş eski sınavlar otomatik değiştirilmez; PDF yeniden içe alınarak yeni sürüm paylaşılır.

## PDF çözümleme özeti — 7 Ekim 2026

Noktalamasız `Soru 1`, parantezli `(A)` şıkları, 4/5 seçenek, ardışık sayfalara bölünmüş soru gövdesi ve şıklar yerel PDF/OCR yolunda desteklenir. Metin ve görüntüler birleştirilir; kaynak sayfaları kontrol için gösterilir. Eksik sorular silinmez; özet ve şüpheli soru listesinde düzenlemeye açılır. Cevap anahtarı çelişkisi sessizce ezilmez; elle seçim istenir. Bozuk/parola korumalı PDF ve sıfır soru için açık yönlendirme vardır.

`pnpm test`: 21 uygulama testi, 10 çözümleme testi ve önceki dört son-şık PDF kontrolü. Yeni altı PDF ve kapsam/sınırlar: [PDF çözümleme raporu](docs/pdf-cozumleme-raporu.md).

### Gerçek PDF / bölüm regresyonu (Faz 1)

`pnpm test` eski sınavlar, OCR/sayfa devamı ve özgün sentetik bölüm PDF'ini test eder. Gerçek referans telif/boyut nedeniyle repoda tutulmaz. Kendi kopyanızla ek kabul testini çalıştırın:

```powershell
$env:REFERENCE_PDF = "D:\dnm\5_sinifA_26_compressed.pdf"
pnpm test
```

Linux: `REFERENCE_PDF=/tam/yol/referans.pdf pnpm test`. Anahtar testi `ABCD` tekrarından oluşan yapay veriyi kullanır; gerçek cevap anahtarı değildir. API testleri bellek depolaması ve mock öğretmen kimliğiyle çalışır. React testleri gerçek tarayıcı kontrolünün yerini tutmaz.

Yeni `sections`, `sectionId`, `booklet`, `excludedBlocks`, `pageClassifications` alanları isteğe bağlıdır. Mevcut JSON/R2 sınav kayıtlarına migration gerekmez. Bölümsüz eski sınavlar tek grup olarak görüntülenir. Referansta Sosyal Bilgiler 17–20'nin ikinci grubu, dersini okumayanlar için alternatifler listesinde korunur; geri alma aynı numaradaki soruyu değiştirir. Toplu anahtar uygulandıktan sonra öğretmenin kontrol onayı gerekir.

### Dersli metin tablosu ve görsel cevap anahtarı

Toplu anahtar alanı ders sütunlu Markdown, Excel TSV, CSV ve sabit boşluklu tabloyu; ders başlıkları altındaki numaralı cevapları ve eski kısa anahtar biçimlerini destekler. Cevaplar ders adı + kaynak soru numarasıyla eşleşir. Kaynak kitapçık bilgisi okunursa A/B uyumu kontrol edilir. Görsel anahtar PNG/JPG/WebP olarak (en fazla 8 MB / 20 MP) yüklenir; yerel Türkçe/İngilizce OCR önce ders başlıklarını, sonra sütunları okur. AI anahtarı gerekmez.

Önizlemede mevcut/yeni cevaplar görünür; ders eşleştirmesi ve cevap harfi düzeltilebilir. Eksik/tekrarlı/belirsiz eşleşmeler uygulanmaz. Görselde kaynak kontrol onayı da gereklidir. Yalnızca “Önizlenen anahtarı uygula” soruları değiştirir; soruların öğretmen kontrol onayı sıfırlanır. Güncel soru/bölüm/şık verisi değişirse eski önizleme uygulanamaz.

Gerçek ekran görüntüsünü repoya eklemeden test etmek için PowerShell: `$env:REFERENCE_KEY_IMAGE="D:\dnm\cevap-anahtari.png"; pnpm test`. Linux: `REFERENCE_KEY_IMAGE=/tam/yol/cevap-anahtari.png pnpm test`. Kullanıcının metin tablosu `tests/fixtures/answer-key-table.txt`, ilgili testler `tests/answer-key-regression.mjs` içindedir. Gerçek görüntü testi isteğe bağlıdır; özgün sentetik görüntüde gerçek OCR normal test akışında çalışır.

### Metin yapısı ve şık kırpmaları
Dijital PDF dönüşümü madde/paragraf sınırlarını, konuma bağlı satır sonu hece birleştirmesini ve güvenilir font/yatay çizgi ipuçlarından kalın/altı çizili vurguyu korur. Biçim bilgisi isteğe bağlı JSON alanlarıdır; eski sınavlar aynı şekilde açılır. Metin elle değiştirildiğinde eski vurgu aralıkları temizlenir. OCR/AI'den güvenilir biçim bilgisi gelmezse düz metin kullanılır.
Şıklar satır yüksekliği ve komşu hücre sınırlarıyla kırpılır. Metin dışındaki koyu/kuvvetli renkli içeriğin varlığı, şık hücresinin şekli kapsayacak kadar geniş tutulmasını sağlar. Açık renkli filigran yalnız sınır bulmada göz ardı edilebilir; kaynak pikseller silinmez. Çok açık, çerçevesiz şekillerde öğretmen kaynakla karşılaştırmalıdır.
Elle PDF alan seçimi artık önizleme ve yüzde sınır ayarı sonrasında “Seçimi uygula” ile kaydedilir. Yeni dönüşüm kuralları mevcut kayıtları otomatik değiştirmez; eski hatalı dönüşüm için PDF yeniden içe aktarılmalıdır.
`REFERENCE_PDF=/absolute/path.pdf node --test tests/layout-quality-regression.mjs` gerçek referans kontrolünü ekler. Repodaki `layout-quality.pdf` özgün küçük sentetik regresyon belgesidir.

## Faz 2 — Hibrit dönüşüm

Ana ekranda Yerel dönüştürme ve AI ile dönüştür korunur; Hibrit (önerilen), sekme belleğinde geçerli sağlayıcı/model/anahtar ayarı varsa açılır. Hibrit her zaman önce mevcut PDF.js metin/konum, gerektiğinde yerel Tesseract OCR, sınıflandırma ve kırpma geçişini yapar.

Kalite kapısı yalnız sorunlu blokları seçer: 4/5 dışındaki şık sayısı veya boş şık, OCR güveni <0.65, sınır/uzak metin uyarıları, formül/şekil ipuçları, boş soru metni. Bölümde beklenen sayı tutmazsa eksik numaranın komşu sayfaları seçilir; aynı sayfadaki bloklar tam sayfa hedefinde birleştirilir. Bilerek ayrılan alternatif ders sayfaları yeniden soru sayılmaz. Puan = 100 × (1 − işaretlenen mevcut soru / toplam soru); bir kalite göstergesidir, doğruluk garantisi değildir. PDF.js güveni/OCR eşiği heuristiktir; sağlayıcının güven puanı bağımsız doğrulama değildir.

Gönderimden önce sayfa/blok listesi, gerekçe, sağlayıcı/model ve tahmini N çağrı (yeniden denemelerle en fazla 3N) onayı gösterilir. Vazgeçme yerel taslağı korur; sorunsuz bloklar gönderilmez. Eksik soru nedeniyle tam sayfa seçilmişse o sayfanın görüntüsü ve aynı bölümdeki yerel metin gönderilir. Her stratejide kalite kapısı ve onay uygulanır:

- Otomatik: dijital metin farkı öneridir; düşük güvenli OCR onarımı otomatik uygulanabilir.
- Yerel-önce: tüm onarımlar öğretmenin kabulünü bekler.
- AI-önce: yalnız işaretli taranmış alanlarda AI metni önceliklidir; dijital metindeki fark yine öğretmen onayı ister.

Bölüm/soru/şık/görsel metadata alanları kaynak, güven, uyarı kodu, sayfa ve mevcutsa normalize koordinat taşır. Koordinat bulunamazsa uydurulmaz. Manuel alan değişiklikleri kilitlenir; metin, şık, görsel, doğru cevap ve numara/bölüm yeniden incelemede korunur. Toplu cevap anahtarı da doğru cevabı manuel kilitler. AI önerisi kabul/reddet/geri al işlemleri vardır; sonradan manuel değişen alan geri alınırken de korunur. AI yeni soru veya soru olmayan blok önerisi otomatik uygulanmaz. Formül mümkünse LaTeX olarak ayrıca gösterilir; doğru cevap tahmin edilmez.

En fazla iki eşzamanlı çağrı, hedef başına üç deneme, 400/1200 ms geri çekilme ve Retry-After (en fazla 5 sn) kullanılır. 429, 408/zaman aşımı ve 5xx yeniden denenir; 401 ve bozuk JSON tekrar edilmez. Hata yalnız ilgili parçayı yerelde bırakır; kodlu uyarı eklenir. İptal yeni işleri durdurur, devam eden AI isteğini keser ve yerel taslak/tamamlanmış sonuçları korur. İptal edilen isteğin sağlayıcıda ücretlenip ücretlenmediği garanti edilemez.

`provenance`, `hybrid`, `formula`, `hasFigure`, `manualDeletes` isteğe bağlı JSON alanlarıdır; R2 kayıtlarına migration gerekmez ve metadata içermeyen eski sınavlar açılabilir. Öğrenci API yanıtı öneri geçmişi, manuel kilitler veya doğru cevapları içermez. API anahtarı draft/JSON/R2/localStorage içine eklenmez; sekme belleği kuralı değişmedi.

`tests/hybrid-regression.mjs` mock sağlayıcıyla başarı, 401/429/zaman aşımı/bozuk JSON, eşzamanlılık/iptal, AI–yerel fark, kilit, onay ekranı ve eski kayıt uyumunu sınar. Gerçek referans PDF testi `REFERENCE_PDF` ile açılır. React mock testi gerçek tarayıcı değildir.

### Canlı sağlayıcı ve tarayıcı kontrol listesi

1. Siteyi masaüstü ve dar mobil pencerede açın. Anahtarsız Hibrit pasif olmalı; Yerel dönüştürme dosya alabilmeli.
2. AI ayarlarında Gemini seçin, görsel/JSON destekleyen modelinizi ve geçerli anahtarınızı girin. “Bağlantıyı ve görsel desteğini test et” sonucunu kontrol edin. Anahtar ekran görüntüsüne/rapora dahil edilmemeli.
3. Hibrit/Otomatik seçip referans PDF'yi yükleyin. Yerel geçiş sonrası gönderim listesi ve tahmini çağrı sayısını inceleyin. Önce vazgeçin: 80 soru yerel taslakta kalmalı ve AI çağrısı yapılmamalı.
4. Yeniden inceleyin, listeyi onaylayın. Ağ panelinde yalnız listelenen kırpmaların gönderildiğini kontrol edin. Dijital metin farkını öneride görün; kabul, reddet ve geri al işlemlerini kaynak PDF ile karşılaştırın.
5. AI yanıtı beklerken bir soru metnini/şıkkı elle değiştirin. Manuel/kilitli rozeti görünmeli; yanıt, uygulama ve geri alma bu alanı ezmemeli. Toplu anahtarla belirlenen doğru cevap değişmemeli.
6. Düşük kaliteli küçük bir taramada Otomatik, Yerel-önce ve AI-önce farkını kontrol edin; OCR ile AI metnini kaynak görüntüyle karşılaştırın. Yeni soru adayının soru/şık kırpmalarını ve LaTeX alanını kontrol edin.
7. Yanlış anahtarla 401 kontrol edin: ilgili parça yerelde kalmalı. 429, gecikme ve bozuk JSON senaryoları kontrollü mock sağlayıcı testlerinde doğrulanır; canlı kota aşımı oluşturmayın. İşlem sırasında iptal edin; yerel taslak kalmalı.
8. Masaüstü/mobilde kaynak rozetleri, öneri karşılaştırması, uzun metin, şık görselleri ve onay modalının taşmadan görünümünü kontrol edin.
9. Anahtarları tamamlayıp soruları kontrol edilmiş işaretleyin; paylaşın ve izinli öğrenci hesabıyla açın. Doğru/yanlış/boş ve 100 üzerinden puanı önceki davranışla karşılaştırın. Eski kayıtlı sınavı açıp aynı akışı kontrol edin.
10. Sayfayı yenileyin: AI anahtarı yeniden girilmeli, kaydedilmiş taslakta manuel kilitler korunmalı. JSON dışa aktarımında anahtar bulunmamalı.
