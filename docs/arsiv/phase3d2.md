# Faz 3D düzeltme 2 — 11 Ekim 2026

## Kapsam ve sonuç

İstek metninin 1–4. bölümleri uygulandı. Yeni bağımlılık/vendor eklenmedi; tur+eng, OEM 1, PSM 11, OCR render 144 DPI ve hint 150 korunuyor. 3C numara/sütun kabul kuralları ve kırmızı temizleme eşiği değiştirilmedi. Otomatik metin düzeltmesi yok.

Gerçek kaynak: grup-36---programci(1).pdf, 12 sayfa. Hedefli numara OCR açıkken **48 okunmuş + 2 yer tutucu = 50**; kapalıyken **47 okunmuş + 3 yer tutucu = 50**. Kapalı koşulda 48+2 kabulü karşılanmadı: 23 numarası belirsiz kalıyor. Soru 6/7 artık iki koşulda ayrı. Tarayıcı araçları zaman aşımına uğradı; gerçek tarayıcı ve mobil ekran doğrulaması yapılmış değildir. Node OCR, ham OCR tekrar yürütmesi, React ve API testleri kullanıldı.

## 1. Soru 6/7: bulgu → kanıt → değişiklik → sonuç

Eski parser, numarası kırmızı daire altında kalan 7 için başlangıç kabul etmiyor; 6'nın sonraki kabul edilmiş komşusu 8 olduğundan ikinci şık grubu 6 bloğunda kalıyordu. Ham OCR ikinci grubun ilk şıkkını “a 3” olarak okuyor. Şık harfleri tüm blok üzerinden değerlendirilince ilk grubun A'sı ikinci grubun başlangıcını da bastırıyordu.

Yeni kural tamamlanan en az üç ardışık şıktan sonra ikinci grubun başlangıcını kendi alt bloğunda değerlendiriyor. Tek boşluk, tutarlı n−1/n+1 komşuları, sütun kenarına yakın gövde ve yalnız tek olası sınır gerekiyor. Belirsizlikte otomatik bölme yapılmıyor. 7'nin seçenekleri 3/4/9/12/15; OCR metni korunuyor. “numara sıradan çıkarıldı; kaynak sınırlarını doğrulayın” öğretmen kontrolüne kadar yapısal uyarı.

Son sınırlar (sayfa 3, sağ sütun; normalize): 6: x=.513742, y=.323386, h=.196426; 7: x=.513742, y=.533614, h=.168017. 6 kırpması 7 gövdesinden önce bitiyor. Kayma/marj/eğiklik için 27 varyasyon ve negatif devam/çok satırlı şık/dijital/çoklu boşluk örnekleri eklendi. Aynı kutuların tekrar yürütmesi aynı sonucu veriyor. Bunlar tüm olası PDF'lerde yanlış bölme olmadığı iddiası değildir.

Hedefli OCR süre bütçesi yerine öncelik sırasına göre en fazla altı şerit kullanıyor. Gerçek açık çalışmada üç şerit; 7 parserdan çıkarıldı, 23 hedefli OCR ile bulundu; 5 ve 21 yer tutucu kaldı. Kapalı koşulda 23'ün A/B/E gibi eksik ardışık grubu güvenli sınır çıkarmaya yetmiyor.

50 numara benzersiz ve 1–50 tamdır. Kaynak konumları gözlenen sıra ile uyuşur: 1–8 sayfa3, 9–17 sayfa4, 18–24 sayfa5, 25–30 sayfa6, 31–36 sayfa7, 37–38 sayfa8, 39–42 sayfa9, 43–46 sayfa10, 47–50 sayfa11. Bu eşleşmeyi ölçüm dosyasındaki kutularla karşılaştırın; bozuk/tekrar kayıt yok. Gerçek referansın sayfa numaraları dışındaki yeni PDF'lere genellenmez.

## 2. Öğrenci gösterimi ve paylaşım

M1 dijital veya öğretmen onaylı tarama metni; metinsiz dijital resimli şık korunur. M2 şıksız güvenli gövde ve marker dışı güvenli şık kırpmaları; harf rozetini uygulama çizer. M3 tam güvenli soru görseli, büyük yatay A–E düğmeleri ve “Seçenekler yukarıdaki görseldedir. Cevabınızı seçin.” etiketi. Eksik/uygunsuz M2 alanı veya yer tutucu/numara sınırı uyarısı M3'e düşer. Güvenli tam görseli olmayan M3 yayınlanamaz. Öğretmen soru başına veya tümüne mod tercihi yapabilir; uygunluk her soru için yeniden kontrol edilir.

Gerçek taslak: M2 41, M3 9. 1/5/6/7/9/16 örnekleri için üç modun React testleri, marker kutusu, etiket ve çift gösterim kontrolü var. Düğmeler masaüstünde en az 48, mobilde 52 piksel; M3 dar ekranda yatay kaydırılabilir. Mobil dokunma davranışı gerçek cihazda doğrulanmadı.

M2 ek kopyaları gerçek JSON'u 19.32 MB'a çıkardı; önceki 18 MiB sınırı paylaşımı reddetti. Sınav JSON bütçesi 24 MiB, toplam istek 48 MiB ve farklı görsel bütçesi600→1200 oldu; PDF 20 MiB ve tek görsel sınırları korunuyor. Gerçek taslak API/R2 bellek kovası testinde paylaşılıp öğrenci görselleri okunabildi; özgün öğretmen varlıklarına öğrenci erişimi 401. Güvenli gövde varlığı da izin listesine ve depolama imza bağlamasına eklendi. Bu test dış servise yayın yapmaz.

## 3. Kalem izi artığı

Ölçüm yalnız betikte sayfa12 anahtarını referans alır. Üretimde anahtar önerisi öğretmen onayı gerektirir; öğrenci JSON'unda doğru cevap veya anahtar yok.

8 komşulukta en az30 piksellik belirgin kırmızı bileşenin yaklaşık marker/şık içerik kutusuyla örtüşmesi ölçüldü. 1–11: **9/9 (%100)**; belge geneli **18/23 (%78.26)**; sonraki sorular 9/14. Soru5 A için OCR yer tutucusunda şık kutusu yoktu: yalnız ölçümde kaynak üzerinde elle belirlenen normalize kutu (.575,.196,.37,.03) kullanıldı. Bu elle seçilmiş göstergeyi otomatik ölçümlerden ayırın. Soru1 E marker hasarı ve Soru5 A satır sonu silinmesi kaynak/güvenli görsellerde görülebiliyor. Metrik kopuk harfi veya beyaz boşluğu doğrudan sınıflandırmaz; örtüşme cevap sızıntısı için bir vekil göstergedir.

324 güvenli öğrenci görselinde maksimum kırmızı oran **%0**, <%0.01 koşulunu karşılıyor. Kırmızı yokluğu silinmiş alanlardan çıkarımı engellediğini kanıtlamaz. M2 marker bozukluğunu kaldırır; şık metninin içindeki silinmiş harf riskini tamamen çözmez. M3'te kırmızı tespit edilen sayfa, yer tutucular dahil, paylaşım öncesi açık kalem izi onayı ister. Uyarı: “Bu kopyada öğretmen kalem izi vardı; silinen bölgeler cevabı ele verebilir. İşaretsiz bir kopya önerilir.”

Yalnız öneriler, uygulanmadı: işaretsiz kaynak yeniden taramak en az içerik bozma riski taşır. Inpainting harf/kod uydurabilir. Bütün şıklara eşit maske uygulamak ipucunu azaltabilir ama bilgiyi yok eder. Gri tonlama kırmızı işareti daha görünür yapabilir. OCR metni öğretmen doğrulamasıyla kullanılabilir; otomatik düzeltme güvenilir bir sızıntı çözümü değildir.

## 4. Uyarılar, süre ve netlik

Tarayıcı gözlemindeki 41 alan yerine aynı Node temelinin eski kapısı 42 alan verdi; ortam/ayar farkını eşitlemeden 41 ile birebir kıyas iddiası yok. Yeni açık taslak: **3 yapısal** (5/7/21), **8 metin kalitesi** (1/5/6/16/21/23/25/39), **50 bilgi** (NO_ANSWER_KEY dahil). Sayaçlar örtüşebilir. Varsayılan AI hedefi3; metin kalitesi açıkken birleşim9 soru. CODE_CONTENT tek başına ve doğrulanmış SEQUENCE_INFERENCE alarm olmuyor. Metin AI seçeneği varsayılan kapalı; mevcut onay kartının çağrı/token/maliyet tahmini seçime göre hesaplanıyor. Dijital AI kapısı korunuyor; gerçek Tapu dosyası bulunamadığı için 50/50 özel kabulü tekrar doğrulanamadı.

Kapak “Cevaplama süresi toplam 65 dakikadır.” artık özel kitapçık başlığı olmasa da yakalanıyor ve metadata seçimine dahil: süre **65 dakika**. Sayfa12'de 50 cevap önerisi, beklenen **50** kaynak etiketi ve toplu anahtarı açan “önizle ve uygula” girişi var. Anahtar otomatik kabul edilmez. Kırmızı tespit tek özet ve açılır ayrıntı halinde gösterilir.

Kırpmalar144DPI. 250DPI ölçümü: tam sayfa RGBA yaklaşık5.35→16.14MiB (3.02kat); q1 370×187→638×324, dataURL55762→45287bayt; q5 379×374→653×645,54467→124599bayt. Mevcut captureResilient sıkıştırması boyutu sınırlayabildiğinden büyüklük tek başına netlik ölçüsü değildir. Kaynak bulanıklığı sürdü, doğrulanmış okunabilirlik kazancı yok; üretime250DPI eklenmedi. Diğer1/5/6/7/9/16 ölçümleri yerel JSON'da.

OCR toplamı 42.05→35.83sn (%85.21); bu koşumda ≤%110. Uçtan uca süre 85.03→124.83sn; M2 ek render/kırpmaları ve eşzamanlı yük nedeniyle arttı. OCR başarımı ile toplam süreyi karıştırmayın; tek koşum hız garantisi değildir.

## Kanıt ve doğrulama sınırları

Yerel özel ölçümler .audit/phase3-baseline-valid, phase3-final-valid, phase3-final-replay; phase3-final-metrics.json, phase3-image-measure.json, phase3-real-api.log. Görseller/OCR metni içerirler; yayın manifestine alınmadılar. İlk başarısız/kapak-only ölçümleri son sonuçlarda kullanılmadı. Gerçek tarayıcı, mobil ekran ve dış Tapu kabulü açık doğrulama eksikleridir. Son test/derleme sonucu aşağıdaki doğrulama ekinde kaydedilir.

## Son doğrulama

- Tam regresyon: node scripts/run-tests.mjs, çıkış0;152test,143geçti,0hata,9harici referans testi atlandı. Ayrıca tail betiğinin dört sentetik gerçek PDF kontrolü geçti.
- Yeni Faz3D2/3E testleri16/16geçti.
- Gerçek Programcı taslağı API/görsel erişim testi1/1geçti;324güvenli görüntü piksel ölçümünde kırmızı%0. Gerçek kaynakla Node ölçümü yapıldı; tarayıcı testinin yerine geçmez.
- TypeScript kontrolü çıkış0. Üretim build çıkış0; eski webpack önbelleği WasmHash hatası verdi, .audit altında korunarak ayrıldıktan sonra yeniden derleme geçti.
- Geçici SQLite ile üretim HTTP/taşınabilir paket testleri9/9geçti; kullanıcı veritabanı test için değiştirilmedi.
- Son özel kayıtlar: .audit/phase3-tests-final.log, phase3-server-tests.log, phase3-real-api.log, phase3-typecheck-final.log, phase3-build-complete.log. Paket manifesti son raporlarla yeniden hesaplanır.

Çalışma bu iki raporla durduruldu; açık kabul eksikleri başarı diye işaretlenmedi.
