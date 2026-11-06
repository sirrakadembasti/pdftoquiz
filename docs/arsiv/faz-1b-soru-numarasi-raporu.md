# Faz 1B: soru numarası, kod satırları ve bilgilendirme sayfaları

8 Ekim 2026. Yerel PDF.js dönüşümünün genel kuralları güncellendi. PDF dosyası değiştirilmedi; herhangi bir soru numarası, sayfa numarası veya Tapu dosya adı kurala sabit olarak yazılmadı. SQL/Prisma şeması, tasarım, puanlama, AI onay akışı ve önceki renk güvenliği korundu.

## Teşhis özeti

Kullanıcının gözlemi 32/50 idi. Elde bulunan eski kaynak commit `1294237525a8fd7968610a4166ca23afd5006bae` bu ortamda **33 aday** üretti; biri gerçek sorulara ait olmayan tekrar `7` numarasıydı. Bu yüzden eski sürüm için 32 sonucunu birebir yeniden ürettiğimiz iddia edilmiyor. Eksik soru ve yanlış birleştirme nedenleri aynı eski kod üzerinde yeniden üretildi.

Önceki 2.0.1 sürümü zaten 50/50 çıkarıyordu; ancak sıra duyarlı genel kural ve açık kod satırı sınıflandırması eksikti. Kod satırları ile kapak/kurallar, gereksiz yere geri alma listesine giriyordu. Bu çalışmada o eksikler giderildi.

## 1.1 Koordinat ve reddetme kanıtı

PDF genişliği **595,32 pt**. X koordinatı PDF'nin sol kenarına göre ölçülür. Eski girinti hesabı `x - anchor` idi; **|girinti| > 0,016 × genişlik = 9,53 pt** olunca aday reddediliyordu. `anchor` gerçek sayfa/sütun kenarı değil, işleme giren ilk numaralı satırdı.

Eski sürüm, üstte tek başına duran soru numaralarını tekrarlanan alt bilgi `#` anahtarıyla eliyordu. Bu yüzden iki sütun tespiti de bozuluyor, iki sütun tek alan gibi işleniyordu. Sonra:

- Sayfa 3 ve 5'te sahte devam satırları `Soru 11.` / `Soru 23.` **x=42,48 pt** konumunda oluşturuluyor; yanlış anchor haline geliyordu.
- Sayfa 6'da kod satırı ilk aday olup **x=321,05 pt** yanlış anchor haline geliyordu.
- Dolayısıyla gerçek soruların x=27,48 veya 306,05 olması “girintili” diye yorumlanıyordu. Bazı gerçek sorular anchor'dan **daha solda** oldukları halde mutlak fark nedeniyle reddediliyordu.

Aşağıdaki tablo eski `convertPDF` çağrısının `analyzePage` girdisi izlenerek üretildi; yalnız sayfayı ayrı incelemenin anchor'ı kullanılmış değildir.

| Sayfa | Aday | X (pt) | Eski anchor (pt) | Eski girinti (pt) | Eski ret nedeni | Yeni sütun kenarı (pt) | Yeni sonuç |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | 12 | 27,48 | 42,48 | -15,00 | Tekrarlanan alt bilgi (#) | 14,88 | Kabul: beklenen 12 |
| 3 | 13 | 27,48 | 42,48 | -15,00 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 13 |
| 3 | 14 | 27,48 | 42,48 | -15,00 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 14 |
| 3 | 15 | 27,48 | 42,48 | -15,00 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 15 |
| 3 | 16 | 306,05 | 42,48 | 263,57 | Tekrarlanan alt bilgi (#) | 299,45 | Kabul: beklenen 16 |
| 5 | 24 | 27,48 | 42,48 | -15,00 | Tekrarlanan alt bilgi (#) | 14,88 | Kabul: beklenen 24 |
| 5 | 25 | 27,48 | 42,48 | -15,00 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 25 |
| 5 | 26 | 27,48 | 42,48 | -15,00 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 26 |
| 5 | 27 | 306,05 | 42,48 | 263,57 | Tekrarlanan alt bilgi (#) | 299,45 | Kabul: beklenen 27 |
| 5 | 28 | 306,05 | 42,48 | 263,57 | Mutlak girinti > 9,53 pt | 299,45 | Kabul: beklenen 28 |
| 5 | 29 | 306,05 | 42,48 | 263,57 | Mutlak girinti > 9,53 pt | 299,45 | Kabul: beklenen 29 |
| 6 | 30 | 27,48 | 321,05 | -293,57 | Tekrarlanan alt bilgi (#) | 14,88 | Kabul: beklenen 30 |
| 6 | 31 | 27,48 | 321,05 | -293,57 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 31 |
| 6 | 32 | 27,48 | 321,05 | -293,57 | Mutlak girinti > 9,53 pt | 14,88 | Kabul: beklenen 32 |
| 6 | 33 | 306,05 | 321,05 | -15,00 | Tekrarlanan alt bilgi (#) | 299,45 | Kabul: beklenen 33 |
| 6 | 34 | 306,05 | 321,05 | -15,00 | Mutlak girinti > 9,53 pt | 299,45 | Kabul: beklenen 34 |
| 6 | 35 | 306,05 | 321,05 | -15,00 | Mutlak girinti > 9,53 pt | 299,45 | Kabul: beklenen 35 |
| 6 | 36 | 306,05 | 321,05 | -15,00 | Mutlak girinti > 9,53 pt | 299,45 | Kabul: beklenen 36 |

Yeni hesapta sol sütun kenarı **14,88 pt**, sağ sütun kenarı **299,45 pt**; soru numarası anchor'ları sırasıyla **27,48 ve 306,05 pt**. Gerçek soruların anchor'a göre girintisi 0 pt; sütun kenarından uzaklığı sol sütunda 12,60, sağ sütunda 6,60 pt. Sütun değişince beklenen soru numarası sıfırlanmaz; ders/bölüm değişince ilgili bölümün sırası kullanılır.

## 1.2 Sıra duyarlı kural

Beklenen numara önceki kabul edilen sorunun +1'idir. Aday bu numaraysa ve kendi sütununun sol tarafındaysa girinti farkından önce kabul edilir. “Yeterince solda” sınırı sütun genişliğinin %20'si ve sayfa genişliğinin %10'undan küçük olanıdır; küçük koordinat toleransı vardır. Bu doğrulama başarısızsa eski anchor girinti kontrolü uygulanır. Kapaktan okunan toplam veya bölümün beklenen soru sayısı üst sınırdır; 50'yi aşan 51 numarası otomatik kabul edilmez. Eksik numara varsa anchor yoluyla güvenilir bir sonraki soruyu çıkarmak hâlâ mümkündür; sıra uyarısı korunur.

## 1.3 Kod satırı ayrımı

Numaralı kod satırları önce sınıflandırılır: küçük ardışık sayılar, yakın satır/aynı girinti, `:` son eki, monospace/Courier/Consolas font ipucu, `#include`, `int main`, `{`, `printf`, `return` gibi kod sözdizimi ve satır içinde soru kökü bulunmaması birlikte değerlendirilir. `:` tek başına yasak değildir; `1: Which value?` biçimindeki gerçek soru testte kabul edilir. Sadece numara ya da sadece font nedeniyle tüm metin dışlanmaz.

Soru 33'ün **1:-7:** satırları `body` kararıyla soru gövdesinde kaldı; soru veya geri alınacak blok yapılmadı. `1.` biçimindeki monospace kod listesi de sentetik testte gövdede kaldı. Soru 33'ün yerel şıkları **1 / 3 / 5 / 6** olarak korundu.

## 1.4 Sayfa başı ve yanlış devam

Sayfanın ilk içerik satırı beklenen yeni soru numarasıysa önceki soruya devam birleştirmesi yapılmaz. Açık aynı numara/devam ve gerçek gövde/şık devamları korunur.

| Soru | Eski kaynak commit | Önceki 2.0.1 ve yeni dönüşüm |
| --- | --- | --- |
| 11 | `sourcePages=[2,3]`; sonraki sayfanın soruları yanlış devam bloğuna giriyordu. | `sourcePages=[2]`; 12-16 ayrı sorular. |
| 23 | `sourcePages=[4,5]`; sonraki sayfanın soruları yanlış devam bloğuna giriyordu. | `sourcePages=[4]`; 24-29 ayrı sorular. |
| 33 | Gerçek soru yerine kodun küçük numaraları adaylaşıyordu. | `sourcePages=[6]`; 1:-7: kod satırları aynı gövdede. |

Ek kontrol: gerçekten iki sayfaya yayılan soruda özgün ve güvenli görseller birleştirildiğinde kaynak bağının geçersizleşmemesi düzeltildi. Yeni bir sentetik test güvenli gövde ve tüm şık görsellerinin birleştirme sonrasında erişilebilir kaldığını doğrular.

Bu düzeltme PDF'yi yeniden çözümleme sırasında uygulanır. Önceden kaydedilmiş 32/33 soruluk taslaklar otomatik yeniden yazılmaz; öğretmenin elle yaptığı değişiklikleri ezmemek için PDF yeniden dönüştürülmelidir.

## 1.5 Geri alma listesi

12-16 ve 24-36 otomatik gerçek sorular olarak kabul edildi. Kod gövdesi ve bilgilendirme maddeleri listeden çıkarıldı: **önceki sürümde 23 blok -> bu referansta 0 blok**.

Genel bir PDF'de girinti nedeniyle reddedilen, fakat yerel şıkları algılanmış soru adayı için `block.question` ve kırpmaları korunur. “Soru olarak geri al” mevcut şık metinlerini/görsellerini taşır; onay ve doğru cevap yeniden öğretmenden istenir. Sentetik test reddedilen bir adayın dört yerel şıkkını geri alma sonrasında birebir karşılaştırır. Gerçek Tapu referansında geri alınacak gerçek soru kalmadı; diğer PDF'lerde belirsiz blok listesi bulunabilir.

## 1.6 Kapak ve kurallar

Sayfa sınıfı `cover`/`instructions` olan sayfalar soru bölgesi analizine hiç girmez; 1.-17. maddeler soru adayı veya geri alma bloğu oluşturmaz. **Sayfa 1 ve 9**, iki ayrı sayfa görseli olarak “sınav öncesi bilgilendirme”de tutulur ve `instructionsVisual=true` varsayılanıyla gösterilir. Metin erişilebilirlik/öğretmen düzenlemesi için tutulabilir; karışmış iki sütunlu metin varsayılan öğrenci görünümü değildir. İki bilgilendirme görseli görsel olarak incelendi; sütun düzeni ve tüm maddeler korundu.

## Doğrulama ve sınırlar

- Gerçek referans: **50/50**, 1-50 ardışık ve tekrarsız, her soruda dört şık, 70 dakika, A kitapçığı, tek bölüm. Sayfa 3'te 12-16; sayfa 5'te 24-29; sayfa 6'da 30-36 kabul edildi.
- Yeni sıra/kod/kapak/geri alma/sayfa devamı testleri gerçek PDF ve sentetik satırlarla yapıldı. Önceki renk güvenliği, gerçek 80 soruluk PDF, OCR, API, hibrit onay ve React regresyonları ayrıca çalıştırıldı.
- Toplam 80 kontrol geçti; isteğe bağlı gerçek OCR ekran görüntüsü testi, girdisi sağlanmadığı için atlandı. TypeScript ve `git diff --check` geçti. Üretim derlemesi paketleme sırasında ayrıca doğrulanır.
- Gerçek tarayıcıdaki öğretmen/öğrenci akışı, Windows kurulumu ve yerel SQLite sunucusu bu oturumda çalıştırılmadı. Tarayıcı testleri React mock; API testleri gerçek route fonksiyonları ile mock kimlik/depolama kullanır. Tüm olası PDF düzenlerinde kusursuzluk garantisi yoktur.
- Koordinat izi: `phase1b-number-evidence/number-diagnostics.json`. Referans PDF repoya/pakete eklenmedi.

Yeniden çalıştırma:

```bash
TAPU_REFERENCE_PDF='/dosyalar/tapu.pdf' node --test tests/number-sequence-regression.mjs
```

Windows PowerShell: `$env:TAPU_REFERENCE_PDF='D:\dosyalar\tapu.pdf'`; ardından yukarıdaki `node --test` komutunu ortam değişkeni ataması olmadan çalıştırın.
