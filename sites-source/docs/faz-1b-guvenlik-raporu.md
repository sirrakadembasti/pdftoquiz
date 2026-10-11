# Faz 1B: renkli cevap işareti sızıntısı

8 Ekim 2026. Kapsam: kullanıcınin 0.1-0.4 güvenlik maddeleri. Tasarim, API rotalari, puanlama, veritabani ve hibrit akis korundu. Kaynak PDF değiştirilmedi ve repoya eklenmedi.

## Teşhis ve önce/sonra

| Madde | Önce: kanıt | Sonra: ölçülen sonuç |
| --- | --- | --- |
| 0.1 Öğrenci görseli | `studentExam` `correct:null` kullansa da `q.image` ve `q.optionImages` degerlerini aynen döndüruyordu. `GET /api/exams/[id]?action=asset&key=...` öğretmen görseline sahiplik kontrolu uygulamiyordu. | Öğrenci ve onizleme ayni `protectedImages` secicisini kullanir. Güvenli kopyası olmayan kaynak kırpmalar öğrenci JSON'una girmez. Öğrenci listesinde olmayan kaynak asset için öğretmen kimligi zorunlu; işaretli orijinal şıklara öğrenci istegi 401, güvenli kopyalara 200. |
| 0.2 Nötrleştirme | Tum renkler kaynak kırpmalarda aynen kaliyordu. | PDF.js metin/operator eşleşmesiyle kırmızı metin kutulari bulunur; yalniz tespit edilen şık alanlarindaki metne uygulanir. Bu kutulardaki kırmızımsı RGB pikseller griye cevrilir; metin dışındaki sekiller korunur. Orijinal canvas ve öğretmen kırpmalari değişmez. Gercek PDF'nin 200 şık görselinde 46.489 kırmızı pikselden 0'a inildi. |
| Öğretmen kontrolu | Renkli cevap sızıntısı uyarisi/seçeneği yoktu. | Uyari ve varsayilan açık “Renkli işaretleri gizle” eklendi. Kapaliysa öğrenci onizlemesi/paylasim güvenlik nedeniyle engellenir. Orijinal kaynak öğretmen editorunde korunur. |
| 0.3 Öneri | Metin dolgu renginden cevap önerisi yoktu. | Bu referansta 50 sorudan 50'sinde tek şık önerisi bulundu. `correct` 50 sorunun hepsinde null kaldı. Açık “Öneriyi doğruladim” eylemi veya manuel anahtar gerekir. Tespit kısmi olarak etiketlenir; genel olarak her PDF'de 50/50 kapsama garantisi yoktur. Öneri, renk kutulari, kaynak/provenance ve koruma metadata'si öğrenci JSON'una aktarılmaz. |
| 0.4 Test | Piksel ve kaynak asset yetkisi testi yoktu. | Sentetik PDF, gercek Tapu PDF, API/asset erişimi, eski/değişen kırpmalar ve React onizleme/onay kontrolleri eklendi. Yeni güvenlik testinin 4 kontrolu geçti. |

## Koordinat kanıti

Koordinatlar PDF sol ust referansina gore nokta cinsindedir. Normalize kırpma kutulari `[x,y,w,h]`; piksel sayilari Node canvas ile PDF.js scale=2 ve uygulamanin PNG/JPEG kırpma yolundan alinmistir.

| Soru/şık | PDF sayfasi | Kırmızı metin araligi (nokta) | Normalize şık kırpmasi | Orijinal -> öğrenci kırmızı piksel |
| --- | --- | --- | --- | --- |
| 16 / D | 3 | x=454,27-525,32; y=534,80-707,11; çok satırli kod | [0,730034; 0,618237; 0,244966; 0,313763] | 3.466 -> 0 |
| 30 / D | 6 | x=42,48-257,20; y=429,54-460,34; üç satır SQL | [0,068357; 0,507181; 0,363435; 0,039348] | 4.712 -> 0 |

Bu iki kırpmanin önce/sonra PNG'leri `docs/phase1b-evidence/` altindadir. `metrics.json` tüm 50 sorunun sayfa, şık kutusu, önerisi ve piksel ölçümunu içerir. 16 ve 30'un yeni öğrenci kırpmalari görsel olarak da incelendi.

## Referans testini engelleyen ek kök nedenler

Önceki kaynak commit `1294237525a8fd7968610a4166ca23afd5006bae` gercek referanstan 33 soru çıkardı; 16 ve 30 bu listede yoktu. Bu nedenle önceki uygulamada bu iki sorunun canli öğrenci ekraninda göründüğü iddia edilmiyor. Sizinti kaynak PDF, diger çıkmış sorular, kod yolu ve yeniden üretilen 16/30 kaynak kırpmalariyla kanıtlandi.

- Tek basina `12.` ve `16.` gibi soru numaralari, alt bilgi sayi filtresinin `#` anahtarina eşleşiyordu. Soru ve şık etiketleri tekrar filtresinden korundu.
- `A )` biçimi bir şıki düşüruyordu. Etikette parantez öncesi boşluk desteklendi.
- `A) ::` metni A kitapçık ust bilgisinin normalize `a` anahtarina eşleşiyordu; şık etiketlerinin tekrar filtresinden korunması bunu da düzeltti.
- Ders tablosu olmayan kapakta toplam ve süre okunmuyordu. Genel açıklama kapagindan 50 soru, 70 dakika ve A kitapçığı okunur; kapak sorulara katilmaz.

Sonuç: 1-50 sirali 50 soru, her birinde dort dolu/metin veya görsel şık, 70 dakika, A kitapçığı; tek bölüm (yapay ders bölümu eklenmedi).

## Güvenlik davranisi ve sinirlar

- Güvenli kopya kaynak görselle baglidir. Elle kırpma veya AI görsel değişikligi eski güvenli kopyayi gecersizlestirir; öğrenci metne döner. Metinsiz görsel soruda paylasim engellenir. Yeni kırpmalar için PDF'yi yeniden dönüştürun; eski kırpma otomatik güvenli sayilmaz.
- Taranmış/OCR ve AI-only görseller için doğrulanmis metin rengi maskesi üretilmiyorsa orijinal görsel öğrenciye verilmez. Bunlarin renkli şıklarini başarıyla temizledigi iddia edilmiyor. Görsel agirlikli sınavlarda yeniden inceleme gerekir.
- Sentetik testte şık içindeki kırmızı sekil ve soru govdesindeki kırmızı sekil kaynakla birebir ayni kaldı. Değişen piksellerin yalniz kırmızımsı metin pikselleri oldugu, kırpma ölçülerinin sabit kaldıgi doğrulandi. Harf kutusuyla ust uste gelen sekil/ozel PDF fontu gibi alisilmadik duzenlerin tümune garanti verilmez.
- JSON doğru cevap anahtarini sınav öncesi döndürmez; mevcut sınav-sonu sonuç/cevap degerlendirme davranisi korundu. Referans API testi paylasim için yapay A anahtari kullanir; bu gercek cevap anahtari değildir.
- Gercek tarayici, canli öğretmen/öğrenci oturumu ve Windows yerel uygulama çalıştırması bu oturumda test edilmedi. React testi mock renderer; API testleri bellek bucket ve mock kimlik ile gercek route fonksiyonlarini cagirir. Canli AI cagrisi yapilmadi.
- Kaynak PDF dosyasi aynen kaldı; referans ham PDF dagitim paketine dahil edilmedi. Asset endpoint'i `no-store` kullanir; daha önce indirilmis orijinal görseller geri alinmis sayilmaz.

## Yeniden test

```bash
npm test
TAPU_REFERENCE_PDF='/dosyanin/tapu.pdf' node --test tests/answer-color-regression.mjs
REFERENCE_PDF='/dosyanin/5_sinifA_26_compressed.pdf' node --test tests/phase1-regression.mjs tests/layout-quality-regression.mjs tests/hybrid-regression.mjs
```

Windows PowerShell'de `TAPU_REFERENCE_PDF` için `$env:TAPU_REFERENCE_PDF='D:\dosyalar\tapu.pdf'` kullanin. Mevcut yayınlanmis sınavi yeniden PDF'den dönüştürun, önerileri kaynakla karsilastirin, cevaplari onaylayin ve yeni öğrenci baglantisi olusturun.

## Son doğrulama

75 farklı kontrol geçti: mevcut regresyonlar, dört son-şık PDF kontrolü, eski 80 soruluk gerçek referansın üç testi ve dört yeni renk güvenliği testi. Anahtar OCR paketindeki kullanıcı ekran görüntüsü testi bu çalıştırmada atlandı; sentetik gerçek OCR testi geçti. TypeScript, git diff --check ve üretim derlemesi geçti. Gerçek tarayıcı ve Windows çalıştırması doğrulanmadı.
