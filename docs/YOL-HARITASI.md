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

## Önerilen sıra

| Aşama | Kapsam | Maddeler | Doğrulama |
|---|---|---|---|
| 1 — Güvenlik yaması | Sonuç yanıtı ayarı, hız sınırı, deneme belirteci, kilit, Origin, başlıklar | 1–5, 13 | Yeni `result-leak-regression.mjs`; `pnpm test:server` |
| 2 — Öğrenci deneyimi | Sonuç ekranı, numara, tekrar giriş, sunucu tarafı süre, Enter | 13–16 | React/SSR testi + tarayıcı |
| 3 — Dönüşüm doğruluğu | Sessiz eşleşme kapısı, ızgara şık, bölüm başlığı, beklenen sayı, anahtar sayfası | 6–11 | Sentetik fixture + `pnpm reference` (bu PDF hedefi: ≥115/120 soru, 0 uyarısız yanlış eşleşme) |
| 4 — Panel | Güncelle/sil/kapat, sonuç analizi ve dışa aktarma, durum kodları | 18–22 | API regresyonu + `test:server` |
| 5 — Borç | page.tsx bölme, Playwright | 23–25 | Tüm paket |

## Doğrulanamayanlar

- Gerçek tarayıcıda PDF yükleme ve düzenleyici arayüzü (tarayıcı panelinde dosya yükleme aracı yok). Dönüşüm aynı hattan Node'da koşuldu.
- AI kalite kontrolü (ücretli dış çağrı yapılmadı).
- Bu bilgisayarda `pnpm build` yeniden çalıştırılmadı. Yoklamada kullanılan `.next/standalone`, `app/` ve `lib/` kaynaklarıyla eşdeğer (sonradan değişen tek dosya `lib/initial-account.ts`, ve o özellik derlemede mevcut).
