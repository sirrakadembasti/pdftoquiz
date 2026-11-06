# Faz 1B — Metin birleştirme ve şık ayrıştırma

8 Ekim 2026. Aynı Tapu Programcı referansı, yerel PDF.js ve sentetik örneklerle incelendi. Önceki teşhis korunarak genel uygulama kuralları düzeltildi; dosya adı/soru numarası üzerinden özel düzeltme yapılmadı. Bilgilendirme görselleri, sıralı soru tespiti, renk güvenliği, öğretmen onayı ve mevcut veri şeması korunur.

## 2.1 — Sahte boşluklar: teşhis ve düzeltme

Önce: `textLines` iki PDF.js öğesini her birleştirdiğinde koşulsuz bir boşluk ekliyordu. `0,075 × sayfa genişliği = 44,65 pt` sınırı harfler arası boşluk eşiği değil, metin parçalarını ayırma sınırıydı. Minimum 4 pt çizim kutusu da gerçek öğe genişliği yerine boşluk ölçümünde kullanılmamalıdır.

| Öğe çifti | Sayfa | İlk/ikinci öğe genişliği (pt) | Fiziksel boşluk (pt) | Yazı boyutu (pt) | Önce → Sonra |
| --- | --- | --- | --- | --- | --- |
| `5` + `0` | 1 | 4,550 / 4,550 | -0,003 | 8,985 | `5 0` → `50` |
| `7` + `0` | 1 | 4,550 / 4,550 | -0,003 | 8,985 | `7 0` → `70` |
| `Kimlik N` + `o` | 1 | 29,609 / 4,730 | -0,051 | 8,985 | `N o` → `No` |
| `T` + `olower` | 6 | 5,499 / 29,034 | 0,021 | 9 | `T olower` → `Tolower` |
| `… bıra` + `karak` | 2 | 204,984 / 23,571 | 0,266 | 9 | `bıra karak` → `bırakarak` |
| `\\` + `n` | 7 | 2,502 / 5,004 | 0,018 | 9 | `\\ n` → `\\n` |

Sonra: boşluk kararı gerçek `PDF.js item.width` ile sağ öğenin X koordinatından hesaplanır. Eşik `max(0,08 × em, min(0,18 × em, 0,45 × font boşluk genişliği))` olur. `em` iki öğenin küçük yazı boyutudur. Font boşluk genişliği PDF.js operatörlerindeki boşluk glifi genişliğinden alınır; bulunamazsa orantılı font için 0,28 em, monospace için 0,6 em kullanılır. Açıkça var olan boşluklar korunur. Kalın/alt çizgi işaretlerinin indeksleri eklenen gerçek ayırıcı uzunluğuna göre kaydırılır.

Kapak metni artık **“50 adet soru” / “70 dakikadır”**; algılanan sayı **50**, süre **70**. `Web-posta`, `bırakarak`, `Tolower` ve soru 39'un `\t`, `\n`, `\\`, `\0` şıkları gerçek PDF testinde doğrulanır. `Tolower` kaynakta büyük T olduğu için küçük harfe dönüştürülmez. Sözcük sözlüğüyle metin tahmin edilmez.

## 2.2 — Boşluklu işaretler

Önce: tek başına `A )` kabul edilse de satır içindeki `B )`, `C )` gibi işaretler bölünmüyordu. Tüm işaretleri boşluklu sentetik satır yalnız bir şık çıkarıyordu.

Sonra: aynı işaret grameri `A )`, `A)`, `A .`, `A.`, `(A)` ve diğer desteklenen soneklerde hem geometrik ayrıştırmada hem metin yardımcı yolunda uygulanır. Tüm işaretleri boşluklu ve parantezli satırlar dört şık çıkarır.

## 2.3 — Satır içi ve kısa şıklar

Soru 1 ve 17 önceki 2.0.2 sürümünde zaten dört şıktı; bu durum korunur. Soru 17 **`:: / implements / interface / extends`** olarak çıkar. `Add / Insert / Set / In` ve `5 / 6 / 7 / 8` sentetik örnekleri de dört şık verir. Kısa/sembol içerik için minimum sözcük uzunluğu filtresi yoktur.

## 2.6 — Çok satırlı ve kod şıkları

Soru 7'nin gerçek SQL bloğunda yinelenen şık yoktu. Eski 33 adaylık çıktıda soru 33'ün `7: }` satırından sahte ikinci “7” bloğu oluşturulmuş, birden fazla sorunun seçenekleri aynı bloğa girince uyarı oluşmuştu. Numara/kod ayrımı düzeltmesiyle sahte blok kaldırıldı; gerçek 7'nin uyarı listesi bu çalışmadan önce ve sonra boş.

Önce: sıradan devam satırları birleştiriliyordu; kod şıkları da tek satır metne dönüşüyordu. Sonra: monospace/kod sözdizimi/pseudocode ve çıktı satırı ipuçlarıyla belirlenen kod dizilerinde her kaynak satır korunur. Yatay koordinatlar fontun boşluk genişliğiyle metin girintisine dönüştürülür. Orantılı font PDF'lerinde girinti, pikseli birebir eşleyen bir ölçü değil, kaynak düzenini temsil eden boşluk sayısıdır; özgün görseller korunur.

- Soru 16: dört pseudocode şıkkında satır sonları ve iç girintiler bulunur.
- Soru 38: her şık `RED`, `YELLOW`, `GREEN`, `BLUE` için dört ayrı satırdır. Gövdedeki C kodu ve kaçış dizileri korunur.
- Normal uzun şıklar önceki şıkta akıcı metin olarak birleşmeye devam eder; paragraf/liste/matematik davranışı korunur.
- Öğretmen şık alanları çok satırlıdır. Öğrenci metin bileşeni mevcut `pre-wrap` stilini kullanır. Görsel şık akışı korunur.

## 2.7 — Aynı metinli şıklar

Önce: soru 23'ün B ve C metinleri aynı olmasına rağmen uyarı yoktu. Sonra: **“Aynı metinli şıklar: B, C. Kaynakla karşılaştırın; doğru cevabı öğretmen belirlemeli.”** uyarısı çıkar.

Karşılaştırma NFKC ve boşluk düzenleme sonrası büyük/küçük harfe duyarlı eşitliktir; boş şıklar karşılaştırılmaz. Şıklar birleştirilmez/silinmez ve doğru cevap belirlenmez. Öğretmen metni değiştirirse kontrol özeti güncel şıklardan yeniden hesaplanır; eski uyarı takılı kalmaz. Tüm 50 sorunun `correct` alanı `null` kalmıştır; önceki renk önerileri hâlâ ayrı ve öğretmen onayına bağlıdır.

## Doğrulama ve kullanım

87 kontrol geçti (4 PDF sınır kontrolü dahil); isteğe bağlı gerçek OCR ekran görüntüsü testi girdisi sağlanmadığından 1 test atlandı. Yeni 7 testin tamamı, gerçek Tapu referansı, önceki 80 soruluk PDF, renk güvenliği, numara sırası, API, OCR ve React regresyonları geçti. TypeScript ve `git diff --check` geçti. Üretim derlemesi paketleme sırasında ayrıca doğrulanır. Gerçek tarayıcı, Windows kurulumu ve yerel SQLite sunucusu bu oturumda çalıştırılmadı. API/React regresyonları mock kimlik/depolama/arayüz kullanır. Tüm PDF düzenleri için kusursuz dönüşüm garantisi verilmez.

Eski taslaklar öğretmen değişikliklerini ezmemek için otomatik yeniden yazılmaz. PDF yeniden dönüştürülmelidir. Koordinat ve önce/sonra metin kanıtı: `phase1b-text-evidence/text-diagnostics.json`.

```bash
TAPU_REFERENCE_PDF='/dosyalar/tapu.pdf' node --test tests/text-options-regression.mjs
```
