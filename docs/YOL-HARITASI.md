# Yol haritası — gerçek sınav PDF'i ile uçtan uca test bulguları

Tarih: 19 Kasım 2026. Test belgesi: "Bilgisayar Programcılığı Sertifika Sınavı" (MEB, 16 Temmuz 2011, B kitapçığı). Belge **taranmış**, 17 sayfa ve 120 soru içeriyor: 15'er sorudan oluşan 8 ders bölümü, iki sütun, 4 şık (çoğu 2×2 ızgara). 17. sayfada dört sütunlu cevap anahtarı var. Bu belgenin içeriğine bağlı kural eklenmemelidir (AGENTS.md §7); aşağıdaki çözümler genel sinyal ve sentetik regresyonla yapılmalıdır.

## Nasıl test edildi

| Hat | Yöntem | Sonuç |
|---|---|---|
| PDF dönüşümü | `node scripts/convert-reference.mjs` (PDF.js + Tesseract, AI yok) | 128,7 sn; **64/120 soru**; 0 bölüm; anahtar bulunamadı |
| Düzenleyici / anahtar / yayın kapısı | `lib/quiz.ts` ve `lib/answer-key.ts` derlenip doğrudan çağrıldı | Kapı 342 engel üretti; temiz anahtar metni 120/120 ayrıştı |
| API, öğrenci, puanlama | `.next/standalone` + geçici SQLite, HTTP yoklaması (gerçek `data/quiz.db` kullanılmadı) | Kritik bir anahtar sızıntısı ve hız sınırı eksikliği |
| Arayüz | Tarayıcı paneli: öğrenci akışı (masaüstü + 375 px mobil), öğretmen girişi, Sınavlarım, sonuç paneli | Sonuç ekranında hata; tekrar girişte koruma yok |
| Regresyon | `node --test tests/*-regression.mjs`, `tsc --noEmit` | Kod değişmediği için yalnız mevcut durumu doğrular |

Yoklama betikleri git dışı `.test-tmp/sertifika/` altındadır (`probe-editor.cjs`, `probe-api.mjs`, `serve-qa.mjs`, `render.mjs`).

## Bulgular

### P0 — güvenlik / öğrenci verisi (önce bunlar)

1. **Cevap anahtarı sonuç yanıtından çıkarılabiliyor.** `POST /api/exams/{id}` yanıtında `correct` siliniyor, ama her sorunun `status` değeri ('correct'/'wrong') kalıyor. Gönderim de kimliksiz ve sınırsız. Her şık için bir gönderim yapılarak (4 istek) 6 soruluk anahtarın tamamı çıkarıldı. Bu, §13/1 değişmezini fiilen bozuyor.
   *Çözüm:* Öğrenciye soru bazında durum gönderme ayarını öğretmene bırakın (varsayılan: yalnız toplam puan). Ayrıntı açıksa sınav süresi bitene kadar gösterilmesin. Regresyon testi eklenmeli.
2. **Sonuç gönderiminde hız sınırı ve tekrar koruması yok.** 100 anonim gönderim 1,6 sn'de kabul edildi. Bilinmeyen soru kimlikli ve HTML içeren adlı yanıtlar da kabul ediliyor. Sonuç listesi 200 kayıtla sınırlı olduğundan sahte gönderimler gerçek sonuçları listeden itebilir.
   *Çözüm:* IP + sınav başına `LoginLimit` benzeri bir sayaç, deneme belirteci (sınav başlarken sunucudan alınan tek kullanımlık kimlik), `answers` anahtarlarının soru kimliklerine göre süzülmesi.
3. **Hesap kilidi hizmet engeline açık.** Kilit yalnız e-postaya bağlı: 8 hatalı denemeden sonra doğru şifre de 15 dk boyunca 429 alıyor. E-postayı bilen biri öğretmeni dışarıda bırakabilir.
   *Çözüm:* Kilidi e-posta + IP birleşimine bağlayın; artan gecikme uygulayın.
4. **`sameOrigin`, `Origin` başlığı yoksa isteği geçiriyor.** Oturum çerezli `POST /api/exams` başlıksız istekte 201 döndü. `SameSite` çerezi riski azaltıyor, ama değiştiren isteklerde başlık eksikse `Sec-Fetch-Site` denetimi ya da reddetme eklenmeli.
5. **HTTP güvenlik başlıkları yok** (CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `nosniff`). `next.config.ts` `headers()` ile eklenebilir; PDF.js/Tesseract WASM için CSP'de `wasm-unsafe-eval` ve worker izinleri gerekir.

### P1 — PDF dönüşüm hattı (taranmış, iki sütunlu, ızgara şıklı belgeler)

6. **Soru kaybı:** 120 sorunun yalnız 64'ü bulundu. Örneğin 2. sayfada 2–5 ve 7–12 numaralı sorular yok. Numaralar 1–120 aralığına yayılmış durumda, aradaki 56 soru kayıp.
7. **Sessiz yanlış eşleşme (en tehlikeli dönüşüm hatası):** 1. sorunun metni doğru, ama şıkları 2. sorudan geliyor ("Display/Close/Zoom/Show"). Güven puanı 0,93, **uyarı sayısı 0**. Soru 44 (ALU) Pascal şıkları almış, 64 ve 117 de benzer. Öğretmen bu soruları "sorunsuz" görür.
   *Çözüm:* Numara dizisinde boşluk varken (1 → 6) önceki sorunun kutusunu "belirsiz" sayan bir kapı. Bir sorunun kutusu birden çok olası soru numarası/şık grubu içeriyorsa uyarı. Kutu yüksekliği beklenenin katlarıysa uyarı.
8. **2×2 ızgara şıklar:** 42 soruda boş şık; 11 yer tutucuya yanlışlıkla 5 şık atanmış. Belgede "Her sorunun dört seçeneği vardır" ifadesi var, ama hat bunu kullanmıyor.
   *Çözüm:* Kapaktan şık sayısı sinyali ("dört seçenek", "A–D") ve aynı satırda iki işaretli (A) … B) …) yerleşimi için sütun içi bölme.
9. **Bölümler algılanmadı:** "GÖRSEL PROGRAMLAMA", "C PROGRAMLAMA DİLİ" gibi kutulu ders başlıkları bölüm sayılmıyor. `isAnswerBoundary` yalnız okul derslerini tanıyor.
   *Çözüm:* Kapaktaki "DERS ADI / SAYFA" tablosundan ya da kutulu, büyük harfli, sütun başı başlık geometrisinden bölüm çıkarımı.
10. **Beklenen soru sayısı okunmadı:** `expectedCount("Soru Sayısı: 120")` sonucu `undefined`. Regex "Soru Sayısı:" kalıbını kapsamıyor. "Her ders için 15 soru" bilgisi de kullanılmıyor.
11. **Cevap anahtarı sayfası bulunamadı** (`pdfAnswerKey: null`). Aynı içerik düz metin olarak verildiğinde `answerKeyInfo` ve `parseAnswerKey` 120/120 doğru ayrıştırıyor. Sorun, OCR'ın dört sütunlu sayfayı okuma sırası ve sayfa sınıflandırması. Kitapçık türü de çıkmadı (`keyBooklet`, "B TEST KİTAPÇIĞI" kalıbını tanımıyor).
12. Son sayfalardaki yönerge/telif sayfası (s. 16) doğru dışarıda bırakıldı (34 ayrılan blok). Bu davranış korunmalı.

### P1 — öğrenci arayüzü

13. **Sonuç ekranı hatası:** Öğrenci sonucunda her soru için "Doğru cevap: — undefined" yazıyor ([app/page.tsx:98](../app/page.tsx)). Sunucu `correct` alanını siliyor, ekran ise bu alanı bekliyor. Önizlemede çalışıyor, öğrencide bozuk.
    *Çözüm:* `d.correct === undefined` durumunda satırı gizleyin; 1. maddedeki ayarla birlikte tasarlayın.
14. **Soru numarası:** Değerlendirmede kaynak numara (1, 2, 16, 17) yerine sıra (1–4) gösteriliyor; `q.number` kullanılmalı. Görsel gösterimli sorularda `q.text` boş olduğundan değerlendirme satırı boş kalıyor.
15. **Tekrar giriş:** Gönderimden sonra localStorage'da `{"completed":true}` kaydı var, ama giriş ekranı yeniden "Sınava başla" diyor ve sınav ikinci kez çözülebiliyor. Süre de yalnız istemcide; sunucu başlangıç/bitiş zamanını bilmiyor (sonuç kaydında süre bilgisi yok).
16. Ad alanında Enter tuşu sınavı başlatmıyor (alan `form` içinde değil); erişilebilirlik ve klavye kullanımı için düzeltilmeli.
17. Mobil (375 px) yerleşimi düzgün; yatay taşma yok. ✓

### P2 — öğretmen paneli / API

18. **Sınav güncelleme ve silme yok:** `DELETE` 405 döndü; aynı sınavın her kaydı yeni kimlikle listeye ekleniyor (3 kayıt oluştu). Eski bağlantılar ve sonuçlar sürümler arasında dağılıyor. Gereken: `PUT /api/exams/{id}` (aynı bağlantı, sürüm numarası), `DELETE` (yumuşak silme), arşivleme, sınavı açma/kapatma (başlangıç–bitiş zamanı).
19. **Sonuç paneli çok sınırlı:** Yalnız ad, puan, D/Y/B ve tarih var. Eklenmesi gerekenler: bölüm bazlı puan (veri zaten var), soru analizi (zorluk/ayırt edicilik, şık dağılımı), CSV/Excel dışa aktarma, tek sonucu silme, sayfalama (200 sınırı yerine).
20. **HTTP durum kodları:** Olmayan sınav ve geçersiz kimlik 404 yerine 400 dönüyor; tüm hatalar 400/401'e sıkıştırılmış ve beklenmeyen hata iletileri istemciye gidiyor. `NotFound`/`Forbidden` hata sınıfları ve 404/403/500 eşlemesi gerekiyor.
21. **`/llm`, `LLM_ADMIN_PASSWORD` boşken 500 dönüyor.** Bu bilerek kapalı, ama 503 ve açıklayıcı bir sayfa daha doğru olur.
22. Hesap yönetimi yalnız CLI'dan yapılıyor; arayüzden şifre değiştirme ve oturumları kapatma eklenmeli.

### P3 — mühendislik borcu

23. `app/page.tsx` (~107 KB) bileşenlere bölünmeli: öğrenci akışı (intro/quiz/result) ilk adayıdır ve 13–16. maddelerle birlikte ele alınabilir.
24. Gerçek tarayıcı uçtan uca testi (Playwright) yok; bu raporda elle yapılan öğrenci akışı otomatikleştirilmeli.
25. Taranmış belge kabul seti: telif izni varsa bu PDF'in **anonim, sentetik bir benzeri** (iki sütun, kutulu ders başlıkları, 2×2 şık, dört sütunlu anahtar) `tests/fixtures` altına eklenmeli; belgenin kendisi değil.

## Aşama 1 durumu (uygulandı)

Madde 1–5 ve 13 uygulandı: `showDetails` ayarı (varsayılan kapalı), tek kullanımlık deneme belirteci + IP/sınav hız sınırı, e-posta+IP kilidi ve artan gecikme, `sameOrigin` sıkılaştırması, güvenlik başlıkları, sonuç ekranı düzeltmesi. Regresyon: `tests/result-leak-regression.mjs`. Kalan sınırlar: sınav süresi hâlâ sunucuda denetlenmiyor (madde 15); hız sınırı süreç belleğinde; CSP gerçek tarayıcıda yalnız kısmen doğrulandı.

## Aşama 2 durumu (uygulandı)

Madde 14 (kaynak numara, görsel soru başlığı), 15 (sunucuda aynı ad ile ikinci gönderim reddi, cihazda tamamlanmış sınav için uyarı ve kapalı başlat düğmesi, sunucuda başlangıç/süre kaydı ve süre aşımı reddi) ve 16 (Enter ile başlatma) uygulandı. Süre denetimi yumuşak kalır: öğrenci belirteci geç alarak süreyi uzatabilir; gerçek zorlama için soruların da belirteçle verilmesi gerekir.

## Aşama 3 durumu (kısmen uygulandı)

Madde 10 (beklenen sayı) ve 7 (sessiz yanlış eşleşme kapısı) uygulandı; testler `tests/number-sequence-regression.mjs` içinde (sentetik PDF dahil). Sertifika belgesinde ölçüm (110 sn, OCR): beklenen sayı artık 120 okunuyor; 1, 44 ve 64 numaralı sorular "başka soru" uyarısı alıyor. Soru sayısı hâlâ 64/120 (madde 6), şıklar (8), bölümler (9) ve anahtar sayfası (11, sonradan tamamlandı) açık. Kapak tablosundaki "Her ders için N soru" bilgisi bölüm algısıyla (madde 9) birlikte ele alınmalı. Kutu yüksekliği temelli ek sinyal (kutu beklenenin katıysa uyarı) eklenmedi.

## Madde 6 tanılaması (soru kaybı, 64/120)

Yöntem: `GAP_REPAIR=1 DIAGNOSTICS=1 node scripts/convert-reference.mjs <pdf>` (sertifika belgesi, ~118 sn). `GAP_REPAIR=1` uygulamadaki gibi numara boşluğu OCR kurtarmasını açar; `DIAGNOSTICS=1` her sayfanın OCR satırlarını ve numara adaylarının kabul/ret kararlarını JSON'a yazar. Not: önceki ölçümler kurtarma kapalıyken yapılmıştı; açıkken de sonuç aynı (64/120, 118 sn), yani uygulama da aynı sayıyı görür.

Bulgu: kayıp 56 sorunun soru metni OCR'da yüksek güvenle (%90+) okunuyor; kaybolan şey **numara işaretçisi**. İki ayrı kök neden:
1. **Noktası okunmayan numara (45 soru):** OCR numarayı ("10", "21", "46"…) soru metninden ayrı, tek başına bir satır olarak veriyor; nokta yok. Satır sütunun sol kenarında ve soru metniyle aynı taban çizgisinde. İşaretçi deseni "N." beklediği için aday bile olmuyor (tanılamada reddedilen aday yok). Örnek: sayfa 7'de 46–48, sayfa 9'da 66–69, sayfa 12'de 92–99.
2. **OCR'da hiç görünmeyen kalın numara (11 soru):** 2, 5, 7, 8, 9 (sayfa 2), 34–36, 49, 76, 108. Metin okunuyor, numara glifi yok. Hedefli OCR (`recoverNumberGaps`) yalnız 6 aralık deniyor (`numberGapSpans` limit=6) ve bulduğunu (örn. 86) `applied:false` ile yer tutucu önerisine bırakıyor.

Sonuç ve öneri: 1. neden tek başına 64 → ~109 sorunun yolunu açar ve genel bir geometri sinyaliyle çözülebilir (belgeye özgü kural gerekmez): sütun sol kenarında, bir metin satırının hemen solunda, aynı taban çizgisinde, beklenen sıra numarasına uyan çıplak 1–3 haneli satır → "N." işaretçisi say; "numara noktası okunamadı, sıradan çıkarıldı" uyarısıyla (mevcut NUMBER_INFERENCE sınıfı) öğretmen onayına bırak. 2. neden için kurtarma sınırı ve uygulama politikası ayrıca ele alınmalı. Hedef ≥115/120 için ikisi de gerekir.

## Madde 6 düzeltmesi (noktasız numara) ve kalan

`mergeDetachedNumbers` uygulandı (tests/number-sequence-regression.mjs, 2 test). Sertifika belgesi (kurtarma açık, ~150 sn): **64 → 100 soru**, 38 soru "numara sıradan çıkarıldı" uyarısıyla birleştirildi; referans PDF'ler değişmedi (50/50, 50/50, 50/50). Kalan 20 eksik numaranın dağılımı:
- **~19 numaralı blok şıksız olarak dışlandı** ("Şıkları olmayan numaralı blok; öğretmen geri alabilir": 27, 31, 34, 36, 39, 40, 44, 54, 76, 91, 101, 102, 106, 108, 109 …). Numara artık okunuyor ama OCR şık harflerini (A/B/C) düşürmüş, dört satır da ")" ile başlıyor. Sıradaki düzeltme: aynı x'te hizalı ardışık ")"-başlı 3–4 satırı sırayla A–D şık say (uyarılı, onaya bağlı) — madde 8 ile birlikte.
- **OCR'da numara glifi hiç yok:** 2, 3, 4, 5, 7, 8, 9 (sayfa 2) ve 34–36; hedefli OCR kurtarması (limit 6, otomatik uygulamıyor) gerekir (madde 6'nın ikinci nedeni).
- Not: eski çıktıdaki 40. soru başka sorulardan alınmış şıklarla "4 şık" görünüyordu (sessiz yanlış eşleşme); artık şıksız blok olarak açıkça dışlanıyor.

## Madde 8 (harfsiz şıklar) uygulandı

`inferUnlabeledChoices` ile sertifika belgesi (kurtarma açık, ~185 sn) **100 → 113 soru**; şıksız dışlanan blok 19 → 1 (yalnız 54). Eksik kalan 7 numara: 2, 3, 4, 5, 7, 8, 9 (sayfa 2; numara glifi OCR'da yok, hedefli OCR gerekir). Referans PDF'ler değişmedi (50/50 ×3, şık ve uyarı sayıları aynı). Hedef ≥115 için yalnız bu 7 soru (veya 2 tanesi) kaldı.

Açık kalan madde 8 işleri: boş şıklı 44 soru (çoğu 2×2 ızgara/satır içi; örn. "8 bit ) 24 bit ) 32 bit" tek satırda) ve kapaktaki "dört seçenek" sinyalinin kullanılması; bunlar harf düşmesinden ayrı bir sütun içi bölme işidir.

## Madde 6 tamamlandı: ardışık okunmayan numaralar

Kök neden: yalnız tek numaralık boşluklar işleniyordu (`numberGapSpans`, `unreadableRegions`); sayfa 2'de 2–5 ve 7–9 gibi ardışık boşluklarda bloklar birbirine karışıyor, 1. sorunun şıkları 2. sorudan geliyordu. `assignGroupNumbers` ile sütun şık koşusu + boşlukla gruplara bölünüyor ve numaralar komşu numaralarla tam eşleşme koşuluyla çıkarılıyor. Sertifika belgesi (kurtarma açık, ~148 sn): **eksik numara 0 (120/120 yuva)**, 6 soru numara çıkarımı uyarılı (2, 3, 4, 5, 7, 9); **9 yer tutucu** (8, 21, 23, 29, 46, 49, 54, 62, 66: şıkları okunamayan, öğretmen dolduracak), yani 111 içerikli soru. Sayfa 2'de 1–12 doğru gruplanıyor, 1. sorunun şıkları artık kendi şıkları. Referans PDF'ler değişmedi (50/50 ×3).

Kalan: yer tutuculu 9 soru ve en az bir boş şıklı 47 soru (2×2 ızgara + harf düşmesi, satır içi "A) .. B) .."; madde 8'in ikinci yarısı), bölümler (9), anahtar sayfası (11). Not: ≥115 hedefi yuva sayısı olarak aşıldı; içerikli soru sayısı 111.

## Madde 8 tamamlandı: ızgara şıklar

Satır içi harfsiz ayırıcılar bölünüyor (`splitOptions`) ve 2×2 / 1×4 ızgarada eksik harfler konumdan çıkarılıyor (`inferGridChoices`). Sertifika belgesi (kurtarma açık, ~200 sn): yer tutucu **9 → 7** (21, 23, 29, 46, 49, 62, 66), en az bir boş şıklı soru **47 → 15**; eksik numara 0. Referans PDF'ler değişmedi (50/50 ×3, aynı uyarı ve boş şık sayıları). Kalan 15 boş şıklı soruda bir şıkkın metni ve harfi birlikte OCR'da yok (parça sayısı < 4), konumdan çıkarılamaz; öğretmen kaynak görselden doldurur. Madde 8'deki "kapaktaki dört seçenek sinyali" kullanılmadı (parça sayısı zaten maxChoices ile sınırlı).

## Madde 11 tamamlandı: taranmış cevap anahtarı sayfası

Kök neden: sayfa "B TEST KİTAPÇIĞI CEVAP ANAHTARI" başlığıyla doğru sınıflanıyordu, ama tam sayfa OCR (PSM 11) tek harfleri hiç okumuyordu: 17. sayfada yalnız numaralar vardı (1–9 bile yok), `answerKeyInfo` 0 cevap buldu. Düzeltme: `keyNumberColumns` (`pdf-layout.ts`) mevcut OCR'daki çıplak numara satırlarını x'e göre sütunlar (≥6 satır); `recoverAnswerKeyColumns` (`pdf-import.ts`) her sütun bandını 2× büyütüp harf beyaz listesiyle (`0123456789ABCDE.`, PSM 6) ayrıca okur; `columnKeyInfo` (`quiz.ts`) yalnız "N. X" satırlarını kabul eder, çelişen numarayı çıkarır, harf düzeltmesi yapmaz. Yalnız taranmış (`ocr`) ve tam sayfadan <6 cevap çıkan anahtar sayfalarında çalışır; sonuç ≥6 cevap değilse atılır. `keyBooklet` "B TEST KİTAPÇIĞI" kalıbını tanır (`quiz.ts`'e taşındı; `answer-key.ts` yeniden dışa aktarır), sınav ve anahtar kitapçık alanı dolar.

Sertifika belgesi: `pdfAnswerKey` null → **120/120 cevap, 0 çelişki**, tamamı kaynak görselle satır satır karşılaştırıldı (OCR "4..C" gibi çift noktalı satırlar da okunur). Cevaplar yine **otomatik uygulanmaz**: toplu anahtar alanında önizlenip öğretmen onayı bekler (soru `correct` alanı `null` kalır). Yer tutuculu 7 soru için anahtar satırı vardır ama eşleşecek soru yoktur; öğretmen soruyu tamamlayınca eşleşir.

## Madde 20 ve 21 tamamlandı: durum kodları ve /llm 503

`lib/server.ts`: `NotFound` (404) ve `Forbidden` (403) sınıfları; `readExam`, PDF, görsel ve sahiplik denetimleri bunları kullanır. `error()` bilerek fırlatılan düz `Error`'ı 400, bozuk JSON'u 400, beklenmeyen hata türlerini ayrıntısız 500 (günlüğe yazılarak) döndürür. `/llm`, `LLM_ADMIN_PASSWORD` yokken 503 verir. Testler: yeni `tests/api-status-regression.mjs` (4 test); `tests/local-server.mjs` içindeki yabancı öğretmen beklentisi 400 → 403 (gerçek sunucuda koşulmadı, `build` gerekir). Madde 18 (güncelleme/silme/kapatma), 19 (sonuç paneli) ve 22 (hesap) açık.

## Madde 18 tamamlandı: sınav güncelleme, silme, kapatma

Kararlar (kullanıcı onaylı): aynı bağlantıyı güncelle (PUT, sürüm numarası), yumuşak silme (geri alınabilir), elle aç/kapat + isteğe bağlı başlangıç–bitiş. `PUT /api/exams/{id}`, `DELETE`, `PATCH {closed, opensAt, closesAt, restore}` (`app/api/exams/[id]/route.ts`); ortak yardımcılar `lib/server.ts` içinde (`parseExamForm`, `examSummary`, `assertOpen`, `pruneAssets`, `saveExamState`). Sürüm çakışması `409`; öğrenci erişim kapısı kapalı/zamanlı için `403` + açıklama, silinmiş için `404`; başlamış denemeler kendi süresi içinde gönderilebilir. Sonuç kaydına `version` yazılır. `saveAssets` aynı sınavın görsellerini kopyalamadan yeniden kullanır. Arayüz: "Sınavı güncelle" (PUT; PDF yalnız değiştiyse yüklenir), sınav kartında durum rozeti (KAPALI / PLANLI / SÜRESİ DOLDU / SİLİNDİ), erişim ayarı ve silme pencereleri, "Silinenleri göster" + "Geri al". Testler: `tests/exam-lifecycle-regression.mjs` (12), `tests/quiz-regression.mjs` (arayüz akışı güncellendi). Sürüm geçmişi, kalıcı silme ve ayrı arşiv durumu yapılmadı; madde 19 (sonuç paneli) ve 22 (hesap) açık.

## Madde 19 tamamlandı: sonuç paneli

Sonuç kaydına hafif özet (`customMetadata.s`) ve ad kilidi anahtarı (`c`) yazılır; liste özetten sayfalanır (`GET ?action=results&page&pageSize&sort&dir`), tüm sonuçlardan istatistik döner. Yeni: `?action=analysis` (soru analizi: şık dağılımı, doğru oranı, ayırt edicilik, uyarılar), `?action=results&format=csv` (Excel TR: BOM, `;`, ondalık virgül, formül enjeksiyonu koruması), `DELETE ?action=result&id=` (tek sonuç; ad kilidini serbest bırakır). Depolamaya `after` imleci eklendi (`lib/db.ts`, `lib/storage.ts`). Arayüz: `ResultsModal` (özet satırı, sıralama, sayfalama, bölüm puan sütunları, süre, sürüm, CSV bağlantısı, onaylı silme, Soru analizi sekmesi). Testler: yeni `tests/results-panel-regression.mjs` (10) ve arayüz akışı (`tests/quiz-regression.mjs`). Sınırlar: ayrı sonuç tablosu/indeks yok (5000 özet, 3000 analiz sınırı); `.xlsx` yok; tek öğrencinin soru bazlı cevap dökümü yok. Madde 22 (hesap) açık.

## Madde 22 tamamlandı: şifre değiştirme ve oturum yönetimi

`lib/local-auth.ts`: `changePassword` (mevcut şifre doğrulama, kullanıcı başına 5 hatalı deneme sınırı, artan gecikme, yeni şifre 12–256 karakter ve farklı; başarıda geçerli oturum dışındakiler iptal), `revokeOtherSessions`, `activeSessions`. Rotalar: `POST /api/auth/password`, `POST /api/auth/sessions` (`others` / `all`), `GET /api/auth/me` oturum sayısını da verir. `db.session` yeni `deleteMany({userId, exceptTokenHash})` ve `count`. `/account` sayfasında şifre formu (uyuşmayan/kısa şifre sunucuya gitmez) ve oturum düğmeleri. Testler: yeni `tests/account-regression.mjs` (9; gerçek geçici SQLite, çerez kavanozu stub'ı, sayfa render). Yapılmadı: oturum listesi (cihaz/son kullanım için şema değişikliği gerekir), kayıt sayfası, e-posta değiştirme, şifre değişince bildirim. Aşama 4 tamamlandı; sırada Aşama 5 (borç).

## Madde 23 başladı: öğrenci akışı ayrıldı

`intro`, `quiz` ve `result` görünümleri ile `SectionNavigation`, davranış değişmeden `app/student-flow.tsx` dosyasına taşındı (JSX birebir; durum `Home`'da, props ile aktarılır). Testlerdeki derleme listelerine yeni modül eklendi; `ui-followup-regression.mjs` kaynak denetimi iki dosyayı birlikte okur. Doğrulama: `tsc` (kullanılmayan tanım denetimiyle) temiz, `pnpm test` 309/309, `pnpm build`, `pnpm test:server` 9/9. İkinci adım: `api` ve `Modal` ortak `app/client-ui.tsx` modülüne, `ExamCard`, `AccessModal`, `DeleteModal`, `ResultsModal` ve yardımcıları `app/exam-panel.tsx` dosyasına birebir taşındı; `app/page.tsx` ~114 KB → ~100 KB. Doğrulama aynı (309/309, build, `test:server` 9/9). Üçüncü adım: `PDFView`, `SourceBadge`, `HybridReview`, `OptionImagePreview`, `BulkAnswers` ve `AIUsageCard` `app/editor-parts.tsx` dosyasına, `loadScript` ortak `app/client-ui.tsx` dosyasına taşındı; `app/page.tsx` ~100 KB → ~72 KB. Testler bu bileşenleri artık `app/editor-parts.js` üzerinden yükler; `page.js`'e sonradan `exports` ekleyen geçici satırlar kaldırıldı. Kalan büyük parça `Home` içindeki düzenleyici görünümü JSX'i (tek satır ~22 KB): çok sayıda `Home` durumuna ve işleyicisine bağlı olduğundan ayrılması için önce durumun (ör. bir `useEditor` kancası veya bağlam) düzenlenmesi gerekir; bu ayrı bir tasarım işidir.

## Madde 24: Playwright uçtan uca testleri eklendi

`@playwright/test` 1.65.1 (geliştirme bağımlılığı, yalnız Chromium) ve `pnpm test:e2e`. Senaryolar (`e2e/`): öğretmen girişi ve şifre değiştirme (uyuşmayan şifre sunucuya gitmez); dijital (`exam.pdf`) ve taranmış (`scanned.pdf`, OCR) PDF yükleme ile düzenleyiciye dönüşüm (PDF.js ve Tesseract worker'ları CSP altında, konsol hatası/CSP ihlali yok); oturumsuz öğrencinin sınavı çözmesi ve puanı; öğretmenin Sınavlarım → sonuç tablosu, CSV indirme (`a download`, BOM ve satır içeriği) ve erişim ayarıyla sınavı kapatması (öğrenci bağlantısı "Sınav açılamadı."). Sunucu `scripts/e2e-server.mjs` ile geçici veritabanında açılır. Yerelde iki ardışık koşu 4/4 (~46 sn). CI'a Chromium kurulumu ve `test:e2e` adımı eklendi.

Henüz kapsanmayanlar: bölüm ekranı ve özeti, erişim ayarındaki `datetime-local` zamanlama (saat dilimi), mobil görünüm, düzenleyicide yayınlama akışı (testler sınavı API ile oluşturur), sınav güncelleme/silme arayüzü.

## Madde 25: sentetik taranmış belge fixture'ı eklendi

`tests/fixtures/scanned-sections.pdf` (6 sayfa, yalnız JPEG görüntü, metin katmanı yok) ve üreteci `scripts/fixtures/scanned-sections.mjs` (anonim içerik, Arial, belirlenimci: aynı makinede aynı baytlar). Yapı: kapakta "Soru Sayısı: 24", "B TEST KİTAPÇIĞI", "DERS ADI / SAYFA" tablosu (4 ders) ve "Her ders için 6 soru"; her soru sayfasında kutulu ders başlığı, iki sütun, 2×2 ızgara şıklar; belge boyunca 1–24 kesintisiz numara; son sayfada "B TEST KİTAPÇIĞI CEVAP ANAHTARI" ve dört sütunlu "N. X" anahtarı (düzensiz anahtar: kaydırmalı eşleme hatası yakalanır). Test: `tests/scanned-sections-regression.mjs` (5 test, gerçek PDF.js + Tesseract, AI yok, ~25 sn).

Doğrulananlar: beklenen sayı 24 ve kitapçık B okunur; numaralar benzersiz; 4 şıkkı dolu 20 sorunun hepsi kendi şıklarını taşır (sessiz yanlış eşleşme yok); OCR'ın okumadığı numaralar (2, 3, 8, 9, 11, 20…) komşulardan uyarıyla çıkarılır; okunan anahtar cevaplarının hepsi doğrudur ve otomatik uygulanmaz.

**Fixture'ın bulduğu açıklar** (testler bunları sabitlemez; yalnız okunanın doğru, kaybın uyarılı olduğunu sınar — açık kapandıkça test sıkılaştırılmalı):
1. **Cevap anahtarının yarısı düşüyor (genel hata):** OCR başlığı "B TEST KİTAPÇIĞI" ve "CEVAP ANAHTARI" olarak iki satır okur; sütunlu okuma sırası metni "B TEST KİTAPÇIĞI, 1–12, CEVAP ANAHTARI, 13–24" diye dizer. `answerKeyInfo` yalnız "cevap anahtarı" ifadesinden sonrasını aldığından 24 doğru okunmuş satırın 1–12'si atılır (anahtar 12/24). Sütun kurtarma yolu (`recoverAnswerKeyColumns`) tam sayfadan ≥6 cevap çıktığı için devreye girmez.
2. **Bölüm çıkmıyor (OCR sınırı):** PSM 11, kapak tablosunun SAYFA sütunundaki tek haneli sayıları (2–5) hiç okumaz; `tableSections` her satır için sayfa numarası istediğinden bölüm üretmez. Olası çözümler: SAYFA sütunu bandını hedefli OCR ile yeniden okumak ya da sayfa sütunu tümüyle boşsa satır sırasını kullanmak.
3. **Sütun sonundaki numarasız sorular (bilinen politika sınırı):** 2. sayfada 5 ve 6'nın numarası OCR'da hiç yok ve sonraki numara (7) bir sonraki sayfada; `assignGroupNumbers` yalnız aynı sütundaki komşularla çalıştığından çıkarım yapılmaz, 4. soru blokları yutup şıksız kalır. Kayıp sessiz değildir ("eksik soru numaraları: 5, 6" ve 4. soruda uyarı).

Sıradaki: 1. açığın düzeltmesi (ayrı PR, kendi regresyon testiyle), sonra 2.

## Önerilen sıra

| Aşama | Kapsam | Maddeler | Doğrulama |
|---|---|---|---|
| 1 — Güvenlik yaması | Sonuç yanıtı ayarı, hız sınırı, deneme belirteci, kilit, Origin, başlıklar | 1–5, 13 | Yeni `result-leak-regression.mjs`; `pnpm test:server` |
| 2 — Öğrenci deneyimi | Sonuç ekranı, numara, tekrar giriş, sunucu tarafı süre, Enter | 13–16 | React/SSR testi + tarayıcı |
| 3 — Dönüşüm doğruluğu | Sessiz eşleşme kapısı, ızgara şık, bölüm başlığı, beklenen sayı, anahtar sayfası | 6–11 | Sentetik fixture + `pnpm reference` (bu PDF hedefi: ≥115/120 soru, 0 uyarısız yanlış eşleşme) |
| 4 — Panel | Güncelle/sil/kapat, sonuç analizi ve dışa aktarma, durum kodları | 18–22 | API regresyonu + `test:server` |
| 5 — Borç | page.tsx bölme, Playwright | 23–25 | Tüm paket |

## Devam rehberi (yeni oturum buradan başlar)

**Durum (21 Kasım 2026, `main` = `10af991`, CI yeşil):** Aşama 1–4 tamamlandı. Aşama 5'te madde 23'ün birebir taşıma kısmı, madde 24 ve madde 25 bitti; yukarıdaki "Madde 23 / 24 / 25" bölümleri ayrıntıyı verir. Bu oturumdaki birleştirmeler: #5 (öğrenci akışı ayrıldı), #6 (GitHub Actions CI), #7 (öğretmen paneli ve ortak yardımcılar ayrıldı), #8 (CSV testindeki aynı milisaniye sıralama belirsizliği), #9 (düzenleyici bileşenleri ayrıldı), #10 (Playwright), #11 (sentetik taranmış fixture). Doğrulanmış durum: `pnpm test` 314/314, `pnpm test:server` 9/9, `pnpm test:e2e` 4/4, `tsc --noUnusedLocals --noUnusedParameters` temiz. CI her PR'da ve `main`'e her push'ta `windows-latest` üzerinde `install --frozen-lockfile`, `typecheck`, `test`, `build`, `test:server`, `test:e2e` çalıştırır (~4 dk).

**Yeni ajana başlangıç adımları**
1. `git pull`; `pnpm install --frozen-lockfile`; `pnpm build`; `pnpm test` (~5 dk); gerekirse `pnpm test:server` ve `pnpm test:e2e` (ilk kez: `pnpm exec playwright install chromium`).
2. AGENTS.md (özellikle §10 test düzeni, §11 stil, §12 ortam, §13 değişmezler) ve bu bölümü okuyun. Tamamlanmış maddeleri yeniden yapmayın.
3. Her iş için önce yapılacakları ve doğrulama yolunu özetleyin; ayrı dal açın, PR ile ilerleyin. Commit, push, PR ve `main`'e birleştirme kullanıcı onayıyla yapılır; PR/push sonrası CI sonucu takip edilip bildirilir.

**Açık işler — önerilen sıra**
1. ~~**Cevap anahtarının yarısının düşmesi**~~ **(kapandı)**: `answerKeyPageText` (`lib/pdf-layout.ts`) başlığı, kendinden önce gelen tüm "N. X" satırlarının üstündeyse metnin başına alır; `convertPDF` anahtar sayfasında bunu kullanır. Fixture anahtarı 24/24; `pnpm reference` sonuçları değişmedi.
2. **Kapak tablosundan bölüm çıkmaması (madde 25 açık 2, OCR sınırı).** PSM 11 SAYFA sütunundaki tek haneli sayıları (2–5) okumuyor; `tableSections` (`lib/pdf-layout.ts`) her satır için sayfa numarası istediğinden bölüm üretmiyor. Seçenekler: SAYFA sütunu bandını hedefli OCR ile (rakam beyaz listesi, PSM 6) yeniden okumak (anahtar kurtarmasına benzer) ya da SAYFA sütunu tümüyle boşsa satırların yukarıdan aşağı sırasını kullanmak. İkincisi daha basit ama kapak satır sırasının bölüm sırası olduğunu varsayar; karar kullanıcıyla verilmeli. Düzelince fixture testine "4 bölüm × 6" beklentisi eklenir.
3. **Sütun sonundaki numarasız sorular (madde 25 açık 3, politika sınırı).** Numaraları OCR'da hiç olmayan sorular sütunun sonundaysa ve sonraki numara bir sonraki sayfadaysa `assignGroupNumbers` çıkarım yapmaz; önceki soru blokları yutup şıksız kalır (uyarılı, sessiz değil). Sayfalar arası çıkarım politika değişikliğidir; kullanıcıyla konuşulmadan yapılmamalı.
4. **Madde 23'ün kalanı: düzenleyici durumu.** `app/page.tsx` (~71 KB) içinde `Home` bileşeni ve düzenleyici görünümünün ~22 KB'lık tek satırlık JSX'i kaldı; onlarca `Home` durumuna ve işleyicisine bağlı. Birebir taşıma yetmez; önce durumun bir kanca (`useEditor`) ya da bağlam altında toplanması tasarlanmalı. Artık Playwright testleri var; bu işte arayüz akışını onlarla da doğrulayın ve gerekirse düzenleyici için yeni e2e senaryosu ekleyin.
5. **Playwright kapsamını genişletme.** Henüz kapsanmayanlar: bölüm ekranı ve özeti, erişim ayarındaki `datetime-local` zamanlama (saat dilimi), mobil görünüm, düzenleyicide yayınlama akışı (testler sınavı API ile oluşturur), sınav güncelleme/silme/geri alma arayüzü.
6. **Aşama 5 dışı borçlar** (ayrıntı: AGENTS.md §14): sınav listesi sayfalama (100 sınır), sonuç paneli için indeksli tablo (5000/3000 sınırı), `.xlsx` dışa aktarma, oturum listesi (şema değişikliği gerekir), sürüm geçmişi ve kalıcı silme, `Origin` uyuşmazlığının 403'e çevrilmesi, `app/globals.css` (~47 KB) bölme.
7. **Küçük bakım:** CI'da `pnpm/action-setup@v4` eski Node 20 çalışma zamanını hedeflediği için uyarı veriyor (iş geçiyor); Node 24 destekli sürüm çıkınca yükseltin.

**Gözlemler (tekrar ederse incelenmeli):** Bir kez yerelde `pnpm test:server` sunucu sağlıklıyken 20 dakikadan uzun takıldı; yeniden koşunca 36 sn'de geçti, CI'da hiç görülmedi, neden bulunamadı. CSV testindeki ara sıra kalma (#8) gerçek bir sıralama belirsizliğiydi ve düzeltildi; benzer "aynı milisaniye" varsayımları başka testlerde de olabilir.

**Repoda olmayanlar (yerelde kalır):** `.env`, `data/`, `.test-tmp/` (gerçek sertifika PDF'i ve ölçüm betikleri dahil). Sertifika üzerindeki son ölçüm: 120/120 soru yuvası, 8 bölüm × 15, anahtar 120/120, **7 yer tutucu ve ~15 boş şıklı soru** (OCR'ın hiç okumadığı içerik; öğretmen elle tamamlar). Referans PDF'ler (`pnpm reference`) 50/50; Aşama 5 boyunca dönüşüm hattına dokunulmadı.

## Doğrulanamayanlar

- Düzenleyicide yayınlama akışı ve düzenleyici araçları gerçek tarayıcıda otomatik sınanmıyor (PDF yükleme ve düzenleyiciye dönüşüm Playwright ile sınanıyor).
- AI kalite kontrolü (ücretli dış çağrı yapılmadı).
- Mobil/dokunmatik görünüm, çift tıklamalı `.cmd` başlatıcılar ve harici sunucu (ters vekil) dağıtımı.
