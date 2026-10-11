# FAZ 3C-3 raporu — Sıra duyarlı şık onarımı ve hedefli numara OCR deneyi

Tarih: 9 Ekim 2026. Başlangıç: Site v22, commit a7c815a1855459c4851c3c3336a73121d8ea3dac. Kapsam: yalnız kullanıcı tarafından verilen yeni 3C-3; eski sayfa sınıflandırma 3C-3'ü, 3C-4 ve 3D–3F uygulanmadı. Önceki sınavlar değiştirilmedi; veri göçü yapılmadı.

**Sonuç:** Üretimde numara 46/50 korunuyor; beş farklı şık harfi 18 → **40**. 24 soru / 29 harf sıra çıkarımıyla işaretli. Bu, bütün metinlerin kusursuz olduğu anlamına gelmez: 40 sorudan 39'unda beş şık metni de dolu; 39. sorunun C metni önceden boştu. Öğrenci/AI kırmızı temizliği korunuyor. Hedefli OCR deneyinde temel gerçek taramada 7 ve 23 için geçerli aday geldi; bu **48 tamamlanmış soru** kanıtı değildir. Deney üretime eklenmedi.

## 3C-3-0 — Eski kayıt güvenliği ve 13 eksik Tapu numarası

Bulgu: Kırmızı silme PDF dönüşümünde/elle kırpmada/AI görüntüsü hazırlanırken yapılır. Öğrenci API'si sunum anında piksel silmez: kaynak imzasına bağlı güvenli varyantı seçer. İmzasız veya değişmiş soru/kapak görseli gönderilmez; kaynağa doğrudan asset isteği öğretmen yetkisi ister. v22 öncesi 3C-1 kaynakta taranmış soru görselleri bağlanmıyordu; kapaklar da güvenli bağlantı taşımıyordu. Bu tür eski görseller v22 sunumunda temizlenmiş olarak gösterilmez, **gizlenir**. Eski dijital görsellerin mevcut güvenli bağları korunur.

Kanıt: lib/quiz.ts protectedImages/protectedInstructionImages/studentExam, lib/assets.ts saveAssets ve app/api/exams/[id]/route.ts allowlist incelendi; imzasız eski tarama fixture'ı öğrenci gövdesi/şık/kapak projeksiyonunda sıfır görselle geçti. Canlı R2 kayıtları tek tek okunmadı; bütün eski kayıtların güvenli olduğunu iddia etmiyoruz. Önceden yanlış güvenli olarak işaretlenmiş veya daha önce dışarı alınmış görseller için bu inceleme garanti vermez.

Öneri (uygulanmadı): Eski kayıtları sürüm/okuma türüne göre denetlemek, öğretmen hesabında kaynak görsellerden v22 temiz varyantlarını üretip yeniden bağlamak ve sanitizasyon sürümünü kaydetmek; başarı doğrulanmadan eski görseli öğrenciye açmamak. Sunum sırasında canvas gerektiren dönüştürme Worker ortamına yeni native bağımlılık getirileceğinden burada eklenmedi. Öğretmen onaylı tarayıcıda yeniden bağlama daha hafif alternatiftir. Veri göçü yok.

Tapu 144-OCR'de eksik 13 numara (digital ground truth konumlarıyla):

| No | Sayfa/sütun | Numara bölgesindeki ham token ve güven | Eleme/eksiklik |
| --- | --- | --- | --- |
| 2 | 2/left | İlişkisel (%94.0); tablonun (%96.1) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 3 | 2/left | Veritabanı (%58.2); aşağıdakilerden (%95.9) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 4 | 2/left | Aşağıdaki (%70.9); tablo (%95.1) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 5 | 2/left | Bir (%97.0); arasında, (%96.6) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 6 | 2/left | Update (%93.3) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 8 | 2/right | SQL (%96.0); sıralanışı (%96.9) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 9 | 2/right | Programlama (%95.6); fonksiyon (%96.7) | Numara konumunda rakam kutusu yok; gövde sözcükleri var |
| 13 | 3/left | 13, (%89.9) | Virgüllü numara; soru regex nokta/paren bekliyor |
| 27 | 5/right | 27. (%92.1) | Numara kabul edildi; şık 0 → şıksız blok olarak ayrıldı |
| 30 | 6/left | 30, (%90.4) | Virgüllü numara; soru regex nokta/paren bekliyor |
| 38 | 7/left | 3B. (%87.9) | 38 → 3B.; sayısal regex eşleşmiyor |
| 47 | 8/left | 47. (%91.7); Aşağıdakilerden (%94.9); bileşenidir? (%95.4) | Numara kabul edildi; şık 0 → şıksız blok olarak ayrıldı |
| 50 | 8/left | 50, (%81.0); Bir (%97.0); bahsedilmekte: (%68.3) | Virgüllü numara; soru regex nokta/paren bekliyor |

Başka yerdeki çıplak 6/13 tokenleri soru numarası konumunda değildir; sadece metinde aynı sayının görülmesi yeterli sayılmadı. 27 ve 47 regex tarafından reddedilmedi: son dönüşümde şık bulunamadığından ayrıldı. Bu bölümde numara kabulü düzeltilmedi. Kanıt: tapu-missing13.json, ham OCR kutuları ve eleme zinciri.

## 3C-3a — Şık onarımı

Bulgu: © için sayfa genelinde C eşleyen eski kural yanlış soru/sıra bağlamına taşabiliyordu. Bu eşleme kaldırıldı. Yeni kural tek kabul edilmiş soru içinde güvenilir şık-sol-kenar kümesinin medyanını ve harf sırasını kullanır. C çıkarımı B/D gibi komşulardan gelir; aynı sembol başka sırada E olabilir. Sembol beyaz listesi yok.

Geometri: yatay tolerans max(medyan glyph genişliği ×0,6; medyan şık satır yüksekliği ×0,35). İki güvenilir komşunun harf aralığı tam 2 olmalı; arada kenara yakın tek aday aranır. Sayısal/monospace aday reddedilir. Kısa (≤3) marker öneki ayrılır; işaretsiz uzun sözcükle başlayan adayın ilk sözcüğü korunur. Derin girintili devam satırı aday değildir; iki olası aday varsa onarım yok. Baş/son A/E (Tapu için A/D) onarımı en az üç ardışık güvenilir harf ve medyan satır aralığının 0,55–1,5 katı ile sınırlıdır; son harf sütundaki mevcut E kanıtından belirlenir. Şüpheli blokta otomatik harf tahmini zorlanmaz.

Şık ve metni ayrı OCR satırıysa y başlangıcı aynı satırın üstüne oturtulur; başka şık marker'ı önceki şık metnine katılmaz. Alt bölgede geometrik şık adayı © gibi alt bilgi sanılıp kırpmayı kesmez. Dijital satırlarda bu onarım çalışmaz. 3C-1 sütun/numara kabul algoritması değiştirilmedi.

| Metrik | v22 | Sonuç |
| --- | --- | --- |
| Gerçek tarama numara | 46/50 | 46/50 |
| Doğru sayfa/sütun | 46 | 46 |
| Yanlış sayfa/sütun/fazla/tekrar | 0/0/0/0 | 0/0/0/0 |
| Beş farklı harf | 18 | 40 |
| Sıra çıkarımı işaretli soru/harf | 0/0 | 24/29 |
| Yeni şık yanlış pozitifi | — | 0 (ölçülen örneklerde) |
| Dijital Tapu | 50/50; 4 şık; OCR 0 | Aynı |
| Tapu 144 OCR | 37/50; 105/200 harf | Aynı |
| Tapu CER/WER | %13,48 / %27,90 | Aynı |
| Gerçek OCR ms/sayfa | 2170.98 | 2022.24 (%-6.85) |

OCR süre kanıtı: aynı oturumda iki ardışık gerçek OCR çalıştırması, tek worker, 11 gerçek sayfa çağrısı; bütün giriş PNG SHA256 ve setParameters çağrıları birebir aynı. Parametreler: tesseract.js 5.1.1, tur+eng/OEM1, PSM11, render 144 DPI/scale2, user_defined_dpi150; global kırmızı silme yok. Kodun son ekleri de aynı ham OCR kayıtlarıyla yeniden tam dönüşümden geçirildi; replay süreleri performans sayılmadı. Tek koşu doğal zamanlama gürültüsü içerir; %6,85 hızlanma bir optimizasyon iddiası değildir, süre sınırı aşılmadı. Worker başlangıcı 470.80 → 607.62 ms; Node tepe RSS 2387.68 → 2514.66 MiB. Bunlar bütün ölçüm süreci/canvas ve görsel çıktı dahil, tarayıcı bellek ölçümü değildir.

Sayfa/sütun dağılımı:

| Sayfa | Sol bulunan | Sağ bulunan | Sol eksik | Sağ eksik |
| --- | --- | --- | --- | --- |
| 3 | 1, 2, 3, 4 | 6, 8 | — | 5, 7 |
| 4 | 9, 10, 11, 12, 13 | 14, 15, 16, 17 | — | — |
| 5 | 18, 19, 20 | 22, 24 | 21 | 23 |
| 6 | 25, 26, 27 | 28, 29, 30 | — | — |
| 7 | 31, 32, 33, 34 | 35, 36 | — | — |
| 8 | 37 | 38 | — | — |
| 9 | 39 | 40, 41, 42 | — | — |
| 10 | 43, 44 | 45, 46 | — | — |
| 11 | 47, 48 | 49, 50 | — | — |

Soru başına harf ve çıkarımlar:

| Soru | Sayfa/sütun | Önce → sonra farklı harf | Çıkarım harfleri |
| --- | --- | --- | --- |
| 1 | 3/left | 3 → 5 | A, E |
| 2 | 3/left | 4 → 5 | D |
| 3 | 3/left | 4 → 5 | B |
| 4 | 3/left | 4 → 4 | — |
| 6 | 3/right | 4 → 4 | — |
| 8 | 3/right | 4 → 5 | D |
| 9 | 4/left | 2 → 5 | C, A, E |
| 10 | 4/left | 5 → 5 | — |
| 11 | 4/left | 5 → 5 | — |
| 12 | 4/left | 5 → 5 | — |
| 13 | 4/left | 5 → 5 | — |
| 14 | 4/right | 5 → 5 | — |
| 15 | 4/right | 5 → 5 | — |
| 16 | 4/right | 2 → 2 | — |
| 17 | 4/right | 3 → 3 | — |
| 18 | 5/left | 5 → 5 | — |
| 19 | 5/left | 5 → 5 | — |
| 20 | 5/left | 5 → 5 | — |
| 22 | 5/right | 5 → 5 | — |
| 24 | 5/right | 5 → 5 | — |
| 25 | 6/left | 4 → 4 | — |
| 26 | 6/left | 4 → 5 | C |
| 27 | 6/left | 5 → 5 | C |
| 28 | 6/right | 5 → 5 | — |
| 29 | 6/right | 5 → 5 | — |
| 30 | 6/right | 5 → 5 | — |
| 31 | 7/left | 4 → 5 | C |
| 32 | 7/left | 4 → 5 | C |
| 33 | 7/left | 5 → 5 | — |
| 34 | 7/left | 4 → 5 | C |
| 35 | 7/right | 4 → 5 | C |
| 36 | 7/right | 4 → 5 | C |
| 37 | 8/left | 4 → 5 | C |
| 38 | 8/right | 4 → 5 | C |
| 39 | 9/left | 5 → 4 | — |
| 40 | 9/right | 5 → 5 | — |
| 41 | 9/right | 4 → 5 | C |
| 42 | 9/right | 4 → 5 | C |
| 43 | 10/left | 4 → 5 | C |
| 44 | 10/left | 4 → 5 | C |
| 45 | 10/right | 3 → 5 | C, A, E |
| 46 | 10/right | 4 → 5 | C |
| 47 | 11/left | 4 → 5 | C |
| 48 | 11/left | 4 → 5 | C |
| 49 | 11/right | 4 → 5 | C |
| 50 | 11/right | 4 → 5 | C |

Özel durumlar:

| Soru | Ham marker / durum | Karar |
| --- | --- | --- |
| 1 | a, ve gi.; B/C/D güvenilir | A ve E sıradan çıkarıldı; kod metni k++; / ++k; vb. korunuyor |
| 2 | ©. int switch; | C/E arasında D çıkarımı |
| 3 | bp. Derleyici | A/C arasında B çıkarımı |
| 4 | gWw (kırmızıyla örtülü C + \n birleşmiş) | Anlamlı şık metni/ayrı satır kanıtı yok; onarım yok |
| 6 | Kaba kod x≈0,598; şık kenarı≈0,577 | Sol kenar toleransı dışında; A zorlanmadı. Kayıp 7 yüzünden ikinci şık grubu aynı numaralı blokta; numara sınırı değişmedi |
| 8 | € foreach | C/E arasında D çıkarımı |
| 9 | a; -; e, ve ayrı şekil/açıklama satırları | A/C/E çıkarımı; 5 harf, şekil kırpmaları korunuyor. Çizim doğruluğu yalnız harf sayısından çıkarılamaz |
| 16 | Gc.; G15; V.1213/3-13... | Yalnız A/B güvenilir; sıralı üst komşu yok, 2 harf korunuyor |
| 17 | -dToolbow; . Table | A/B/C sonrası belirsiz D/E ve farklı x; 3 harf, onarım yok |
| 45 | ay; ©) ... ©) | A/C/E çıkarımı; 10/15/20/30/60 işgünü ayrı şıklarda, sembol→C tablosu yok |

Genelleme (aynı ham kutular, önce/sonra parser; OCR performansı değildir):

| Varyasyon | Tarama beş harf önce → sonra | Tapu son soru önce → sonra | Yeni yanlış pozitif |
| --- | --- | --- | --- |
| shift-minus3 | 23 → 35 | 39 → 39 | 0 |
| shift-plus3 | 18 → 36 | 45 → 45 | 0 |
| skew-minus1 | 17 → 40 | 45 → 45 | 0 |
| skew-plus1 | 12 → 37 | 49 → 49 | 0 |
| margin-inset | 11 → 34 | 38 → 38 | 0 |
| margin-outset | 24 → 39 | 43 → 43 | 0 |
| combined | 16 → 37 | 37 → 37 | 0 |

Tapu temel/sentetik kırmızılı örnekte onarım uygulanmadı; son soru 37/50 ve kırmızılı örnekte 32 benzersiz/33 soru değişmedi. Kırmızılı örnekte önceden mevcut 24. soruda 5 harf (referans 4) ve bir numara tekrarı var; bunlar giderilmiş sayılmadı. Yeni onarımın ürettiği fazla şık, sıra bozukluğu, boş çıkarım veya devam satırını şık yapma sayısı 0. Bu sayı ölçülen corpus/negatif testlerle sınırlıdır; bütün olası PDF'ler için garanti değildir. Çok satırlı gerçek 28–36'da yeni onarım olmadan korunanlar ve C eklenenler sıra/metin karşılaştırmasıyla denetlendi.

Elle kontrol: LCG seed3103 ile sıralanıp ilk 10 soru seçildi; 5'i onarılan. Kaynak kırpma solda, çıkarılan metin sağda PNG'lerde incelendi.

| Soru | Onarım | Görsel karşılaştırma sonucu |
| --- | --- | --- |
| 38 | C | A–E doğru bölünmüş; eski OCR kelime/boşluk hataları var |
| 39 | Yok | C metni önceden boş; görsel var. Tam metin başarısı denmedi |
| 11 | Yok | B üstü kalem, Geri dönüşsüz yanlış OCR; bu aşamada düzeltilmedi |
| 49 | C | Sıra ve çok satırlı içerik doğru; B/C içinde eski OCR yazım hataları var |
| 27 | C | 5 şık, çok satırlı C/D/E metni doğru şıkta |
| 45 | A/C/E | 10/15/20/30/60 ayrı, D/E metin tekrarı yok |
| 30 | Yok | 5 şık kaynakla uyuşuyor |
| 44 | C | Hatay metni önceki şıktan ayrıldı; diğer çok satırlı şıklar korunuyor |
| 29 | Yok | 5 çok satırlı şık kaynakla uyuşuyor |
| 24 | Yok | Int32/Sbyte/Long/Ulong/Bool; eski OCR küçük harf/nokta hataları sürüyor |

## 3C-3b — Yalnız ölçüm: numara şeridi

Bulgu: sadece kabul edilmiş n−1/n+1 arasındaki boşluklar ölçüldü. Sütun/sayfa geçişinde önceki sütunun altı ve sonraki sütunun üstü ayrı şeritlerdir. Anchor mevcut numara x medyanı; şerit solda 1,2 glyph pay ve 5,5 glyph genişlik. Bölge 300 DPI render; sadece bölgedeki kırmızı RGB farkı >35 beyaza silinir. Tam sayfa girişine dokunulmaz. Çıplak sayı yalnız beklenen n, anchor (1,5 glyph) ve aynı OCR satırında sağda harfli metin koşullarında geçer. Dil/PSM/DPI hint aynı kaldı. Boşluk onarımı veya çıkarımla 5 numarası üretime eklenmedi.

| No | Sayfa/sütun | 300 DPI yerel ham çıktı | Güven/karar |
| --- | --- | --- | --- |
| 5 | 3/sağ | >. C prog... | Rakam yok; kabul edilmedi |
| 7 | 3/sağ | 7. Aşağıd... | %83,91; beklenen/anchor/satır metni geçti |
| 21 | 5/sol | 22 CH... | 21 yerine 22; beklenmeyen sayı reddedildi |
| 23 | 5/sağ | 23 55 sa... | %96,89; noktasız ama beklenen/anchor/satır metni geçti |

Temel gerçek şerit OCR+render 2157.94 ms; yeniden kullanılacak worker varsayımıyla son gerçek tam sayfa OCR süresine göre +%9.70. Ayrı deney worker'ı soğuk başlatılırsa +%11.92; başlangıç maliyeti saklanmadı. Eski 3C-2 kaydına göre ilk +%9,47 idi. Deney yalnız marker kazancıdır: 7'nin önce 6'ya karışmış gövdesinin bölünmesi ve tam soru/şık montajı uygulanmadı. Mevcut 46 soru ve şekilli 9 değişmedi/silinmedi.

Varyasyonlarda gerçek OCR sonuçları; süre paydası her varyasyon için ayrı güncel tam sayfa ölçümü değildir, aynı türün güncel temel ölçümüdür:

| Girdi/varyasyon | Geçerli yeni marker adayları | Yanlış konum/numara | Ek OCR+render ms | Güncel temel süreye oran |
| --- | --- | --- | --- | --- |
| real/base | 7, 23 | 0 | 2157.94 | +%9.70 |
| real/shift-minus3 | 7, 23 | 0 | 2302.17 | +%10.35 |
| real/shift-plus3 | 5, 7, 21, 23 | 0 | 2110.47 | +%9.49 |
| real/skew-minus1 | 5, 7, 21, 23 | 0 | 2722.97 | +%12.24 |
| real/skew-plus1 | 7, 9, 21, 23 | 0 | 3873.45 | +%17.41 |
| real/margin-inset | 7, 21, 23 | 0 | 2223.72 | +%10.00 |
| real/margin-outset | 7, 21, 23 | 0 | 2245.11 | +%10.09 |
| real/combined | 7, 21, 23 | 0 | 2393.40 | +%10.76 |
| tapu/base | 47 | 0 | 2280.61 | +%5.33 |
| tapu/shift-minus3 | — | 0 | 1090.09 | +%2.55 |
| tapu/shift-plus3 | — | 0 | 1884.25 | +%4.40 |
| tapu/skew-minus1 | — | 0 | 2292.84 | +%5.36 |
| tapu/skew-plus1 | — | 0 | 880.33 | +%2.06 |
| tapu/margin-inset | 49 | 0 | 2168.48 | +%5.07 |
| tapu/margin-outset | 47 | 0 | 2465.24 | +%5.76 |
| tapu/combined | 44 | 0 | 2596.14 | +%6.07 |

Sıralı komşuların ikisi de mevcut değilse çalışma atlandı: temel Tapu'da 2,3,4,5,6,8,9,50. Temel Tapu 47 zaten ilk geçişte marker olarak kabul edilmiş ama şıksız blok olduğundan son sorularda yoktu; yeniden marker okunması 38 tamamlanmış soruyu kanıtlamaz. Sayfa/sütun ve gerçek numara koordinatlarıyla ikinci geçiş adayları değerlendirildi; beklenmeyen veya yanlış konumda kabul 0. Gerçek kayma/eğiklikte bazı ek numaralar döndü; çıktıyı belirli tek tarama sonucuna sabitlemedik.

5 için öneri: sayfa3 sağ üstte C programlama dili için printf ile ekrana… gövdesi ve altında a–e grubu var. Yaklaşık y0,13–0,28 blok, sonraki 6 marker y0,33; arada belirgin boşluk. 4 sol sütunun sonundadır; sayfa genelinde 4 ile 6'nın y aralığı kullanılmamalı. Sağ sütun başlangıcında ayrı blok var, fakat basılı 5 için temel yerel OCR güvenilir rakam vermedi. Öğretmen onaylı sıra çıkarımı etiketiyle 5 önerilebilir; uygulanmadı.

**Üretime ekleme önerisi:** kazanç var, fakat numara şeridi genişliği/render ve worker yeniden kullanımı ölçümüne göre süre sınırı bazı varyasyonlarda %10'u aşıyor. Soğuk worker ayrıca pahalı; henüz tam soru montajı doğrulanmış değil. 3C-3b'yi şık onarımıyla birlikte şimdi kalıcı yapmayı önermiyorum. Önce mevcut worker/render önbelleğiyle dar şeridi ölçmek ve mevcut sorulara dokunmadan tam aday soru taslağını öğretmene göstermek gerekir. Bu aşamada yalnız betik/kanıt sağlandı.

## Güvenlik, test, boyut ve sonuç

| Kontrol | Sonuç |
| --- | --- |
| pnpm test | 110 geçti / 0 başarısız / 4 atlandı (114 test) |
| Eski 21 regresyon | İlk quiz paketi 24/24; tail 4 kontrol de geçti |
| pnpm test:ocr | Gerçek OCR önce/sonra + son sürüm hash kontrollü replay; dijital 50/50/OCR0, sentetik 37/50 |
| Öğrenci gerçek API görseli | 269; max kırmızı %0.000071005 (<%0,01) |
| Öğrenci sentetik API görseli | 20; max kırmızı %0.000000000 |
| AI/öğretmen/önizleme/paylaşım | 3C-2 testleri geçti; orijinal öğrenciye kapalı, AI temiz görsel; React/API düzeyinde |
| TypeScript/diff/build | tsc --noEmit --incremental false, git diff --check, production build geçti |
| Yeni bağımlılık/vendor artışı | 0; toplam vendor 25370621 bayt, lock/dependencies aynı |
| Ana sayfa JS | 172084 → 174531 bayt; gzip 53911 → 54702 (+791) |
| İlk tarayıcı yükleme süresi | Ölçülmedi; worker başlangıcı tarayıcı ilk yükleme değildir |

Atlanan dört test başka 80-soru/referans PDF'leri gerektiriyor; verilen Tapu ve gerçek tarama testleri çalıştırıldı. Gerçek tarayıcı otomasyon kontrolü yapılamadı; API/React paylaşım ve önizleme kontrolleri geçti. Windows/SQLite yerel paket çalıştırılması ve 100 sayfa bellek dayanıklılığı test edilmedi. Başka dil/PSM/DPI veya 3D güven puanı/düzeltme eklenmedi.

Değişen dosyalar: lib/pdf-layout.ts, package.json, scripts/ocr/README.md, scripts/ocr/diagnose-sequence.mjs, scripts/ocr/measure-gaps.mjs, tests/red-ink-regression.mjs, tests/option-sequence-regression.mjs, docs/phase3c3.md. Üretim davranışı yalnız lib/pdf-layout.ts içinde; ölçüm deneyleri scripts/ocr altında. lib/pdf-import.ts, lib/quiz.ts, lib/assets.ts, app/page.tsx ve vendor/lock v22 ile aynı; OCR/öğrenci/AI görsel güvenliği kodu değişmedi. Rapor docs/phase3c3.md olarak da kaynakta.

Kabul değerlendirmesi: gerçek 46 numara bozulmadı, beş harf 40 ≥30, yanlış sayfa/sütun/fazla/tekrar 0; yeni şık onarımı yanlış pozitifi 0; dijital/sentetik temel regresyonlar ve güvenlik testleri geçti, OCR süre sınırı içinde, vendor0. Kırmızılı sentetik örneğin önceden var olan fazla şık/tekrar hatası hâlâ var; bütün corpus'un kusursuz olduğunu söylemiyoruz. Hedefli numara OCR'ı yalnız deneydir ve üretim için onaylı değildir. 3C-3 sonunda duruldu.
