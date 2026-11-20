# Yapay zekâ kod ajanları için proje rehberi (AGENTS.md)

Bu belge, pdftoquiz üzerinde geliştirme yapacak yapay zekâ kod ajanları (ve yeni geliştiriciler) için yazıldı: uygulamanın ne yaptığı, nerede ne olduğu, hangi kuralların bozulmaması gerektiği, nasıl test edildiği ve bilinen tuzaklar. Son güncelleme: 19 Kasım 2026, commit `1bca069` sonrası. Her bilgi kodu okuyarak ya da komut çalıştırarak doğrulandı; doğrulanmayanlar açıkça "doğrulanmadı" diye işaretlidir.

Diğer belgeler: kısa başlangıç [README](README.md) · kurulum/sunucu/hesap/yedek [docs/KURULUM-ISLETIM.md](docs/KURULUM-ISLETIM.md) · test ve PDF/OCR ayrıntısı [docs/GELISTIRICI-REHBERI.md](docs/GELISTIRICI-REHBERI.md) · `/llm` paneli [docs/LLM-MANAGER.md](docs/LLM-MANAGER.md).

## 1. Uygulama ne yapar?

Öğretmen bir PDF sınavı yükler; uygulama **tarayıcıda** PDF.js ile metni/konumları okur (taranmış sayfalarda Tesseract OCR, `tur+eng`), soruları ve A–E şıklarını ayırır, soru/şık görsellerini kırpar. Öğretmen düzenler, cevap anahtarını işler, isteğe bağlı AI ile kalite kontrolü yapar ve sınavı yayınlar. Öğrenci paylaşım bağlantısıyla (`/?exam=<uuid>`) sınavı çözer; puanlama **sunucuda** yapılır.

İki rol: **öğretmen** (hesap ve oturum gerekir) ve **öğrenci** (hesapsız, yalnız bağlantı). Tek kullanıcılı, yerel SQLite'lı, harici hizmet gerektirmeyen bir uygulamadır; çok kullanıcılı portal değildir (kayıt sayfası yoktur).

## 2. Hızlı komutlar

| Komut (`pnpm …`) | Ne yapar |
|---|---|
| `dev` | `next dev --hostname 127.0.0.1 --port 3000` (Turbopack). Bir klasörde aynı anda **tek** dev sunucusu çalışır. |
| `build` | `scripts/build.mjs`: önce lisans envanterini üretir, `next build --webpack`, sonra standalone çıktıyı tamamlar. |
| `start` | `scripts/serve.mjs`: `.next/standalone/server.js`'i `127.0.0.1:3000`'de başlatır (önce `build`). |
| `typecheck` | `tsc --noEmit --incremental false`. ESLint **yoktur**; statik denetim yalnız `tsc`. |
| `test` | Politika + lisans denetimi + 33 regresyon dosyası (aşağıda §10). |
| `test:server` | Gerçek üretim sunucusu + SQLite (önce `build`). |
| `user:add` / `user:reset` | Öğretmen ekle (etkileşimli, rastgele şifre) / şifre sıfırla. |
| `backup` | SQLite anlık yedeği. |
| `reference` / `test:ocr` | Gerçek referans PDF'lerle dönüşüm simülasyonu / OCR ölçümü. |

Paket yöneticisi pnpm 11.25.0 (`package.json` → `packageManager`). Bu geliştirme bilgisayarına özgü kurulum sorunları için §12'ye bakın.

## 3. Mimari bir bakışta

```
Tarayıcı (ağır iş burada)                          Sunucu (ince)
┌─────────────────────────────────────┐        ┌──────────────────────────────┐
│ app/page.tsx  (tek sayfa, 8 görünüm)│  fetch │ Next.js API rotaları         │
│  PDF.js + Tesseract.js (WASM, local)│ ─────► │  /api/exams  /api/auth  /ai  │
│  lib/pdf-import, pdf-layout, hybrid │        │ lib/server, local-auth       │
│  IndexedDB (taslak), localStorage   │        │ SQLite (libSQL) tek dosya    │
└─────────────────────────────────────┘        │  data/quiz.db                │
         ▲ AI anahtarı yalnız sekme belleğinde └──────────────────────────────┘
```

- **Çerçeve:** Next.js 16.4 App Router, React 19, Tailwind 4, TypeScript 5.9. `output: 'standalone'`. Kurulu Next sürümü yerelde 16.4.0, `package.json` 16.4.6 ister (bkz. §12). **Next 16 önceki sürümlerden farklı olabilir**; API'ye dokunmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberi okuyun.
- **Veritabanı:** ORM yok. `lib/db.ts`, `@libsql/client`'ı sarmalayan küçük bir `db` nesnesi (`db.user`, `db.session`, `db.loginLimit`, `db.storedObject`…) ve şema tek kaynak olarak dosyanın içinde; ilk sorguda `ensureDatabase()` tabloları oluşturur (ayrı migrasyon adımı gerekmez).
- **Depolama:** `lib/storage.ts` bir "kova" (bucket) taklidi yapar; her şey `StoredObject` tablosunda anahtar/değer olarak durur (§5).
- **Sunucu tarafı küçük tutuldu:** PDF işleme, OCR ve düzenleme istemcide; sunucu yalnızca kayıt, yetki, puanlama, görsel/PDF dağıtımı ve AI isteği aktarımı yapar.

## 4. Dizin haritası

| Yol | Rol |
|---|---|
| `app/page.tsx` (~107 KB) | **Tüm arayüz** tek dosyada: `Home`, `PDFView`, `ExamCard`, `HybridReview`, `BulkAnswers`, `SectionNavigation`, `Modal`, `AIUsageCard`, `SourceBadge`, `OptionImagePreview`. Görünümler: `home, processing, editor, intro, quiz, result, loading, unavailable`. |
| `app/student-flow.tsx` | Öğrenci akışı görünümleri (`StudentIntro`, `StudentQuiz`, `StudentResult`) ve `SectionNavigation`; durum `Home`'da kalır, props ile gelir. Testlerdeki derleme listelerinde `app/page.tsx`'ten önce yer alır. |
| `app/account/page.tsx` | Hesap sayfası: giriş; oturum açıkken şifre değiştirme, etkin oturum sayısı, "diğer oturumları kapat" ve "tüm oturumlardan çık" (kayıt sayfası yok). |
| `app/api/**` | `exams` (GET liste, POST kaydet), `exams/[id]` (GET sınav/sonuç/pdf/görsel/düzenle, POST sonuç gönder), `auth/{login,logout,me}`, `ai`, `health`, `llm/[...slug]`. |
| `app/llm/[[...slug]]/route.js`, `app/actions/llm.js`, `llm.js`, `.llm-manager.json`, `instrumentation.ts` | LLM Manager bağlantısı ve açılışta ilk hesap oluşturma (§9). |
| `lib/quiz.ts` | **Çekirdek alan modeli**: `Question`, `Exam`, `Section` tipleri; `parsePages`, `validateExam`, `examIssues` (yayın kapısı), `grade`, `studentExam` (öğrenci görünümü), görsel koruma. |
| `lib/pdf-import.ts` | Dönüşüm orkestrasyonu (`convertPDF`) ve tuval/görsel yardımcıları (kırpma, kırmızı mürekkep, OCR boşluk kurtarma). |
| `lib/pdf-layout.ts` | Satır/sütun/okuma sırası, şık dizisi onarımı, numara boşluğu, sayfa sınıflandırma. Saf mantık, test edilmesi en kolay modül. |
| `lib/hybrid.ts`, `lib/ai.ts`, `lib/provider-fetch.ts` | Kalite kapısı + AI önerileri; AI isteği ve kullanım sayacı; Gemini için DNS yedeği. |
| `lib/answer-key.ts`, `lib/answer-key-ocr.ts` | Cevap anahtarı ayrıştırma/uygulama; görsel anahtarın OCR'ı. |
| `lib/db.ts`, `lib/storage.ts`, `lib/local-auth.ts`, `lib/session.ts`, `lib/server.ts`, `lib/assets.ts`, `lib/initial-account.ts` | Sunucu tarafı: veri, kova, parola/oturum, `currentUser()`, yetki (`owner()`, `sameOrigin()`), görsel kaydı, ilk hesap. |
| `lib/student-question.tsx`, `question-text-editor.tsx`, `manual-option-tools.tsx`, `editor-*.ts`, `manual-option*.ts`, `draft-storage.ts`, `conversion-diagnostics.ts`, `question-quality.ts` | Öğrenci soru bileşeni, düzenleyici araçları, IndexedDB taslağı, tanılama paketi, uyarı sınıfları. |
| `public/vendor/` | Çevrimdışı çalışan PDF.js (cmaps, fontlar, wasm) ve Tesseract (worker, LSTM çekirdekleri, `tur`/`eng` dil modelleri), ~25 MB. |
| `tests/` | 32 `*-regression.mjs` + `local-server.mjs`, `standalone-packaging.mjs`, `fixtures/` (sentetik PDF), `reference/` (3 gerçek sınav PDF'i). |
| `scripts/` | build/serve/yedek/hesap, test koşucuları, `licenses.mjs`, OCR ve tanılama araçları (`scripts/ocr/`), `windows/*.cmd`. |
| `docs/` | Üç rehber (`KURULUM-ISLETIM`, `GELISTIRICI-REHBERI`, `LLM-MANAGER`), `lisanslar/` (otomatik üretilir — elle düzenlemeyin), `tail-comparison.json` (test girdisi). |

## 5. Veri modeli

**Tablolar** (`lib/db.ts`): `User(id,email,name,passwordHash,createdAt)`, `Session(tokenHash,userId,expiresAt)`, `LoginLimit(key,count,expiresAt)`, `StoredObject(key,data BLOB,contentType,customMetadata,updatedAt)`.

**`StoredObject` anahtar şeması** (asıl veri burada):

| Anahtar | İçerik |
|---|---|
| `exams/{id}/definition.json` | Tam `Exam` (cevaplar dahil, yalnız sunucuda). `owner` alanı = öğretmenin hash'i. Sunucunun yönettiği alanlar (`parseExamForm` istemciden gelenleri siler): `version` (1'den başlar, her PUT'ta artar), `updated`, `closed`, `opensAt`, `closesAt`, `deleted` (ISO; yumuşak silme). |
| `exams/{id}/source.pdf` | Kaynak PDF (yalnız öğretmene açık). |
| `exams/{id}/assets/{uuid}` | Soru/şık/yönerge görselleri. |
| `exams/{id}/attempts/{uuid}.json` | Öğrenci sonucu (tam kayıt: soru bazlı `details` ve anahtar dahil, yalnız sunucuda). `customMetadata.s` hafif özet (`attemptSummary`: ad, puan, D/Y/B, süre, `version`, bölüm puanları), `customMetadata.c` ad kilidinin anahtarı (sonuç silinince serbest bırakılır). Özeti olmayan eski kayıtlar tam kayıttan türetilir. En fazla 5000 sonuç listelenir (analiz için 3000). |
| `owned/{ownerHash}/{id}` | Öğretmenin sınav özeti (`examSummary`: başlık, sayı, `version`, durum alanları); "Sınavlarım" listesi (en fazla 100). `GET /api/exams` silinmişleri gizler, `?deleted=1` yalnız silinmişleri verir. |

`ownerHash` = `SHA-256(userId)` (`lib/server.ts` → `owner()`).

**`Exam` / `Question`** (`lib/quiz.ts`): temel alanlar `title, subject, duration, questions[], sections[]`; `Question` temel olarak `id, number, sectionId, text, textMarks, options[], correct (null = anahtar yok), page, image, optionImages[], reviewed, warnings[], provenance` ve görüntü korumasına, kırpma onayına ve gösterim tercihine ait yaklaşık 50 alan daha. `correct === null` olan soru puanlanmaz (`grade` yalnız anahtarı olan sorulardan puan hesaplar).

**Tarayıcı tarafı depolar:** IndexedDB `pdfquiz/draft` (düzenleme taslağı, `lib/draft-storage.ts`), localStorage `pdfquiz-theme` ve `attempt-<id>` (öğrencinin devam eden yanıtı). AI anahtarı hiçbirinde saklanmaz.

**Sınır değerleri (kodda doğrulandı):** PDF 20 MB / 100 sayfa, 300 soru, 1200 görsel, sınav JSON'u 24 MiB, form gövdesi 48 MB, sonuç gövdesi 50 KB, AI isteği 6 MiB, AI sayfa görseli 5 MB.

## 6. API yüzeyi

| Rota | Yetki | Not |
|---|---|---|
| `GET /api/exams` | öğretmen | Kendi sınav özetleri. |
| `POST /api/exams` | öğretmen + `sameOrigin` | Yeni sınav (yeni UUID/bağlantı, `version: 1`). `parseExamForm` boyut sınırlarını, `validateExam` yayın kapısını ve `%PDF-` sihirli baytını uygular; görseller `saveAssets` ile kalıcılaşır. |
| `PUT /api/exams/{id}` | yalnız sahibi + `sameOrigin` | **Aynı bağlantıyı günceller**: kimlik, `created`, sonuçlar, kapatma/zamanlama korunur; `version` artar. İstemci yüklediği `exam.version`'ı gönderir; arada başka yerden güncelleme olduysa `409`. PDF gönderilmezse kaynak PDF korunur. Aynı sınavın görselleri kopyalanmadan yeniden kullanılır, yeni tanımda geçmeyenler silinir (`pruneAssets`). Silinmiş sınav `404`. |
| `DELETE /api/exams/{id}` | yalnız sahibi + `sameOrigin` | **Yumuşak silme**: `deleted` yazılır; liste ve öğrenci bağlantısı (görünüm/start/gönderim) `404` verir, veri ve sonuçlar saklanır, öğretmen sonuç/düzenleme erişimi sürer. Kalıcı silme yoktur. |
| `PATCH /api/exams/{id}` | yalnız sahibi + `sameOrigin` | `{closed?, opensAt?, closesAt?, restore?}` (başka alan `400`). Silinmiş sınav yalnız `restore:true` kabul eder. Bitiş > başlangıç olmalı; `null` ayarı kaldırır. |
| `GET /api/exams/{id}` | herkes | Öğrenci görünümü (`studentExam`): cevap anahtarı, kaynak görsel, öğretmen alanları **yok**. `assertOpen`: silinmiş `404`; kapalı, henüz açılmamış (`opensAt`) veya süresi dolmuş (`closesAt`) sınav açıklamalı `403`. |
| `?action=results\|pdf\|edit` | yalnız sahibi | Sonuçlar, kaynak PDF, tam düzenleme verisi. `results`: `page`, `pageSize` (≤200, varsayılan 50), `sort` (submitted/name/score/seconds), `dir`; yanıtta özet satırları, `total/pages`, tüm sonuçlardan `stats` (ortalama, medyan, en düşük/yüksek, bölüm ortalamaları) ve `versions`; soru bazlı ayrıntı/anahtar **yoktur**. `results&format=csv`: tüm sonuçlar, UTF-8 BOM, `;` ayırıcı, ondalık virgül (Excel TR), formül enjeksiyonuna karşı `=`, `+`, `-`, `@` başlangıçlı hücrelere `'` eklenir (`csvCell`). |
| `?action=analysis` | yalnız sahibi | Soru analizi (`questionAnalysis`): şık dağılımı, doğru oranı, ayırt edicilik (üst/alt %27, en az 6 sonuç), uyarılar (çok zor/kolay, düşük/negatif ayırt edicilik, anahtar şüpheli). Her sonucun kendi sürümündeki durumu sayılır. |
| `DELETE /api/exams/{id}?action=result&id=` | yalnız sahibi + `sameOrigin` | Tek sonucu siler (geri alınamaz) ve ad kilidini serbest bırakır; öğrenci aynı adla yeniden gönderebilir. |
| `?action=asset&key=` | görsel öğrenciye açıksa herkes, değilse sahibi | Erişim, `studentExam` çıktısındaki izinli URL listesine bakılarak kararlaştırılır. |
| `POST /api/exams/{id}?action=start` | herkes + `sameOrigin` | Tek kullanımlık **deneme belirteci** verir (hash'i `exams/{id}/tokens/` altında, süre = sınav süresi + 15 dk). IP + sınav başına hız sınırı (`ATTEMPT_LIMIT_PER_10MIN`, varsayılan 60/10 dk; sayaç süreç belleğindedir). |
| `POST /api/exams/{id}` | herkes + `sameOrigin` + belirteç | Öğrenci sonucu. Belirteç zorunlu ve atomik harcanır (`consumeAttempt`); aynı ad (+ IP; büyük/küçük harf ve boşluk fark etmez) ile ikinci gönderim `409` ile reddedilir (`claimSubmission`, `exams/{id}/submitted/`); belirteçten sınav süresi + 2 dk geçmişse `400`; sonuç kaydına `started` ve `seconds` yazılır. `answers` soru kimliklerine göre süzülür; ad `<`/`>` içeremez. Yanıtta `correct` hiçbir zaman yok; soru bazlı `details` (durum) **yalnız sınavda `showDetails: true` ise** gelir (varsayılan kapalı: yalnız toplam ve bölüm sayıları). |
| `POST /api/auth/login`, `logout`, `GET me` | — | scrypt, 7 gün oturum, kilit e-posta+IP çifti başına 15 dk'da 8 hatalı giriş (e-posta başına tüm IP'lerden 60), hatalı denemede artan gecikme, `sameOrigin`. |
| `POST /api/auth/password` | oturum + `sameOrigin` | `{current, next}`: mevcut şifre doğrulanır (kullanıcı başına 5 hatalı deneme/15 dk → 429, artan gecikme), yeni şifre 12–256 karakter ve eskisinden farklı olmalı; başarıda **geçerli oturum dışındaki tüm oturumlar kapanır**. |
| `POST /api/auth/sessions` | oturum + `sameOrigin` | `{scope:'others'}` geçerli oturumu korur, `{scope:'all'}` hepsini kapatır ve çerezi siler. `GET /api/auth/me` etkin oturum sayısını (`sessions`) da verir. Oturum listesi/cihaz adı yoktur (şema yalnız token özeti, kullanıcı ve bitiş tutar). |
| `POST /api/ai` | öğretmen + `sameOrigin` | Kullanıcının anahtarıyla izinli üç adrese istek aktarır (§8). |
| `GET /api/health` | herkes | `SELECT 1` + `user.count()`. |
| `/llm`, `/api/llm/*` | Basic auth (`LLM_ADMIN_*`) | LLM Manager paketine devredilir (§9). |

Hata yanıtları `error(e)` (`lib/server.ts`) ile üretilir: `'AUTH'` → 401 ("giriş yapın"); `NotFound` → 404 (olmayan/geçersiz sınav, PDF, görsel); `Forbidden` → 403 (başka öğretmenin sonuç/PDF/düzenleme/kaynak görseli); `HttpError(status)` → kendi durumu (409, 429…); bilerek fırlatılan düz `Error` (Türkçe doğrulama iletisi) ve bozuk JSON (`SyntaxError`) → 400; **beklenmeyen hata türleri** (`TypeError`, veritabanı hataları vb.) → ayrıntısız genel ileti + 500, ayrıntı yalnız sunucu günlüğüne (`console.error`) yazılır. Yani istemciye gidecek bir doğrulama iletisi için düz `Error`, durum kodu gereken yer için `HttpError` alt sınıfı kullanın; `new TypeError(...)` gibi türleri doğrulama için fırlatmayın. `Origin` uyuşmazlığı bilerek 400 kalır. `/llm` ve `/api/llm`, `LLM_ADMIN_PASSWORD` yokken 503 döner (`llm.js`).

## 7. PDF dönüşüm hattı (istemci)

`convertPDF(doc, opts)` (`lib/pdf-import.ts`): sayfa sayfa okur → dijital metinse PDF.js öğeleri, taranmışsa Tesseract (OEM 1/LSTM, PSM 11, 144 DPI, `tur+eng`) → `pdf-layout.ts` ile satır/sütun/okuma sırası → `parsePages` (`quiz.ts`) ile soru ve şık ayrıştırma → kapak/yönerge/cevap anahtarı sayfalarını sınıflandırıp dışarıda bırakma (`excludedBlocks`) → soru ve şık görsellerini kırpma → uyarılar (`warnings`, `provenance`).

Önemli ilkeler (bozmayın):
- **Belgeye özgü sabitleme yok:** soru numarası, dosya adı veya cümleye bağlı kural eklenmez; genel geometri sinyali + belirsizlik kapısı + sentetik regresyon birlikte eklenir.
- **Otomatik metin düzeltmesi yok.** Eksik şık, PDF cevap anahtarı ve AI önerileri **öğretmen onayı olmadan uygulanmaz**; manuel alanlar AI'ya karşı kilitlidir.
- Kırmızı mürekkep/kalem izi tespiti ve işaretsiz "güvenli kopya" üretimi (`eraseRedPixels`, `studentImage`, `imageProtection`) öğrenciye cevap sızmasını önler.
- AI **yalnız** kalite kapısı bulunan alanlara, kullanıcı çağrı tahminini onayladıktan sonra gider (`hybrid.ts`); yerel sonuç hata durumunda korunur. Modlar: "Otomatik / Yerel-önce / AI-önce".
- **Numara boşluğu kapısı** (`gapBoundaryWarnings`, `pdf-layout.ts`): bölüm içinde numara dizisinde boşluk varsa (1 → 6) boşluktan önceki soru, onaylanana kadar `BOUNDARY` sayılan "başka soru içeriği içerebilir" uyarısı alır; böylece sessiz yanlış eşleşme "sorunsuz" görünmez. Beklenen sayı kapak metninden (`Soru Sayısı: N`, `Toplam soru sayısı N`, ilk 3 sayfa) da okunur; tablo başlığındaki ilk hücre toplam sanılmaz.
- **Noktasız numara birleştirme** (`mergeDetachedNumbers`, `pdf-layout.ts`): OCR bazen kalın numaranın noktasını okumaz ve numarayı metinden ayrı bir satır verir ("10" + "Visual Basic'te …"). Yalnız taranmış (`ocrGeometry` var) soru sayfalarında; sütunda komşu numaralı sorular arasına sıra olarak oturan, aynı hizada ≥4 karakterlik, kod görünümsüz bir metin satırının solundaki çıplak 1–3 haneli satır, bir sonraki işarete kadar ≥2 şık satırı varsa "N." işaretçisi sayılır. Birleşen soru "numara sıradan çıkarıldı" (`NUMBER_INFERENCE`) uyarısı alır.
- **Harfsiz şık çıkarımı** (`inferUnlabeledChoices`, `repairOptionSequence` içinde): OCR şık harflerini hiç okumayıp satırları yalnız ")" ile başlatırsa, tek sütunda hizalı 3–`maxChoices` satır (harfli olanlar konumlarıyla uyuşmalı, satır arası ≤ .12) harfini konumdan alır; mevcut "Sıra çıkarımı" uyarısı onaya bağlı kalır. En az 2 harfli satır varsa eski onarım yolu çalışır.
- **Numarasız grup çıkarımı** (`assignGroupNumbers`, `pdf-layout.ts`): OCR art arda birden çok numarayı hiç okumazsa (örn. 2–5 ve 7–9) sütun "şık koşusu (≥3 şık satırı) + >1,9 satır boşluğu" ile gruplara bölünür; **en az 2** numarasız grup, komşu numaralar arasındaki boşlukla TAM eşleşirse (ve her grupta ≥3 şık satırı varsa) numaralar sırayla çıkarılır, soru "komşu numaralar ve şık koşusu geometrisinden çıkarıldı (numara sıradan çıkarıldı)" uyarısı taşır. **Tek numaralık boşluk bilinçli olarak dışarıda**: mevcut politikada yalnız öğretmen önerisi olarak yer tutucuya bağlanır (`inferOCRQuestionBoundary`, `tests/phase3d2-regression.mjs`).
- **Kapak tablosundan bölümler** (`tableSections`, `assignSectionRanges`, `pdf-layout.ts`): okul dersi olmayan derslerde kapaktaki "DERS ADI / SAYFA" tablosu ve "Her ders için N soru" cümlesi bölüm üretir (SAYFA sütununa göre sıralı; sayfa eksik/tekrarlı veya "Soru Sayısı" ile çelişirse bölüm yok). Sayfalarda bölüm başlığı yoksa ve numaralar belge boyunca sürekliyse sorular numara aralığından bölümlenir; `Section.firstNumber` bölümün ilk numarasıdır (varsayılan 1). Numara kapıları, özet, cevap anahtarı satırları ve AI kapsamı bu aralığı kullanır (`sectionRange`). Atama dönüşümün sonunda (sıralamadan önce) yapılır; sayfa analizi bölümsüz çalışır. Başlıklı/yeniden başlayan numaralı sınavlar eskisi gibi çalışır.
- **Taranmış cevap anahtarı sayfası** (`keyNumberColumns`, `pdf-layout.ts`; `recoverAnswerKeyColumns`, `pdf-import.ts`; `columnKeyInfo`, `quiz.ts`): tam sayfa OCR tek harfleri düşürür; "cevap anahtarı" sınıflı, OCR okumalı sayfada tam sayfadan <6 cevap çıkarsa numara sütunlarının bantları harf beyaz listesiyle (PSM 6) ayrıca okunur, yalnız "N. X" satırları kabul edilir, çelişen numara çıkarılır, harf düzeltmesi yapılmaz. Sonuç yine `pdfAnswerKey` olarak öğretmen onayına bırakılır (otomatik uygulanmaz); `readOCRPage` varsayılan beyaz listeyi boşaltır.
- **Izgara şıklar** (`splitOptions`, `inferGridChoices`, `pdf-layout.ts`): satır içi şıklarda harfi okunamayan ayırıcılar ("A) x ) y") ayrı şık sayılır; harfli/harfsiz (")") şık parçaları tam `maxChoices` adet ve düzenli bir ızgara (2×2, 1×4; satır-büyük-sütun) oluşturur, harfli olanlar konumlarıyla uyuşursa eksik harfler konumdan çıkarılır ("Sıra çıkarımı" uyarısı, onaya bağlı). Tek sütun yerleşim eski yoldadır (`inferUnlabeledChoices`, `repairOptionSequence`).
- Dönüşüm süreleri (referans PDF'ler, yerel hat): dijital 9–16 sayfa 14–31 sn, taranmış 12 sayfa ~94 sn.

## 8. AI (kalite kontrolü) — LLM Manager'dan bağımsız

`/api/ai` → `requestAI` (`lib/ai.ts`): izinli adresler **yalnızca** `https://api.openai.com/v1`, `https://openrouter.ai/api/v1`, `https://generativelanguage.googleapis.com/v1beta/openai`. Anahtar her istekte tarayıcıdan gelir (`payload.key`), sunucuda saklanmaz. `providerFetch`, yalnız Gemini adresi `ENOTFOUND` verirse `dns.resolve4` ile yeniden dener. İstek zaman aşımı 65 sn.

## 9. LLM Manager (`/llm`) ve ilk hesap

- Paket `@sirrakadembasti/llm-manager` (GitHub, lock'ta sabit commit). `/llm` paneli ve `/api/llm` Basic auth ile korunur; parola `.env` → `LLM_ADMIN_PASSWORD` (yoksa `AUTH_NOT_CONFIGURED`). Profiller ve şifreli anahtarlar `LLM_DATA_DIR` (varsayılan `data/`) içinde; `LLM_USAGE_LOG=true` ile aylık sayaç. **Uygulamanın hiçbir işlevi bu paneli kullanmaz**; `app/actions/llm.js` içindeki Server Action öğretmen yetkisi bağlanana kadar bilerek kapalı. Ayrıntı: [docs/LLM-MANAGER.md](docs/LLM-MANAGER.md).
- **İlk öğretmen hesabı:** `instrumentation.ts` (Node çalışma zamanı) her sunucu açılışında `lib/initial-account.ts → ensureInitialTeacher()` çağırır: hesap yoksa ve `INITIAL_ADMIN_PASSWORD` (12–256 karakter) doluysa `INITIAL_ADMIN_EMAIL` (varsayılan `admin@local.test`) ile hesap oluşturulur; geçersiz değerde yalnız uyarı yazılır, sunucu açılır. Hesap bir kez oluşunca `.env` değerleri yok sayılır; giriş her zaman veritabanına bakar.

## 10. Test düzeni (bir şey değiştirmeden önce okuyun)

- **Standart paket** `pnpm test` → `scripts/run-tests.mjs`: (1) `check-test-policy.mjs` (`skip` yasak; `lib/db.ts`'i yükleyen test kendi `process.env.DATABASE_URL`'ini ayarlamalı), (2) `licenses.mjs --check`, (3) sabit **liste**deki dosyalar sırayla (`--test`, `tail` hariç). Toplam **310 test**; 33 dosya, yaklaşık yarısı saf mantık, kalanı React/SSR ve API akışı.
- **Yeni test dosyasını `scripts/run-tests.mjs` içindeki `suites` listesine eklemek zorunludur;** dosya adı `tests/<ad>-regression.mjs` olmalı. Listede olmayan dosya sessizce çalışmaz.
- **Kaynak, TypeScript'ten anlık derlenir:** testler `typescript.transpileModule` ile `lib/*.ts` ve `app/**/*.tsx`'i `.test-tmp/qa/modules/` altına CommonJS yazar; bağımlılıklar test dosyası içinde mock'lanır: derleme çıktısındaki `lib/session.js` yerine `global.__qaUser` döndüren bir stub, `lib/storage.js` yerine bellek kovası yazılır (bu dosyalar `.test-tmp/` altında üretilir, kaynakta yoktur). Modül eklerseniz test dosyalarındaki derleme listesine (`for (const name of [...])`) eklemeniz gerekebilir.
- **Gerçek DB yok:** `test` tüm testlere `.test-tmp/run-tests/quiz.db` verir; sunucu testi (`test:server`) sistem geçici klasöründe DB kurar. Gerçek `data/quiz.db`'ye dokunan test yazmayın.
- **Belgeye özgü kabul katmanı** (`test:acceptance`, `RUN_REAL_ACCEPTANCE=1`) standart sayıma girmez; dört `*_REFERENCE_*` yolu ister ve eski bir belgenin içeriğine bağlıdır. `tests/reference/` PDF'leri standart pakete dahil değildir; `pnpm reference` bunları gerçek hattan geçirir (son sonuç: üçü de 50/50 soru).
- **CI:** `.github/workflows/ci.yml`, `main`'e push ve her PR'da `windows-latest` üzerinde `pnpm install --frozen-lockfile`, `typecheck`, `test`, `build`, `test:server` çalıştırır.
- **Gerçek tarayıcı/mobil, canlı AI, çift tıklamalı `.cmd`, harici sunucu dağıtımı doğrulanmadı**; React/SSR testleri tarayıcı doğrulaması yerine geçmez.

## 11. Kod stili ve değişiklik kuralları

- **Yoğun, çok uzun satırlı kod:** özellikle `app/page.tsx` ve `lib/*.ts` içinde tek satırda yüzlerce karakterlik fonksiyonlar vardır. Biçimlendirici/otomatik yeniden yazım **çalıştırmayın**; küçük, hedefli düzenleme yapın (benzersiz bir dize ile) ve ardından `tsc` + ilgili test dosyasını çalıştırın.
- **Dil:** arayüz metni, hata mesajları, commit ve belgeler **Türkçe**; test adları Türkçe. Yeni kullanıcı mesajı ekliyorsanız aynı üslubu koruyun.
- `any` yaygındır; ESLint yoktur. Tür hatası kapısı `pnpm typecheck`'tir. Kullanılmayan tanım bırakmayın (`tsc --noUnusedLocals --noUnusedParameters` şu an temiz).
- Bağımlılık eklemeden önce gerekçe arayın; ekleyecekseniz `pnpm-lock.yaml` ve `docs/lisanslar` güncellenmeli (`pnpm build` ya da `node scripts/licenses.mjs` yazar, `test` denetler).
- `docs/lisanslar/**` ve `pnpm-lock.yaml` **elle düzenlenmez**.
- Commit biçimi: `feat:`/`fix:`/`docs:`/`chore:` önekleri (Conventional Commits), Türkçe veya İngilizce kısa açıklama.

## 12. Ortam tuzakları

- **Bu geliştirme bilgisayarı (Windows, kısıtlı ağ):** PATH'te `pnpm`/`npm` yok; `. D:\dnm\use-node.ps1` ile pnpm 9.15.1 gelir (depo 11.25.0 ister; kilit dosyası ikisiyle de çözülür). Node'un `dns.lookup`'ı bozuk (`ENOTFOUND`), kayıt defteri bazı paket tarball'ları için 403 verir; bu yüzden `node_modules` güncel kilitten geridedir (Next 16.4.0; `@sirrakadembasti/llm-manager` yerel kopyadan elle yerleştirildi). Sonuç: bu makinede `pnpm test` lisans denetiminde durur; testleri `node --test tests/*-regression.mjs` ile doğrudan koşun. Gerçek `pnpm install --frozen-lockfile` ağı serbest bir makinede yapılmalıdır.
- **`.env` yükleme önceliği:** süreçte tanımlı ortam değişkeni `.env` değerini ezer (boş dize bile). Test/deney yaparken `INITIAL_ADMIN_*` gibi değerleri açıkça verin.
- **Derleme:** `next build --webpack`; `next.config.ts` üretim derlemesinde webpack önbelleğini kapatır (Windows/pnpm symlink sorunu). Windows'ta standalone çıktısının bağımlılık bağlantılarını `scripts/standalone-links.mjs` tamamlar; yalnız `next build` çağırmayın, `pnpm build` kullanın. `@libsql/*` ve llm-manager `serverExternalPackages` içindedir.
- Bu `AGENTS.md` elle yazılmıştır. `next.config.ts` içinde `agentRules: false` olduğundan `next dev` bu dosyaya Next.js'in kendi kural bloğunu eklemez; dosyada o bloğun işaretleri (`<!-- BEGIN:nextjs-agent-rules -->`) bulunmaz, bu yüzden silinmez.
- `next-env.d.ts` çalışan `next dev` tarafından yeniden yazılır (`.next/dev/...` yolları); commit'e almayın (`git checkout -- next-env.d.ts`).
- Çalışan `build`/`licenses`, yerel `node_modules` eski olduğundan `docs/lisanslar/DEPENDENCIES.md` içine yanlış Next sürümü yazabilir; geri alın.
- Git dışı yerel veri: `.env`, `data/` (gerçek `quiz.db`, LLM profilleri/anahtarı), `backups/`, `.next/`, `.test-tmp/`. Bunları commit etmeyin, içeriklerini günlüğe/çıktıya yazmayın.

## 13. Değişmezler (güvenlik ve veri bütünlüğü)

1. Öğrenciye giden hiçbir yanıt `correct`, cevap anahtarı, kaynak PDF veya işaretsiz olmayan kaynak görseli taşımamalıdır (`studentExam`, `?action=asset` izin listesi, sonuç yanıtında `correct` temizliği). Bu mantığa dokunan her değişiklik regresyon testi gerektirir.
2. Öğretmen işlemleri `owner()` ile sahiplik kontrolü yapar; başka öğretmenin görseli kopyalanamaz (`saveAssets`).
3. Değiştiren her istek `sameOrigin` ile doğrulanır: `Origin` varsa uygulamanın adresiyle eşleşmeli; yoksa `Sec-Fetch-Site` `same-origin`/`none` olmalı, aksi halde reddedilir. İstemci IP'si yalnız `TRUST_PROXY=true` iken (güvenilir ters vekilin eklediği son `X-Forwarded-For` girdisi) kullanılır; kapalıyken tüm istemciler tek anahtar sayılır.
3a. Öğrenci sonucu yanıtı toplam puanı verir; her gönderim bir tahmin sinyali olduğundan belirteç + hız sınırı kaldırılmamalıdır. Güvenlik başlıkları (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`) `next.config.ts` içindedir; yeni dış kaynak/worker eklerseniz CSP'yi güncelleyin.
4. AI adres beyaz listesi genişletilirken SSRF riski düşünülmelidir.
5. Yayın kapısı (`examIssues`/`validateExam` ve arayüzdeki paylaşım onayı): kodda doğrulanan engeller — hiç soru olmaması, `OKUNAMADI` yer tutucusu, eksik/belirsiz şık görseli, gövde sınırı bulunamaması, komşu alana taşan kırpma, kalem izi çakışması, güvenli kopya onayı beklemesi, renkli işaret gizlemenin kapalı olması, geçersiz şık sayısı. Arayüz ayrıca doğru cevapların tamamlanmasını ve açık onayı ister. Kapıyı gevşeten değişiklikler açıkça tartışılmalıdır.

## 14. Bilinen borçlar ve geliştirme fırsatları

- `app/page.tsx` (~107 KB) ve `app/globals.css` (~47 KB) tek dosya: bileşenlere bölünebilir (davranışı bozmadan, test eşliğinde).
- Güncelleme (PUT), yumuşak silme ve kapatma var; **kalıcı silme, sürüm geçmişi ve eski sürüme dönme yok** (PUT eski tanımın üzerine yazar; yalnız sonuç kaydında `version` tutulur). Öğrencinin cihazdaki yarım yanıtı (`attempt-<id>`) soru kimlikleri değişirse yeni sürümle eşleşmeyebilir.
- `POST /api/exams/{id}` (öğrenci sonucu) kimliksizdir; belirteç + IP başına hız sınırı vardır ama sınır tek süreç belleğindedir ve ortak IP'li sınıflarda (NAT) paylaşılır. Süre denetimi yumuşaktır: sorular belirteçsiz okunabildiğinden öğrenci belirteci geç alarak süreyi uzatabilir; sunucu yalnız belirteç yaşını ve kayıtlı süreyi denetler. Aynı ad kuralı aynı adlı iki öğrenciyi (aynı IP'de) engeller. Sınav listesi 100 ile sınırlı (sayfalama yok); sonuç listesi sayfalı ama her istekte tüm özetler okunur (5000 sınırı) ve analiz tüm tam kayıtları yükler (3000 sınırı); çok büyük sınavlar için indeksli bir sonuç tablosu gerekir. Dışa aktarma yalnız CSV'dir (.xlsx yok).
- Kayıt sayfası yok; yeni hesap yalnız CLI (`user:add`) ve ilk hesap `.env` ile eklenir; şifre unutulursa `user:reset`. Şifre değiştirme ve oturum kapatma arayüzde var ama oturum listesi (cihaz/son kullanım) yok. Çok kullanıcı portalı ayrı bir tasarım işidir.
- LLM Manager, uygulama işlevlerine (ör. soru üretme) bağlanmadı; bağlanacaksa `app/actions/llm.js` içindeki yetkilendirme `currentUser()` ile yapılmalı. Panelin token toplamı gizli düşünme tokenlarını saymaz.
- Taranmış belgelerde yoğun öğretmen kontrolü beklenir (grup-36: 50 sorunun 47'sinde uyarı, 6 boş şık).
- ESLint ve Windows dışı platform doğrulaması yok.

## 15. Bir değişiklik yapmadan önce kontrol listesi

1. İlgili modülü ve onu sınayan `tests/*-regression.mjs` dosyasını okuyun (`grep` ile modül adını testlerde arayın).
2. Hedefli düzenleme yapın; uzun satırları yeniden biçimlendirmeyin.
3. `node node_modules/typescript/bin/tsc --noEmit --incremental false` (veya `pnpm typecheck`).
4. İlgili dosyayı çalıştırın: `node --test tests/<ad>-regression.mjs`; sonra tüm paketi (`node --test tests/*-regression.mjs` ya da `pnpm test`).
5. Sunucu/yetki/derleme değiştiyse `pnpm build` ve `pnpm test:server`.
6. Öğrenci verisi, kimlik veya depolama mantığına dokunduysanız §13'ü yeniden okuyun ve test ekleyin.
7. Yeni test dosyasını `suites` listesine ekleyin; yeni `.env` değişkenini `.env.example` ve ilgili rehbere yazın.
8. Belgeyi güncel tutun: davranış değiştiyse README/KURULUM-ISLETIM/GELISTIRICI-REHBERI/bu belge.
