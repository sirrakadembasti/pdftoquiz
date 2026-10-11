# Madde 5 — Arayüz işlevleri incelemesi

## 11 Ekim 2026 güncellemesi

Güncel düzenleyicide radio ve eski M3 checkbox tekrarları kaldırıldı; iki bağımsız görüntü checkbox'ı varsayılan işaretsizdir. Soru metni ve dönüştürülmüş görünüm tek editördür. PDF kırpma hedefleri ve tüm soru satırlarını gösteren anahtar tablosu için [güncel rapor](editor-simplification.md), body hydration istisnası için [inceleme](hydration-and-git.md). Aşağıdaki 7 Ekim bulguları geçmiş kayıt olarak korunur.

7 Ekim 2026. Mevcut hosted PDF to Online Quiz kaynakları incelendi. Vinext/React, Worker ve R2 düzeni, tasarım ve API yolları korundu. Windows D: sürücüsüne erişilmedi; bu çalışma hosted sürüme aittir.

## Kök neden ve değişiklikler

| Sorun | Kök neden | Çözüm / doğrulama |
|---|---|---|
| Tamamlanan önizlemeden dönüşte önizleme durumu açık kalıyordu | Sonuç ekranındaki dönüş düğmesi yalnız görünümü değiştiriyordu | Ortak çıkış işlemi süre, cevap, sonuç ve önizleme durumunu temizler. Art arda iki önizleme testi. |
| Öğrenci sonucu gönderilemezse süre duruyordu | Hata kolu deadline değerini sıfırlıyordu | Süre korunur; cevaplar korunarak yeniden gönderim düğmesi gösterilir. Sahte 502 HTML yanıtı ve ardından başarılı API kaydı test edildi. |
| Süre dolduktan sonra başarısız otomatik gönderim tekrar tekrar denenebilirdi | Zamanlayıcının hata sonrası durma koşulu yoktu | Hata durumunda otomatik döngü kesilir, kullanıcı kontrollü yeniden deneme sunulur. Süre sıfır olduğunda cevap değişiklikleri engellenir. Süre dolma senaryosu ayrıca gerçek tarayıcıda denenmeli. |
| Pano reddinde kayıtlı sınav bağlantısı seçilemiyordu | Hata bildirimi vardı; bağlantı alanı yoktu | Kayıtlı kart için seçilebilir bağlantı diyaloğu; paylaşım diyaloğunda mevcut alan korunur. Başarılı kopyalama ve reddedilen pano izni bileşen testleri. |
| PDF yokken alan seçimi/yakınlaştırma etkin görünüyordu | Kontroller kaynak PDF durumuna bağlı değildi | PDF yokken kontroller pasif. Zoom sınırlarında ilgili kontrol pasif. PDF olmadan kontrol testi. |
| Seçenek silinince kırpma hedefi geçersiz kalabiliyordu | Seçenek indeksi ayrı state içinde tutuluyordu | Geçersiz hedef otomatik sıfırlanır; kırpma sırasında da indeks doğrulanır. Kod incelemesi; hedefin kaldırılma senaryosu ayrı test edilmedi. |
| İptal edilen dokunmatik alan seçimi ekranda kalabiliyordu | Pointer cancel işleyicisi yoktu | Seçim başlangıcı ve alan temizlenir. Kod incelemesi; cihaz testi yapılmadı. |
| Taslak silme başarısızlığı sessiz/unhandled kalıyordu | IndexedDB promise beklenmiyordu | Başarıdan sonra bildirim kapanır; başarısızlık kullanıcıya gösterilir. IndexedDB hata senaryosu ayrıca denenmeli. |
| Modal ilk Tab/Shift+Tab geçişi odak dışına çıkabiliyordu | Odak tuzağı yalnız ilk/son form elemanını denetliyordu | Diyalog kapsayıcısı odaklıyken ilk/son elemana geçiş eklenir. Gerçek klavye testi yapılmadı. |
| İşlem sürerken başka ekrana geçilip geç gelen yanıt ekranı değiştirebiliyordu | Ana gezinme ve önizleme düğmeleri busy durumunu dikkate almıyordu | Ana sekmeler/demo/önizleme pasif; paylaşma ve kayıt açma busy kontrolü eklenir. Marka bağlantısı sayfayı yeniden yüklemek yerine state ile gezinir. |

## Etkileşim envanteri ve kapsam

Tüm uygulama ekranlarındaki olay bağlantıları kaynak kodunda incelendi. Aşağıdaki testler React event handler'larını çalıştırır; fiziksel tıklama, gerçek DOM, tarayıcı konsolu, CSS, gerçek pano ve ağ kaydı testleri değildir.

| Grup | Çalıştırılan kontroller | Kalan doğrulama |
|---|---|---|
| Ana sayfa / sekmeler | Örnek sınav, dosya seçme, dosya input, Genel bakış, Sınavlarım, marka bağlantısı, rehber, tema | Sürükle bırak, mobil menü, tüm yükleme hataları, dönüşüm iptali |
| Sınavlarım | Türkçe arama/eşleşmeme, bağlantı kopyalama, kopyalama hatası, kayıt açma, boş sonuçlar, yeni sürüm bağlantısı | Sonuçlu tablonun gerçek görünümü, kaynak PDF'nin kayıtlı sürümden açılması |
| Düzenleyici | Soru ekle/sil, seçenek ekle, cevap anahtarı değiştirme, tüm soruları onaylama, soru başlığı, JSON indirme komutu, görsel şık kırpma, paylaşım doğrulaması | Her metin/form alanı; seçenek/görsel silme, her kırpma hedefi, PDF sayfa/zoom/pointer cancel, IndexedDB taslak devam/silme |
| Önizleme | Eksik anahtarla açma, öğrenciye benzer soru görünümü, cevap verme/temizleme, önceki/sonraki, bitirme diyaloğunu iptal/onay, önizlemeyi kapatma, sonuçtan dönüş ve tekrar önizleme | Gerçek tarayıcı görsel karşılaştırması |
| Paylaşım | Kaydetme API'si, benzersiz UUID bağlantısı, eski sürüm korunarak ikinci bağlantı, kopyalama bildirimi, öğrenci görünümünü açma komutu | Gerçek sekme/pano, yetkisiz öğrencinin hosted erişimi |
| Öğrenci | İsim girme, başlatma, yanıtlar, gezinme, bitirme, sunucu puanı, HTML ağ hatası, tekrar gönderim; hata sonrası sürenin devamı | Süre dolması, yeniden yükleyerek devam, offline/online değişimi, tüm tarayıcılar |
| AI / modallar | API anahtarı girme, sahte sağlayıcıyla bağlantı testi, modal kapatma; API 401/429/HTML ve adres doğrulama | Canlı kullanıcı anahtarı, sağlayıcı/model seçimi ve ayarları kullanma, klavye odağı/Escape/dış alan |

## API ve hata doğrulaması

- Bellek içi R2 taklidiyle gerçek route fonksiyonları çalıştırıldı; canlı R2/hosted HTTP testi yapılmadı.
- Kayıt → öğrenciye anahtarsız içerik → kaynak PDF yetki engeli → sonuç → öğretmen sonuç erişimi akışı test edildi.
- Yetkisiz kayıt 401; eksik doğru cevap ve farklı origin 400 senaryoları test edildi. Bunlar beklenen erişim/doğrulama yanıtlarıdır.
- 502 HTML yanıtı JSON ayrıştırma hatası olarak bildirilir; öğrenci cevabı kaybolmaz. Tekrar denemede bir sonuç kaydı oluşur.
- AI 401, 429 ve JSON olmayan yanıtlar sahte sağlayıcıyla test edildi. Canlı sağlayıcı kalitesi doğrulanmadı.
- Test konsolunda `react-test-renderer is deprecated` uyarısı bulunur. Test aracına aittir. Gerçek tarayıcı konsol hataları envanteri çıkarılamadı.
- Derlemede Vinext API yollarını statik olarak sınıflandıramadığına dair bilgi mesajı görülür; derleme tamamlandı.

## Erişim sınırı

Site erişim politikası custom ve yalnız izinli hesaba açıktır. Benzersiz öğrenci URL'si bu politikayı aşmaz. İzinli olmayan öğrenci için Sites erişim izni verilmesi veya siteyi herkese açma kararı gerekir. Kullanıcının mevcut erişim politikası bu işte değiştirilmedi.

## Doğrulama sonucu

20 otomatik test; gerçek dijital ve taranmış PDF örnekleri dahil. TypeScript kontrolü ve üretim derlemesi. 20/20 test geçti; TypeScript ve üretim derlemesi başarılı. Bütün elemanlar gerçek tarayıcıda tek tek test edilmiş olarak raporlanamaz.

Geri alma: Bu değişiklikler app/page.tsx, tests/quiz-regression.mjs ve dokümantasyonla sınırlıdır; önceki git sürümü geri alınabilir.
