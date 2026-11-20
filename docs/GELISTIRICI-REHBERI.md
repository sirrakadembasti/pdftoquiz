# Geliştirici rehberi — test, PDF/OCR, düzenleyici ve kurulum notları

Bu belge pdftoquiz uygulamasını geliştirenler içindir: test komutları, PDF dönüşüm ve OCR ilkeleri, düzenleyici davranışları, AI açıklamaları, bağımlılık kurulumu ve bilinen sınırlar. LLM Manager paneli ayrı belgededir: [LLM-MANAGER.md](LLM-MANAGER.md). Kurulum, sunucu ve yedek için [KURULUM-ISLETIM.md](KURULUM-ISLETIM.md); kısa başlangıç için [README](../README.md); bağımlılık lisansları için [lisanslar/DEPENDENCIES.md](lisanslar/DEPENDENCIES.md). Eski faz raporları ve tarihli test kayıtları kaldırılmıştır; geçmişleri Git'te durur (`git log -- docs/`).

## 1. Test düzeni

| Komut | Ne yapar |
|---|---|
| `test` (`scripts/run-tests.mjs`) | Önce `skip` kullanımını, gerçek veritabanı yalıtımını ve lisans envanterinin güncelliğini denetler, sonra `tests/*-regression.mjs` dosyalarını doğrudan kök `lib/` ve `app/` kaynaklarına karşı çalıştırır. Çevrimdışıdır, mock AI/kimlik/depolama kullanır, atlanan test kabul etmez. Derlenmiş modüller git dışı `.test-tmp/` altına yazılır. |
| `test:server` | Üretim derlemesi + gerçek HTTP + gerçek SQLite (giriş, oturum, yetki, paket taşıma). Önce `build` gerekir. Veritabanı sistem geçici klasöründe oluşturulup silinir. |
| `test:acceptance` | Belirli bir belgeye bağlı dokuz kabul kontrolü. `MULTISECTION_REFERENCE_PDF`, `ANSWER_KEY_REFERENCE_IMAGE`, `STRUCTURED_REFERENCE_PDF`, `SCANNED_REFERENCE_PDF` yollarını ister, eksikse açık hatayla durur; standart sonuca karışmaz. Bu testler eski belgelerin içeriğine göre yazıldığından tüm referans PDF'lerle geçmez. |
| `test:ocr` (`scripts/ocr/run.mjs`) | OCR ölçümü; varsayılan `saglik2017programci.pdf` ve `grup-36---programci.pdf`. |
| `reference` (`scripts/convert-reference.mjs`) | `tests/reference/` altındaki PDF'leri gerçek yerel dönüşüm hattından (PDF.js + Tesseract, AI yok) geçirip özet JSON yazar (`.test-tmp/reference`). |

### Referans PDF'ler ve tanılama araçları

`tests/reference/` altındaki üç gerçek sınav PDF'i (`grup-36---programci.pdf` taranmış; `saglik2017programci.pdf` ve `hacettepe_programci_2014.pdf` dijital) standart pakete dahil değildir; gerçek dönüşüm hattını sınamak içindir:

```sh
node scripts/convert-reference.mjs                  # üç PDF; özet + JSON .test-tmp/reference altına
node scripts/convert-reference.mjs baska-sinav.pdf  # istenen PDF
pnpm test:ocr              # OCR ölçümü
node scripts/replay-diagnostics.mjs paket.json sonuc.json          # öğretmen düzenleyicisinden indirilen tanılama paketini OCR'sız yeniden çözümler (sınav metni içerir)
node scripts/measure-resilience.mjs 30 .audit/resilience-30.json   # sentetik bellek ölçümü
node scripts/measure-leakage.mjs kaynak.pdf ogretmen-taslagi.json sonuc.json   # yerel sızıntı ölçümü
```

**Veritabanı yalıtımı:** `lib/db.ts` varsayılan olarak gerçek `data/quiz.db` dosyasını açar. `test` tüm paketlere `DATABASE_URL=file:.test-tmp/run-tests/quiz.db` verir; `lib/db.ts` modülünü yükleyen her regresyon dosyası ayrıca kendi geçici veritabanını `process.env.DATABASE_URL` ile ayarlamak zorundadır, ayarlamayan dosya `test:policy` tarafından reddedilir. Bu kural, testlerin gerçek veritabanına satır yazdığı bir hatadan sonra eklendi.

Fixture PDF'leri `tests/fixtures/` altındadır; üretici betikler kaldırılmıştır. ESLint kullanılmaz; statik denetimi `tsc` yapar.

**Son doğrulama (19 Kasım 2026, uzak PR #1–#4 ile birleştirme sonrası, Windows, Node 24):** regresyon dosyaları doğrudan koşuldu 291/291 (Aşama 1–2, 3 ve 4'ün 18, 20, 21. maddeleri sonrası) (0 atlanan), `tsc` çıkış 0, test politikası temiz; `test:server` 9/9 (`.env` ile ilk hesap oluşturma eklendikten sonra, 16 Kasım). Bu bilgisayarda `node_modules` Next 16.4.0 içerdiğinden `pnpm test` lisans kontrolünde durur (bölüm 6); gerçek `install` sonrası kalkar.

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
- **Kapak tablosundan bölümler:** "DERS ADI / SAYFA" tablosu + "Her ders için N soru" (`tableSections`) ve başlıksız, sürekli numaralı sınavlarda numara aralığından bölümleme (`assignSectionRanges`, `Section.firstNumber`). Testler `tests/number-sequence-regression.mjs` içindedir.
- **Taranmış cevap anahtarı sayfası:** PSM 11 tek harfleri düşürdüğünden, "cevap anahtarı" sınıflı OCR sayfasında tam sayfadan <6 cevap çıkarsa numara sütunları (`keyNumberColumns`) harf beyaz listeli PSM 6 ile ayrıca okunur (`recoverAnswerKeyColumns`); yalnız "N. X" satırları kabul edilir, çelişen numara çıkarılır, harf düzeltmesi yapılmaz. Testler `tests/number-sequence-regression.mjs` içindedir.
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

## 6. Bağımlılık kurulumu ve bu bilgisayardaki kısıtlar

Normal kurulum, ağı engelsiz bir makinede proje klasöründe:

```sh
pnpm install --frozen-lockfile
```

Kurulum `pnpm-lock.yaml` ile birebir paketleri getirir (Next 16.4.6 ve `@sirrakadembasti/llm-manager` dahil). `node_modules` eski kalırsa `test` ilk adımda `docs/lisanslar` ile kurulu sürümleri karşılaştırır ve güncel değil diye durur; `dev`/`build` ise paket eksikse `Can't resolve '@sirrakadembasti/llm-manager/core'` hatası verir ([LLM-MANAGER.md](LLM-MANAGER.md)).

**Bu bilgisayardaki kısıtlar (16 Kasım 2026 gözlemi):**

- Node'un `dns.lookup` çağrısı (getaddrinfo) `ENOTFOUND` verir, `dns.resolve4/6` çalışır. `D:\dnm\localhost-fix.cjs` yalnız `localhost` için geçerlidir, kayıt defteri adlarını kapsamaz. PowerShell'in kendi istekleri etkilenmez.
- Bu bilgisayarda PATH'te `pnpm` yoktur (yalnız `node` ve `bun`). pnpm, `D:\dnm\use-node.ps1` ile oturuma eklenir; o betik pnpm 9.15.1 getirir, depo ise 11.25.0 ister (kilit dosyası ikisiyle de çözülür, ama `pnpm-workspace.yaml` içindeki bazı ayarlar yalnız pnpm 10/11'de geçerlidir).
- Kayıt defteri ve GitHub bazı paket tarball'ları için 403 döndürdü (`lucide-react`, llm-manager). Bu bir ağ politikasıdır; kurulum ağı serbest bir makinede yapılmalıdır.
- Geçici çözüm: `D:\dnm\llm-manager-main` yerel kopyasından `node_modules/@sirrakadembasti/llm-manager` ve `node_modules/undici` elle oluşturuldu (yalnız `node_modules`, git dışı). Bu kopya kilitli commit'ten (`ce91904`) farklıdır (`45d9ed9`); yalnız geliştirme içindir, gerçek `install` ile değiştirilmelidir. Bu durumda `build` ve `licenses` betiği `docs/lisanslar/DEPENDENCIES.md` içine Next 16.4.0 yazar; bunu commit etmeyin (`git checkout -- docs/lisanslar/DEPENDENCIES.md`).
- `next dev` çalışırken `next-env.d.ts` dosyasını yeniden yazar (`.next/dev/...` yolları); bu değişikliği commit etmeyin.

## 7. Doğrulanamayanlar ve bilinen borçlar

- Sıfırdan bağımlılık kurulumu bu geliştirme bilgisayarında tamamlanamadı (bölüm 6: DNS ve 403 kısıtları); kilit dosyası tutarlılığı doğrulandı, gerçek kurulum ağı serbest bir makinede denenmelidir.
- Gerçek tarayıcıda PDF yükleme arayüzü, native metin araçları (geri al, araç çubuğu), dokunmatik/mobil yerleşim, çift tıklamalı `.cmd` başlatıcılar, harici sunucu (ters vekil) dağıtımı ve canlı AI sağlayıcı çağrıları bu ortamda doğrulanmadı. Yalnız tarayıcıda yerel OCR çalışması ayrıca denendi.
- `app/page.tsx` (~107 KB) ve `app/globals.css` (~47 KB) tek dosyada; bileşenlere bölünmesi ayrı bir iş.
- Öğrenci sonuç gönderimi (POST) kimliksizdir; tek kullanımlık deneme belirteci ve IP başına hız sınırı ister (bkz. AGENTS.md §6, §13).
