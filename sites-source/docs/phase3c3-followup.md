# Faz 3C ara kontrol devamı — 2.0.9 / v24

9 Ekim 2026. Başlangıç: v23, 98f0ca8fbebb9816694067470a70e749eafcc8be. Kullanıcının ekran görüntüsü kontrolü ve “BAŞLA/devam et” talimatı kapsamında: kalan şık sınırları, hedefli numara geçişinin uygulanması, boş sayfa/cevap tablosunun ayrılması ve özetin açıklanması. 3D–3F başlanmadı; eski kayıtlar üzerinde veri göçü yapılmadı.

**Sonuç:** gerçek tarama **48/50**, eksik **5 ve 21**; beş farklı şık harfi **40→43** (ekran görüntüsü önce 41 idi). 7 ve 23 numaraları hedefli şerit OCR ile geri geldi. Yanlış sayfa/sütun, fazla ve tekrar 0. Bu sonuç 48 sorunun bütün kod/metinlerinin doğru olduğu anlamına gelmez. 43 soruda beş farklı harf ve içerik alanı bulunuyor; kaynakla metin doğruluğu ayrıca denetlenmeli.

## Bulgu → kanıt → değişiklik → sonuç

### 1. Ekran ile Node farkı ve önceki durum

PDF SHA256: 3adb242733608da6964aba8b7831227cee3afdc0361fd6e8a4f01c87f9c86486. Yeniden yüklenen PDF önceki referansla aynı. Ekranda 46 soru, eksik 5/7/21/23, beş harf 41, şüpheli 12, yerel puan 89 görülüyor; aynı v23 kaynak Node ölçümünde 46/40/32. Motor/PSM/dil/global DPI değiştirilmedi. Worker'ın çözümlediği core 5.1.1 vendor ile aynı SHA256 (ce20eda9533cbed1e6c2b4276fbae1e0adc61b6754b5513084be601787b457cf); kök transitive core sürümü worker sürümü olarak kullanılmadı.

| Ölçüm | v23 Node | v24 Node |
| --- | --- | --- |
| Bulunan / doğru sayfa-sütun | 46/50 | 48/50 |
| Eksik numara | 5,7,21,23 | 5,21 |
| Beş farklı harf | 40 | 43 |
| Dört harf | 4 | 3 |
| Diğer/eksik | 2 | 2 |
| İçerik alanları dolu soru | önceki özet ölçmüyordu | 43 |
| Sıra çıkarımı işaretli soru | 24 | 28 |
| Şüpheli soru | 32 | 33 |
| Onaylanmış cevap | 0 | 0 |
| PDF’den bekleyen anahtar | 0 | 50 |

Aynı PDF'de kırmızı piksel sayıları browser/Node farklı: sayfa 3 5303/5290, sayfa 5 4910/4940, sayfa 11 1529/1508. Bu raster çıktısının farklı olduğuna kanıttır; 41/40 ve 12/32 farkının tek sebebinin bu olduğu kanıtlanmadı. Kullanıcının ham browser OCR kutuları yok; gerçek browser yeniden dönüşümü bu ortamda doğrulanamadı. Site becerisinin managed QA kuralı, control-browser yoksa preview server veya alternatif browser yolunu kullanmamayı gerektiriyor. API/React düzeyinde kontroller çalıştı; uçtan uca browser testi yapıldı denmiyor.

Şüpheli sayı artışı yeni “sıra çıkarımı” ve “hedefli OCR” uyarılarından da etkilenir. Özet beş harf, içerik alanı ve çıkarım sayısını ayrı gösterir. “Kalite puanı”, doğruluk yüzdesi sanılmasın diye “Yerel kontrol puanı” olarak açıklanır; puan algoritması değişmedi.

### 2. Şık sınırı ve kelime/karakter kutusu onarımı

Bulgu: okunamayan 7/21/23 sorularının ikinci şık dizisi önceki 6/20/22'nin şıklarını ezebiliyordu. Şık harfi/metni a3 ve -dToolbow gibi aynı OCR tokeninde birleşebiliyor; yalnız düz metin üzerinde kesmek içerik kaybettiriyordu.

Değişiklik: OCR satırlarına mevcut kelime/sembol kutuları taşındı. Şık gövde başlangıcı güvenilir marker kutularının medyanından çıkarılır. Harf içerikle birleştiyse gövde geometrik olarak ayrılır; harf sıradan atanır. Sembol→harf veya kod yazım eşleme tablosu yok. En az 3 ardışık güvenilir harften sonra tek adaylı, düzenli aralıkta D/E kuyruğu ilerletilir. Bir ikinci şık dizisinin ayrılması, numara sol kenarında gövde başlangıcı da gerektirir; yalnız yinelenen seçenek harfleriyle bölünmez. Sınır geriye alınırken kırmızıdan etkilenmiş büyük kutu değil medyan satır yüksekliği kullanılır. Numarasız blok görseli öğretmen geri alma listesinde korunur; 5 veya 21 tahminen üretilmez.

| Soru | Yeni sonuç | Süren sınır |
| --- | --- | --- |
| 4 | C harfi geri geldi | Kaynak \n hâlâ OCR gWw; kodu öğretmen düzeltmeli |
| 6 | 7’nin şıkları artık 6 ’yı ezmiyor | A/Kaba kod hâlâ eksik |
| 7 | Numara 7, beş şık 3/4/9/12/15; kod görseli genişletildi | Kod OCR metni kaynak kontrolü gerektirir |
| 9 | Numara ve şekilli beş seçenek korunuyor | Şekiller görsel olarak okunmalı |
| 16 | İki harf mevcut; durum işaretli | C/D/E ifadeleri B’ye karışıyor |
| 17 | D/E sıra ve kutu ile tamamlandı | Toolbox hâlâ Toolbow |
| 20 | 21 bloğu ayrıldı; kendi beş şıkkı korundu | A kaynak 6, OCR &: düzeltilmedi |
| 22 | 23 bloğu ayrıldı; E devam satırı korundu | Metin yazımı kaynak kontrolü gerektirir |
| 23 | Numara 23 geri geldi | C/D eksik, kod devamları B içinde |
| 25 | Eksik içerik uyarısı sürüyor | C metni B’ye karışıyor |
| 45 | A/C/E doğru sıra ile atanıyor | ©) doğrudan C diye eşlenmiyor |

7'de gövde kodu sağdaki ilk şıktan aşağıya uzanıyor: sol kodun satırları soru metninde ve gövde görselinde korundu. Dikdörtgen geniş gövde kırpması sağdaki seçenekleri de tekrar gösterebilir; kaynak kaybını önlemek için bu görsel tekrar kabul edildi. 6/16/23/25 çözülmüş sayılmaz;4/17/20 OCR yazım ve kod hataları sessizce düzeltilmedi.

### 3. Boşluk hedefli numara okuma — kalıcı, isteğe bağlı API

Tam sayfa ilk geçiş 144 DPI, tur+eng/OEM 1/PSM 11/user_defined_dpi 150 aynen. Uygulama recoverNumberGaps:true ile yalnız n−1/n+1 arasındaki eksik n için sütunun medyan numara kenarındaki küçük şeridi 300 DPI render eder ve yerel kırmızıyı beyaza siler. Global görüntü/ön işleme değişmez; kabul edilmiş soru değişmez/silinmez. Aynı worker kullanılır; yeni setParameters çağrısı yok. Doğrudan convertPDF çağrılarında eski varsayılan false korunur.

Kabul: yalnız beklenen n; güven≥70, x farkı<1,5 glyph, aynı OCR satırında devam eden harfli metin; kod ;{} / return/printf/for/while satırı reddedilir. Şerit x=medyan kenar−1,2 glyph; genişlik7,5 glyph. İki sınır mevcut değilse okuma yok. En çok 6 şerit, küçük sütun içi boşluk önce; zaman bütçesi tam sayfa recognition süresinin %7'si, son bölge süresi rezerv olarak ayrılır.

| Beklenen | Temel son çalıştırma | Sonuç |
| --- | --- | --- |
| 7 | Kabul | 7. / %88.67 |
| 23 | Kabul | 23 / %96.91 |
| 21 | Ek OCR süre bütçesi doldu. | Bütçe/koşul dolmadı |

7 ve 23 temel çalıştırmada geri geldi; 5/21 kalıyor. Varyasyonlarda 21 de geri gelebiliyor. Tek OCR çağrısı kesilemediği için bütçe kesin timeout değildir; bir çağrı kestirimden pahalıysa aşabilir. Son temel ölçüm sınır içindedir; 100 sayfa/cihaz dayanıklılığı 3E kapsamında hâlâ ölçülmedi. Soru 5 yalnız sıra çıkarımıyla eklenmedi.

### 4. Sayfa ayrımı ve onaylı PDF anahtarı

| Sayfa | Önce | Sonra |
| --- | --- | --- |
| 1 | Kapak/talimat | Talimat; soru sayılmıyor |
| 2 | Leke nedeniyle OCR + düşük güven | Boş; motor/recognize çağrısı0 |
| 12 | NO_QUESTIONS | Cevap anahtarı; dijital metin, OCR 0 |

Boş sayfa kararı ~600 px genişlikte örnekleme, koyu(maxRGB<190)/açık(maxRGB<230) alan oranı ve 8 bağlı bileşen ile verilir. Koyu oran<0,0002; açık oran<0,001;≥3 örnek pikselli bileşen≤5; en büyük bileşen<max(12,örnek sayısı×0,00008). Soluk toz, metin ve büyük şekil regresyonları geçti. Seyrek gerçek içerik hâlâ risk; yalnız bu testlerden tüm boş sayfaları doğru ayırıyor sonucu çıkarılamaz. Sayfa 2 metadata reading=ocr kaynak türünü ifade ediyor, recognize gerçekten çalışmadı.

Başlıksız Soru-N X tablosu için≥6 giriş ve eşleşen metin kapsamı≥%55; numara 1..300, çelişkiler ayrı. Sayfa 12’den50 cevap/0 çelişki çıktı. Düzenleyicide kaynağı/sayfası gösterilip mevcut eşleşme önizlemesine yüklenir; öğretmenin mevcut onay adımı olmadan correct alanına yazılmaz. Öğrenci projection'ında öneri yok. Eski başlıklı anahtar akışı geriye uyum için değişmedi. Mevcut 48 soru/eksik şıklar nedeniyle bütün 50 anahtarın uygulanması öğretmen düzeltmesi gerektirir.

### 5. Sayfa/sütun ve soru başına şık dökümü

| Sayfa | Sol bulunan | Sağ bulunan | Sol eksik | Sağ eksik |
| --- | --- | --- | --- | --- |
| 3 | 1, 2, 3, 4 | 6, 7, 8 | — | 5 |
| 4 | 9, 10, 11, 12, 13 | 14, 15, 16, 17 | — | — |
| 5 | 18, 19, 20 | 22, 23, 24 | 21 | — |
| 6 | 25, 26, 27 | 28, 29, 30 | — | — |
| 7 | 31, 32, 33, 34 | 35, 36 | — | — |
| 8 | 37 | 38 | — | — |
| 9 | 39 | 40, 41, 42 | — | — |
| 10 | 43, 44 | 45, 46 | — | — |
| 11 | 47, 48 | 49, 50 | — | — |

| Soru | Sayfa / sütun | Farklı harf | Dolu metin | Sıra çıkarımı |
| --- | --- | --- | --- | --- |
| 1 | 3 / left | 5 | 5 | A, E |
| 2 | 3 / left | 5 | 5 | D |
| 3 | 3 / left | 5 | 5 | B |
| 4 | 3 / left | 5 | 5 | C |
| 6 | 3 / right | 4 | 4 | — |
| 7 | 3 / right | 5 | 5 | A |
| 8 | 3 / right | 5 | 5 | D |
| 9 | 4 / left | 5 | 5 | C, A, E |
| 10 | 4 / left | 5 | 5 | — |
| 11 | 4 / left | 5 | 5 | — |
| 12 | 4 / left | 5 | 5 | — |
| 13 | 4 / left | 5 | 5 | — |
| 14 | 4 / right | 5 | 5 | — |
| 15 | 4 / right | 5 | 5 | — |
| 16 | 4 / right | 2 | 2 | — |
| 17 | 4 / right | 5 | 5 | D, E |
| 18 | 5 / left | 5 | 5 | — |
| 19 | 5 / left | 5 | 5 | — |
| 20 | 5 / left | 5 | 5 | — |
| 22 | 5 / right | 5 | 5 | A |
| 23 | 5 / right | 3 | 3 | — |
| 24 | 5 / right | 5 | 5 | — |
| 25 | 6 / left | 4 | 4 | — |
| 26 | 6 / left | 5 | 5 | C |
| 27 | 6 / left | 5 | 5 | C |
| 28 | 6 / right | 5 | 5 | — |
| 29 | 6 / right | 5 | 5 | — |
| 30 | 6 / right | 5 | 5 | — |
| 31 | 7 / left | 5 | 5 | C |
| 32 | 7 / left | 5 | 5 | C |
| 33 | 7 / left | 5 | 5 | — |
| 34 | 7 / left | 5 | 5 | C |
| 35 | 7 / right | 5 | 5 | C |
| 36 | 7 / right | 5 | 5 | C |
| 37 | 8 / left | 5 | 5 | C |
| 38 | 8 / right | 5 | 5 | C |
| 39 | 9 / left | 4 | 4 | — |
| 40 | 9 / right | 5 | 5 | — |
| 41 | 9 / right | 5 | 5 | C |
| 42 | 9 / right | 5 | 5 | C |
| 43 | 10 / left | 5 | 5 | C |
| 44 | 10 / left | 5 | 5 | C |
| 45 | 10 / right | 5 | 5 | C, A, E |
| 46 | 10 / right | 5 | 5 | C |
| 47 | 11 / left | 5 | 5 | C |
| 48 | 11 / left | 5 | 5 | C |
| 49 | 11 / right | 5 | 5 | C |
| 50 | 11 / right | 5 | 5 | C |

Dolu metin ile görsel destekli içerik aynı metrik değildir. Soru 9 şekilleri ve kod soruları için korunmuş görsel kullanılabilir; 43 içerik alanı sayısı metin doğruluğu kanıtı değildir.

### 6. Genelleme ve yanlış pozitif

Varyasyonlar repoya binary koymadan saf JS ile üretildi: yatay±%3, eğiklik±1°, kenarölçeği0,94/1,03 ve birleşik(+%3,+1°,0,94). Her biri gerçekten yeniden OCR edildi. Tam sayfa PNG hash'leriyle aynı ham OCR çıktısı v23 tam dönüşümünde replay edildi; replay süresi/belleği performans kanıtı değildir.

| Varyasyon | Gerçek önce→sonra | Gerçek beş harf önce→sonra | Tapu önce→sonra | Tapu harf /200 önce→sonra | Yanlış konum/fazla numara |
| --- | --- | --- | --- | --- | --- |
| base | 46→48 | 40→43 | 37→37 | 105→105 | 0/0/0 |
| shift-minus3 | 46→47 | 35→37 | 39→39 | 117→117 | 0/0/0 |
| shift-plus3 | 46→48 | 36→38 | 45→45 | 162→162 | 0/0/0 |
| skew-minus1 | 46→48 | 40→39 | 45→45 | 157→157 | 0/0/0 |
| skew-plus1 | 46→47 | 37→39 | 49→49 | 171→171 | 0/0/0 |
| margin-inset | 46→48 | 34→35 | 38→39 | 145→149 | 0/0/0 |
| margin-outset | 46→48 | 39→38 | 43→43 | 150→150 | 0/0/0 |
| combined | 46→48 | 37→36 | 37→38 | 138→142 | 0/0/0 |

Bazı gerçek varyasyonlarda beş harf sayısı1düşüyor. Önceki sayımlar okunamayan sonraki sorunun harfleri/metinleri önceki soruya karıştığı için yüksekti: ör.skew-minus1 soru 22'deA/B/E23'ün for kodlarıydı; artık 22'nin kendi metni korunuyor, eksik A harfi gizlenmiyor. Birleşik örnekte6'ya7'nin3/4/9/12/15şıkları karışmıştı. Bu düşüş yanlış bölgenin ayrılmasıdır; yine de varyasyonlarda bütün şık hedefi sağlandı iddiası yok.

| Kontrol | Önce | Sonra |
| --- | --- | --- |
| Tapu temel numara | 37 | 37 |
| Tapu temel harf/200 | 105 | 105 |
| Tapu CER | 13.48% | 13.48% |
| Tapu WER | 27.90% | 27.90% |
| Kırmızı eklenmiş Tapu geçerli numara | 32 | 35 |
| Kırmızı eklenmiş Tapu harf/200 | 78 | 86 |
| Kırmızı Tapu fazla/tekrar | 1 | 0 |
| Yeni şık onarımının yapısal yanlış pozitifi | 0 | 0 |

Temel Tapu sentetik144OCR 37/50 ve şık metrikleri kötüleşmedi; bütün varyasyonlarda tam dönüşüm numara/harf sayımı en az v23. Kırmızılı Tapu’da18/25/36 hedefli marker geldi; 35 geçerli numara doğru sayfada, önce32. Numara 24ham OCR'da beş seçenekli bozuk blok önceden de var (aynı ham veride önce/sonra); yeni sıra onarımı üretmedi. Son dönüşümde hatalı sıfır şıklı blok ayrılabiliyor. Tüm gürültülü corpus kusursuz denmiyor. Yeni inference sonrası >beklenen şık, boş çıkarım, devam satırından şık üretme kontrolleri ve seçilmiş kaynaklar: yeni yanlış pozitif0. Ham kutular+metinler kanıt paketinde; metin doğruluğu yalnız sayım testinden kanıtlanamaz.

### 7. Elle kaynak kontrolü

LCG seed 3103 rastgele ilk10:36/37/10/47/25/43/28/42/27/22;7'si onarılan. Ek özel durumlar4/6/7/9/16/17/20/23/45. Solda orijinal kaynak kırpması, sağda çıkarılan şık metni PNG olarak incelendi.

| Soru | Kaynak karşılaştırması |
| --- | --- |
| 36 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 37 | Beş şık ve devam satırları doğru; radyoaktif sözcüğünde mevcut OCR yazım hatası var. |
| 10 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 47 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 25 | C etiketi hâlâ yok; kaynak C gövdesi B sonuna karışmış. Önceden var olan hata; kaynak görselinden elle ayırma gerekli. |
| 43 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 28 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 42 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 27 | Kaynak şık sırası ve gövdeler eşleşiyor; devam satırı yeni şık yapılmamış. |
| 22 | Önceki ve sonraki sorular ayrıldı; E devam satırı tamamıyla kaynak soruda kaldı. |
| 4 | C harfi doğru sıraya atandı fakat kaynak \n OCR’da gWw: kod metni yanlış, otomatik yazım düzeltmesi yapılmadı. |
| 7 | Numara 7 geri geldi, A=3/B=4/C=9/D=12/E=15 doğru; kodun alt satırları kaynak kırpmasında korunuyor. |
| 17 | D/E harf ve sınırları doğru; kaynak Toolbox OCR’da Toolbow, öğretmen düzeltmeli. |
| 6 | A/Kaba kod hâlâ eksik; 7 şıkları artık 6’ya karışmıyor. |
| 9 | Şekilli şık sorusu korundu; harf sırası ve metin bölgesi kaynakta doğru, şekiller seçenek görsellerinde korunmalı; genel kırmızı güvenliği testi geçti. |
| 16 | Yalnız2 harf bulundu; C/D/E ifadeleri B’ye karışıyor. Formül metni otomatik düzeltilmedi. |
| 20 | Kendi5şık dizisi korundu; kaynak A=6 OCR’da &: elle düzeltme gerekli. |
| 23 | Numara geri geldi; C/D eksik, kod satırları B’ye karışmış. Yalnız marker okundu; tam şık doğruluğu iddiası yok. |
| 45 | A/C/E sıra çıkarımı kaynak sırasıyla eşleşiyor; ©) sembolünden sabit C üretilmiyor. |

### 8. Güvenlik, regresyon, boyut ve süre

| Kontrol | Kanıt |
| --- | --- |
| pnpm test | 120 geçti / 0 başarısız / 4 atlandı (124 toplam) |
| 21/21 eski regresyon | Mevcut quiz paketi24/24; tail4 kontrol geçti |
| Dijital Tapu | 50/50,4şık, OCRcallback 0; source/API/kod/kırpma testleri geçti |
| Öğrenci gerçek görselleri | 281 görsel; en çok kırmızı%0.000071005 < %0,01 |
| Öğrenci sentetik görselleri | 20 görsel; en çok kırmızı%0.000000000 |
| AI/teacher/önizleme/paylaşım | API/React güvenlik regresyonları geçti; gerçek browserQA yok |
| TypeScript / diff / build | noEmit / diff-check / production build geçti |
| Bağımlılık / vendor | Yeni0; mevcutvendor25370621bayt; iki lock aynı |
| Ana sayfa JS | 174531→184697bayt; gzip54702→58005 (+3303) |
| Tam sayfa OCR toplam | 16420.85→15890.73ms;11→10 sayfa |
| Hedefli ek OCR / render+OCR | 314.55 / 802.19ms |
| OCR+şerit toplam kıyas | Tabana göre +%1.66 (≤%110) |
| Tüm dönüşüm süresi | 28179.69→27971.88ms; coldNode, tek örnek |
| Worker ilk yükleme | 312.65→377.93ms; Node yerelvarlık, browserilk yükleme değil |
| Tepe Node RSS | 2545.68→2589.55MiB |
| İlk tarayıcı yükleme süresi | Ölçülmedi; yeni OCR ağırlığı yok |

3,3 KBgzip artışı uygulama parser/ölçülü hedefli geçiş ve anahtar/özet davranışıdır; vendor ve dil verisi0artış. Ölçülen2 eknumara ve şık/sınır kazanımı bu artışı gerekçelendirir. NodeRSS tümrenderer/OCR/kanıt üretimi sürecini kapsar, browserbelleği değildir. Varyasyon ölçümlerinin bir kısmında buildkontrolleri çalıştığından süreleri doğrudan kıyaslamadık. Temel before/after tek seri performansına göre bütçe sağlandı; cihazlar arası veya 100 sayfa garantisi verilmedi.4atlanan test başka80 sorureferansdosyaları gerektirir. Windows/SQLite taşınabilir sürüm burada çalıştırılmadı.

### 9. Değişen dosyalar ve kalanlar

- README.md
- app/page.tsx
- lib/pdf-import.ts
- lib/pdf-layout.ts
- lib/quiz.ts
- package.json
- portable/template/scripts/run-tests.mjs
- scripts/export-portable.mjs
- scripts/ocr/README.md
- scripts/ocr/diagnose-sequence.mjs
- scripts/ocr/measure.mjs
- tests/number-gap-regression.mjs
- tests/option-sequence-regression.mjs
- tests/red-ink-regression.mjs
- docs/phase3c3-followup.md

Motor/worker/WASM/dil verisi, PSM/dil/OEM/global DPI/global kırmızı ön işlem ve 3C-1 sütun/numara kabul mantığı korunuyor. Öğrenci/AI güvenli varyantları ve öğretmen orijinalleri korunuyor. Eski kayıtlar sunumda imzasız/değişmiş görselleri gizlemeye devam eder; yeniden bağlama/göç yapılmadı. Eksik5/21, kısmi6/16/23/25ve kod/yazımhataları öğretmen kontrolü gerektiriyor. Anahtar50 öneridir; otomatikonay yok. BrowserileNodesayı farkının teksebebi doğrulanamadı. 3D–3Fve 100 sayfa dayanıklılık bu çalışma kapsamında değil. Bu ara kontrol sonunda duruldu.
