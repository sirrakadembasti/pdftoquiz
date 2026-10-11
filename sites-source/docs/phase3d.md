# Faz 3D — Güven, yedek ve öğrenciye güvenilir gösterim

10 Ekim 2026 · sürüm 2.0.10 · temel kaynak v24 / aeff91ddc858def0c3135f8815a199ed73bd2ba2.

**Sonuç: 48 okunmuş soru + 2 OKUNAMADI yer tutucusu = 50 kayıt.** 5 ve 21 OCR ile okunmuş sayılmıyor. Her kayıtta A–E yuvası var. Gerçekte beş harfi çözülen soru 43; 43→50 doğruluk artışı iddia edilmiyor. Uyarılı 42 soru görselle açılıyor; önceki görsel tercihi korunduğundan bu PDF’de diğer 8 soru da görselle açılıyor. Tam soru görseli yanında yalnız kompakt A–E seçim düğmeleri var. Yer tutucuların öğretmen onayı olmadan paylaşımı engelli. 3E/3F’ye geçilmedi.

## 3D-0 — Kod değişikliği öncesi doğrulama

v24 ölçüm kaydı, aynı kaynakla ham OCR sonuçlarından tekrar yürütüldü: 48 kayıt, 43 beş farklı harf, 28 sıra çıkarımlı soru, 33 şüpheli. Bu tekrar yürütme hız ölçümü değildir; OCR çıktısı kayıtlıdır ve hedefli bölge bütçesi ölçüm adaptöründe genişletilmiştir. Ardından v24 ve yeni kaynakla ayrı gerçek OCR çalıştırmaları yapıldı.

| Gösterge | Kullanıcı ekranı (önceki v23) | v24 Node doğrulama |
|---|---:|---:|
| Soru | 46 | 48 |
| Beş farklı harf | 41 | 43 |
| Şüpheli | 12 | 33 |
| Eksik numara | 5, 7, 21, 23 | 5, 21 |

12/32/33 farkı yalnız tarayıcı/Node farkına bağlanamaz: ekran v23’teki dönüşümden, yeni ölçüm v24’tendir; sıra çıkarımı ve hedefli OCR uyarıları da sayımı etkiler. Aynı PDF’nin browser/Node rasterleri farklıdır (önceki kanıt: sayfa3 kırmızı piksel5303/5290, sayfa5 4910/4940). Aynı dönüşümün ham browser kutuları yok; farkın tek nedeni kanıtlanmadı. Bu ortamda gerçek browser dönüşümü çalıştırılmadı.

Özetin şüpheli sayısı soru uyarı metinleri + algılanan şık<4 + boş şık içeriği + yinelenen şık metni üzerinden hesaplanıyordu. Alan provenance kodları aynı sayaç değildir: LOCAL_WARNING genel bir koddur; RED_CONTENT_REVIEW sayfa/alan kontrolünü anlatır; NO_ANSWER_KEY tüm48 sorudadır ama şüpheli OCR sayısına/AI onarımına tek başına eklenmez. Soru16’da q.warnings boşken detectedOptions=2 olduğu için özet şüpheli sayar. Ayrı kodlu CODE_CONTENT veya kelime/satırdan soru okuma puanı v24’te yoktu. Sayfa güvenleri soru metni doğruluğu anlamına gelmez.

| Neden (örtüşen gruplar) | Sorular / sayı |
|---|---|
| Sıra çıkarımı | 28 soru |
| Hedefli OCR | 7, 23 / 2 |
| Eksik harf veya içerik | 6, 16, 23, 25, 39 / 5 |
| Birleşim | 33 soru |

v24’te öğrenci güvenli gövde görseli veya metin gösterilir; şık metin/görselleri ayrıca daima gösterilirdi. image seçeneği kapalıysa OCR metni gösterilir. Öğretmen orijinal kırpmayı görür; öğrencinin img alanı bağlı güvenli varyanttır.

| Soru | v24 gövde görseli | Bulgu | Yeni gösterim |
|---|---|---|---|
| 7 | Kod ve A–D şıklarını kapsıyor, E aşağıda | Şık tekrarı + eksik görsel kuyruğu riski | Tam soru/kod/A–E, yalnız harf düğmeleri |
| 9 | Yalnız gövde; şekiller şık görsellerinde | Şekilli beş şık ayrı kırpmalarda | Tam soru/şekiller/A–E, yalnız harf düğmeleri |
| 16 | Gövde; şıklar dışında | Yalnız A/B; C–E ifadeleri B’ye karışmış | Tam soru görseli; C/D/E boş metin yuvaları |
| 23 | Gövde; şıklar dışında | A/B/E; C/D kodu B içinde | Tam soru görseli; C/D boş metin yuvaları |
| 25 | Gövde/kod; şıklar dışında | C metni B içinde | Tam soru görseli; C boş metin yuvası |

Kaynakla gözle incelenen önce/sonra kırpmalar kanıt paketinde. Görsellerdeki metin kayıpları otomatik düzeltilmedi.

### v24’teki 33 şüpheli sorunun tam dökümü

| Soru | Özetin saydığı neden |
|---|---|
| 1 | Sıra çıkarımı: A şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Sıra çıkarımı: E şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 2 | Sıra çıkarımı: D şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 3 | Sıra çıkarımı: B şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 4 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 6 | En az bir şık metni/görseli algılanamadı. Şık içeriği eksik. |
| 7 | Sıra çıkarımı: A şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Hedefli OCR: numara sıra boşluğunda yeniden okundu; gövde ve şıkları kaynak görselinden kontrol edin. |
| 8 | Sıra çıkarımı: D şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 9 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Sıra çıkarımı: A şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Sıra çıkarımı: E şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 16 | 2 şık algılandı; 4/5 şıklı kaynakla karşılaştırın. |
| 17 | Sıra çıkarımı: D şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Sıra çıkarımı: E şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 22 | Sıra çıkarımı: A şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 23 | Hedefli OCR: numara sıra boşluğunda yeniden okundu; gövde ve şıkları kaynak görselinden kontrol edin. En az bir şık metni/görseli algılanamadı. 3 şık algılandı; 4/5 şıklı kaynakla karşılaştırın. Şık içeriği eksik. |
| 25 | En az bir şık metni/görseli algılanamadı. Şık içeriği eksik. |
| 26 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 27 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 31 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 32 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 34 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 35 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 36 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 37 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 38 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 39 | En az bir şık metni/görseli algılanamadı. Şık içeriği eksik. |
| 41 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 42 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 43 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 44 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 45 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Sıra çıkarımı: A şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. Sıra çıkarımı: E şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 46 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 47 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 48 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 49 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |
| 50 | Sıra çıkarımı: C şık harfi komşu şıklar ve sol kenar geometrisinden çıkarıldı; kaynak görselini kontrol edin. |

## Değişiklik → sonuç

**Yer tutucu:** aynı bölümde kabul edilmiş n−1/n+1 arasında tek numara boşluğu; yalnız OCR kaynaklı komşular, mevcut numara yok, üst sınır≤300 ve beklenen toplam sınırı. 3C-3’ün mevcut boşluk geometrisi yeniden kullanılır; birden fazla olası sayfa/sütun bölgesi veya yinelenen komşu varsa otomatik yerleştirme yapılmaz. Bölümler birbirine karıştırılmaz; mevcut dijital soru üzerine yer tutucu konmaz. Metin OKUNAMADI; cevap null; boş şıklar baskın OCR şık sayısı kadar. Orijinal ve beyaza temizlenmiş öğrenci kırpması mevcut imza/varlık erişim sistemiyle bağlanır.

| Yer tutucu | Kaynak | x / y / w / h (sayfa oranı) | Komşular |
|---|---|---|---|
| 5 | Sayfa 3, right | 0,51374 / 0,05500 / 0,46126 / 0,27739 | 4–6 |
| 21 | Sayfa 5, left | 0,02500 / 0,66186 / 0,47493 / 0,24814 | 20–22 |

Öğretmen silebilir, görselden/metni elle tamamlayabilir veya mevcut PDF alan seçimiyle yeniden kırpabilir. Açık “Kaynakla tamamladım, yer tutucuyu onayla” adımı var. Güvenli tam görselle öğretmenin görselden çözümü onaylaması da desteklenir; doğru cevap gereklidir. Sadece reviewed/cevap işaretlemek yer tutucu engelini kaldırmaz. Hibritte yer tutucunun metni otomatik uygulanmaz; AI çıktısı ayrı öneride kalır. Öğretmen onayıyla isQuestion kilitlenir.

**Şık yuvaları:** yalnız OCR soruları arasında baskın4/5 sayısı seçilir; bu taramada5. Eksik A–E metni boş kalır; hiç metin tahmini yok. detectedOptions korunur; “algılanan harf” ve “yuva” ayrı sayılır. Dijital soru dizileri değiştirilmez. Öğretmen onaylı AI şık dizisi kısalırsa eksik yuvalar boş tutulur. Taranmış soruların varsayılan görsel tercihi korunur; uyarılı olanlarda açık olur. Tam soru kırpmasının imageIncludesOptions bayrağı şık içeriğinin tekrarını önler. Öğretmenin görseli kapatması metin/şık yerleşimini geri getirir; elle seçilen yeni gövde kırpması varsayılan olarak şık içeriyor sayılmaz, öğretmen kontrolünü değiştirebilir.

**Okuma güveni:** 0–1 sinyal; UI’da0–100. Kelime ağırlığı=max(1,min(20,karakter uzunluğu)); W=kelime güvenlerinin bu ağırlıklarla ortalaması; L=kırpma içindeki gruplu OCR satır güvenlerinin aritmetik ortalaması. **S=.75W+.25L**. Bir tür güven verisi yoksa o tür için mevcut sayfa OCR güveni kullanılır; sayaçlar bunu gösterir. Yer tutucu0. S<.80 LOW_READING. Bu puan doğruluk yüzdesi/probabilite değildir; yüksek güvenli yanlış kelime mümkündür. Kod sinyali sözdizimi işaretlerinden alınır; kod veya Türkçe harf düzeltme tablosu/sözlük yok.

| Yeni soru kodu | Soru sayısı (örtüşebilir) |
|---|---:|
| SEQUENCE_INFERENCE | 28 |
| CODE_CONTENT | 18 |
| LOW_READING | 3 |
| UNREADABLE | 2 |
| MISSING_OPTION | 7 |
| TARGETED_OCR | 2 |

Bu taramada42 soru kalite kapısında; 10,13,19,28,29,30,33,40 hedefe gitmiyor. Yer tutucular ve sıra/şık/kod uyarıları ayrı nedenlerdir. NO_ANSWER_KEY veya sayfadaki küçük kırmızı pigment nedeniyle tüm sorulara AI çağrısı açılmaz. RED_CONTENT_REVIEW ve orijinal kontrolü sayfa/alan düzeyinde sürer. Gerçek AI çağrısı yapılmadı; mevcut hibrit gönderim onayı/alan kilitleri korunur. Dijital kalite kapısı değiştirilmedi. Yerel kontrol puanı yerine özetin açık şüpheli listesi ve nedenler öne çıkarıldı.

**Hata dayanıklılığı:** tek sayfa OCR hata/boş sonuç/zaman aşımı → ocr-failed sayfa, öğretmene orijinal+güvenli tam sayfa görseli geri alma listesinde; PDF alan seçimiyle soru ekleme. Sonraki sayfalar devam eder. Sayfa OCR üst süresi60s; motor ayarı değildir. Worker hatada/zaman aşımında sonlandırılır; tarayıcı fabrikası sıfırlanır. Geç tamamlanan worker oluşturma eski worker’ı geri yerleştiremez. Boş sonuçta sağlıklı worker yeniden kullanılır. Büyük kırpma byte sınırı800000 değişmedi: küçük JS canvas ile .64/.40/.25/.125 ölçekli tekrar denenir; uyarı eklenir. Elle alan seçiminin mevcut sınırı korunur.

## Kanıt — ölçüm tabloları

| Metrik | v24 gerçek OCR | Yeni gerçek OCR |
|---|---:|---:|
| Okunmuş soru / doğru sayfa-sütun | 48 / 48 | 48 / 48 |
| Yer tutucu / toplam | 0 / 48 | 2 / 50 |
| OCR ile hâlâ eksik | 5,21 | 5,21 |
| Yanlış sayfa / sütun / fazla / tekrar | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Beş harfi algılanan | 43 | 43 |
| A–E yuvası olan kayıt | 43 tam alan + kısmi | 50/50 |
| Uyarılı soru | 33 | 42 |
| Sıra çıkarımı | 28 | 28 |
| Düzeltilen OCR metinleri | — | 0 (48 soru metni ve mevcut şık metinleri birebir aynı) |
| Paylaşım | Anahtar/review eksik | Ek olarak5/21 yer tutucusu çözülmeden engelli |

| Sayfa | Sol okunmuş | Sağ okunmuş | Yer tutucu |
|---|---|---|---|
| 3 | 1, 2, 3, 4 | 6, 7, 8 | 5 (right) |
| 4 | 9, 10, 11, 12, 13 | 14, 15, 16, 17 | — |
| 5 | 18, 19, 20 | 22, 23, 24 | 21 (left) |
| 6 | 25, 26, 27 | 28, 29, 30 | — |
| 7 | 31, 32, 33, 34 | 35, 36 | — |
| 8 | 37 | 38 | — |
| 9 | 39 | 40, 41, 42 | — |
| 10 | 43, 44 | 45, 46 | — |
| 11 | 47, 48 | 49, 50 | — |

### Soru başına algılanan harf, yuva, boş metin ve güven

| Soru | Sayfa/sütun | Algılanan harf | Yuva | Boş şık metni/görseli | Sıra çıkarımı | Okuma sinyali /100 | Kodlar |
|---|---|---:|---:|---|---|---:|---|
| 1 | 3/left | 5 | 5 | — | A, E | 79,5 | SEQUENCE_INFERENCE, CODE_CONTENT, LOW_READING |
| 2 | 3/left | 5 | 5 | — | D | 93,0 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 3 | 3/left | 5 | 5 | — | B | 93,8 | SEQUENCE_INFERENCE |
| 4 | 3/left | 5 | 5 | — | C | 87,3 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 5 | 3/right | yer tutucu | 5 | A, B, C, D, E | — | 0,0 | UNREADABLE, MISSING_OPTION |
| 6 | 3/right | 4 | 5 | A | — | 94,0 | MISSING_OPTION |
| 7 | 3/right | 5 | 5 | — | A | 83,9 | SEQUENCE_INFERENCE, TARGETED_OCR, CODE_CONTENT |
| 8 | 3/right | 5 | 5 | — | D | 92,6 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 9 | 4/left | 5 | 5 | — | C, A, E | 86,2 | SEQUENCE_INFERENCE |
| 10 | 4/left | 5 | 5 | — | — | 85,7 | — |
| 11 | 4/left | 5 | 5 | — | — | 91,3 | CODE_CONTENT |
| 12 | 4/left | 5 | 5 | — | — | 94,0 | CODE_CONTENT |
| 13 | 4/left | 5 | 5 | — | — | 90,9 | — |
| 14 | 4/right | 5 | 5 | — | — | 84,7 | CODE_CONTENT |
| 15 | 4/right | 5 | 5 | — | — | 88,5 | CODE_CONTENT |
| 16 | 4/right | 2 | 5 | C, D, E | — | 74,2 | LOW_READING, MISSING_OPTION |
| 17 | 4/right | 5 | 5 | — | D, E | 89,6 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 18 | 5/left | 5 | 5 | — | — | 84,7 | CODE_CONTENT |
| 19 | 5/left | 5 | 5 | — | — | 88,7 | — |
| 20 | 5/left | 5 | 5 | — | — | 81,1 | CODE_CONTENT |
| 21 | 5/left | yer tutucu | 5 | A, B, C, D, E | — | 0,0 | UNREADABLE, MISSING_OPTION |
| 22 | 5/right | 5 | 5 | — | A | 92,2 | SEQUENCE_INFERENCE |
| 23 | 5/right | 3 | 5 | C, D | — | 77,6 | TARGETED_OCR, CODE_CONTENT, LOW_READING, MISSING_OPTION |
| 24 | 5/right | 5 | 5 | — | — | 85,4 | CODE_CONTENT |
| 25 | 6/left | 4 | 5 | C | — | 93,1 | MISSING_OPTION |
| 26 | 6/left | 5 | 5 | — | C | 95,3 | SEQUENCE_INFERENCE |
| 27 | 6/left | 5 | 5 | — | C | 92,4 | SEQUENCE_INFERENCE |
| 28 | 6/right | 5 | 5 | — | — | 93,0 | — |
| 29 | 6/right | 5 | 5 | — | — | 93,3 | — |
| 30 | 6/right | 5 | 5 | — | — | 94,5 | — |
| 31 | 7/left | 5 | 5 | — | C | 93,0 | SEQUENCE_INFERENCE |
| 32 | 7/left | 5 | 5 | — | C | 94,7 | SEQUENCE_INFERENCE |
| 33 | 7/left | 5 | 5 | — | — | 95,6 | — |
| 34 | 7/left | 5 | 5 | — | C | 90,9 | SEQUENCE_INFERENCE |
| 35 | 7/right | 5 | 5 | — | C | 94,1 | SEQUENCE_INFERENCE |
| 36 | 7/right | 5 | 5 | — | C | 94,6 | SEQUENCE_INFERENCE |
| 37 | 8/left | 5 | 5 | — | C | 93,2 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 38 | 8/right | 5 | 5 | — | C | 94,7 | SEQUENCE_INFERENCE |
| 39 | 9/left | 4 | 5 | C | — | 93,7 | CODE_CONTENT, MISSING_OPTION |
| 40 | 9/right | 5 | 5 | — | — | 95,2 | — |
| 41 | 9/right | 5 | 5 | — | C | 94,6 | SEQUENCE_INFERENCE |
| 42 | 9/right | 5 | 5 | — | C | 93,5 | SEQUENCE_INFERENCE |
| 43 | 10/left | 5 | 5 | — | C | 94,9 | SEQUENCE_INFERENCE |
| 44 | 10/left | 5 | 5 | — | C | 92,9 | SEQUENCE_INFERENCE |
| 45 | 10/right | 5 | 5 | — | C, A, E | 94,0 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 46 | 10/right | 5 | 5 | — | C | 94,6 | SEQUENCE_INFERENCE |
| 47 | 11/left | 5 | 5 | — | C | 95,6 | SEQUENCE_INFERENCE |
| 48 | 11/left | 5 | 5 | — | C | 94,2 | SEQUENCE_INFERENCE |
| 49 | 11/right | 5 | 5 | — | C | 94,4 | SEQUENCE_INFERENCE, CODE_CONTENT |
| 50 | 11/right | 5 | 5 | — | C | 95,0 | SEQUENCE_INFERENCE |

“Boş şık” OCR şık alanını anlatır; tam kaynak görselinde şık vardır ve öğrenci A–E seçebilir. Soru16/23/25 karışmış metinleri yeniden yazılmadı. Şık metni doğruluğu beş yuva sayısından çıkarılamaz.

| Regresyon / güvenlik | Kanıt |
|---|---|
| Dijital Tapu | 50/50, tümü4 şık, OCR callback0 / worker0 |
| Sentetik Tapu | 37 okunmuş + 2 yer tutucu (39 kayıt); okuma başarısı37/50 olarak raporlandı |
| Sentetik şık / CER / WER | 105/200, CER%13,4829, WER%27,9015; v24 ile aynı |
| pnpm test | 136 test: 132 geçti, 4 atlandı, hata0; ayrıca4 kuyruk kontrolü geçti |
| Eski21 regresyon | Genişletilmiş quiz24/24 geçti; dijital Tapu gerçek referans testi aktif |
| Yeni3D testleri | 12/12: yer tutucu/dijital/üst sınır/bölüm; yuva; formül/gate; açık onay; güvenli kompakt gösterim; throw/empty/timeout; büyük kırpma; geç worker; ayrı AI önerisi; AI sonrası yuva |
| Öğrenci API gerçek tarama | 283 görsel, max kırmızı oran%0,0000710 < %0,01 |
| Sentetik kırmızı görseller | 20 görsel, max oran0 |
| Önizleme / paylaşım | Gerçek React bileşeni + API/R2 simülasyonu: temiz görsel; tam görsel yanında ikinci şık img/p yok; orijinal asset erişimi öğrenciye reddedildi |
| Tür / derleme | tsc --noEmit --incremental false ve Sites üretim derlemesi geçti |

Atlanan4 test, elimizde bulunmayan ayrı80 soruluk MEB PDF/ekran görüntüsü referanslarına bağlıdır; başarılı ilan edilmedi. Gerçek tarama güvenlik testinde OCR yeniden çalıştırılmadan, ayrı gerçek OCR ölçümünün ürettiği aynı sınav sonucu API’ye verilmiştir. API byte/piksel denetimi gerçek PNG/JPEG’ler üzerindedir. Test fixture’ındaki öğretmen onayı yalnız test hazırlığıdır; üretim yer tutucuları unresolved/cevap null kalır.

### Süre, bellek, boyut

| Metrik | v24 | Yeni | Fark |
|---|---:|---:|---:|
| Tam sayfa+hedefli OCR | 14673,38ms | 14956,68ms | %1,93 |
| Toplam Node dönüşüm | 26491,87ms | 28919,89ms | %9,17 |
| Worker ilk hazırlama | 337,86ms | 721,67ms | Node/lang-cache ölçümü; browser ağ süresi değil |
| Tepe Node RSS | 2571,46MiB | 2875,63MiB | %11,83 |
| Ana sayfa JS ham | 184697bayt | 197064bayt | +12367 |
| Ana sayfa JS gzip | 58005bayt | 61568bayt | +3563 |
| Vendor / dil verisi | 25370621bayt | 25370621bayt | 0 |
| Yeni bağımlılık | 0 | 0 | Her iki lock ve bağımlılık listeleri aynı |

OCR bütçesi≤%110 geçti. Önceki yeni kaynak ölçümü+%1,66 idi; son değer yukarıda. Zaman farkları cihaz/koşul dalgalanmasıdır; hız artışı iddia edilmiyor. Tam soru görselleri ve Node teşhis/ham kutu kayıtları bellek maliyetini artırıyor; browser belleği bu RSS’den çıkarılamaz. İlk browser yükleme/ağ süresi ölçülmedi; ilk yükleme boyut etkisi ana chunk+3563gzip bayt olarak ölçüldü. OCR vendor/dilleri dijitalde import edilmiyor; callback0 testi ve kaynak lazy-load yolu kanıtıdır, gerçek browser ağ kaydı yok. İlk motor/dil hazırlama yalnız tarama tespitinde; PSM3 başlangıç→11 sayfa, tur+eng/OEM1, 144DPI, hint150; hedefli şerit300DPI, mevcut7% bütçe/ençok6 OCR bölgesi aynen. Placeholder geometrisi aynı yardımcıyı300 sınırla kullanır; OCR çağrısının varsayılan6 sınırı değişmedi. Global kırmızı temizliği ve sütun/numara/şık kabul kuralları değişmedi; kelime/satır güveni yalnız metadata olarak taşındı.

## Doğrulanamayanlar ve riskler

- Gerçek browser/mobile/Windows çalıştırması yapılmadı. Sites managed QA kuralına uygun kontrol tarayıcısı bu ortamda yok; alternatif preview/browser kurulmadı. React akış ve API testi browser E2E olarak sunulmuyor.
- Browser/Node şüpheli sayı farkının kesin nedeni ve browser başlangıç süresi/belleği doğrulanamadı.
- Tepe Node RSS artışı risk olarak açık: 100 sayfa/bellek sızıntısı/cihaz dayanıklılığı ölçülmedi; 3E’ye geçilmedi.
- Kırmızı altında kalan siyah baskı harfleri öğrenci görselinde hasarlı kalabilir (5/7/9/16/23/25 örnekleri). 3C-2 maskesi değiştirilmedi; öğretmen orijinalden kontrol etmeli. Gerçek kırmızı şekil içeriği de beyaza gidebilir; mevcut sayfa uyarıları sürüyor.
- Okuma puanı yüksek olsa da OCR yanlış metin üretebilir (örn.13’te Denye). Metin doğruluğu garanti edilmiyor; varsayılan kaynak görseli korunur ve öğretmen değiştirebilir.
- Birden fazla aday kaynak bölgesi, çoklu ardışık eksik numara, başlangıç/son sınır numarası veya OCR başarısız tüm sayfa için numara uydurulmaz. Öğretmen geri alma/PDF alan seçimi gerekir; genel tüm PDF’ler için50/50 iddia edilmez.
- Eski kayıtlar üzerinde veri göçü yapılmadı. Önceki imzasız/elle değişmiş görseller fail-closed olarak sunulmaz; 3C-2 güvenliği korunur. Yeni yer tutucu/okuma metadata/tam görsel varsayılanları yeni dönüşümlerde üretilir; eski taslağı yeniden dönüştürmek veya öğretmen kırpmasını yeniden bağlamak gerekir.
- Canlı AI sağlayıcısıyla ücretli onarım denenmedi; mock AI testleri ve mevcut onay akışı kontrol edildi.

## Değişen dosyalar

app/page.tsx; app/globals.css; lib/quiz.ts; lib/pdf-import.ts; lib/pdf-layout.ts (güven metadata, placeholder için limit parametresi; OCR varsayılanı korunur); lib/hybrid.ts; package.json (sürüm/test); scripts/ocr/measure.mjs (okunmuş/yer tutucu ayrı metrik, kaynak seçimi ve isteğe bağlı sınav kaydı); tests/reading-regression.mjs; tests/red-ink-regression.mjs; portable/template/scripts/run-tests.mjs; scripts/export-portable.mjs (sürüm açıklaması); docs/phase3d.md.

Yeni PDF/PNG fixture binary’si repoya eklenmedi. Referanslar dış yollarla verilir. SafJS/canvas ve mevcut PDF.js/tesseract.js kullanıldı; sürüm/PSM/dil/DPI yükseltilmedi. Kanıt paketinde JSON/ham kutular/test logları ve seçilmiş orijinal/güvenli kırpmalar bulunur. Kaynak paketi2.0.10, önceki portable profilinin mevcut bağımlılıklarını korur.

**Faz3D sonunda duruldu. Faz3E/3F başlamadı.**
