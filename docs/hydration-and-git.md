# Body hydration ve Git teslimi — 11 Ekim 2026

## İnceleme ve düzeltme

Kullanıcının konsol kaydında sunucu/istemci farkı yalnız `<body>` üzerindeki `cz-shortcut-listen="true"` ve `id="dummybodyid"` nitelikleridir. Uygulama kaynakları bu nitelikleri üretmez. Kayıt, React başlamadan önce dış bir tarayıcı aracının DOM'u değiştirmesiyle uyumludur; hangi eklentinin yaptığı doğrulanmadı.

Kök ve `sites-source/app/layout.tsx` dosyalarında yalnız `<body suppressHydrationWarning>` kullanıldı. Nitelikler uygulamaya kopyalanmadı; rastgele değer, istemci dalı veya ek bağımlılık eklenmedi. Bu istisna body seviyesindeki dış nitelik uyarısını bastırır, nitelikleri silmez veya onarmaz. Alt uygulama bileşenlerinin hydration hataları bastırılmaz.

React bu seçeneği yalnız bir seviye derinlikte çalışan sınırlı bir istisna olarak açıklar: [hydrateRoot belgeleri](https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors). Uygulamanın ürettiği gerçek bir uyuşmazlık için genel çözüm olarak kullanılmamalıdır.

## Doğrulama

`tests/hydration-regression.mjs` düzeltme öncesinde body bayrağı eksik olduğundan başarısız oldu. Düzeltme sonrasında iki test geçti: bayrak yalnız body'dedir; gerçek React SSR çıktısı deterministiktir ve dış nitelikleri içermez. Test standart test komutuna ve Sites kaynak kopyasına eklendi.

Bu testler React layout/SSR sözleşmesini sınar. Kullanıcının eklentileriyle gerçek tarayıcı hydration koşusu yapılmadı; tarayıcı konsolunda uyarının kaybolması ayrıca gözlenmelidir. Güncel tüm test ve derleme sonuçları [test raporundadır](TEST-REPORT.md).

## Git ve kaynak envanteri

Yerel klasör başlangıçta Git deposu değildi; `main` dalıyla depo başlatıldı. Kullanıcının belirttiği `https://github.com/sirrakadembasti/pdftoquiz.git` adresi `origin` olarak kaydedildi. Kullanıcı onayıyla yalnız bu depoda `sirrakadembasti` ve `192602448+sirrakadembasti@users.noreply.github.com` commit yazarı ayarlandı. İlk incelemede uzak depo boştu; zorla gönderim kullanılmaz.

Sonraki değişiklikler için `git status`, `git add <dosyalar>`, `git commit` ve `git push` kullanılır. İlk gönderim `git push -u origin main` ile yapılır. Uzak teslimi doğrulamak için `git rev-parse HEAD` ile `git ls-remote origin refs/heads/main` değerleri aynı olmalıdır; GitHub oturumu/erişimi yoksa gönderim başarısı iddia edilmez.

`.env`, yerel SQLite/kullanıcı verileri, yedekler, `.audit`, bağımlılık kurulumu ve derleme çıktısı Git kapsamı dışındadır. `.env.example` kaynak örneği olarak tutulur. Gerçek hesap şifreleri belgelere veya Git'e eklenmez. `tools/pnpm/dist/node_modules` kurulum çıktısı değil, dağıtımla gelen pnpm runtime'ıdır; yalnız bu yol için ignore istisnası vardır. İçindeki vendor ignore kurallarına takılan iki paket kaynak dosyası da manifestteki içerikleriyle teslim edilir.

`.gitattributes` dosyası otomatik satır sonu dönüşümünü kapatır. Kaynak depoda kolayca eskiyen bir `SHA256SUMS` tutulmaz; `sites-source` altındaki `export:portable` adımı paketi oluşturduktan sonra `VERSION.json` ve `SHA256SUMS` dosyalarını güncel içerikten otomatik üretir. Manifest Git metadata'sını ve çalışma zamanı verilerini kapsamaz.

## FAZ 3G teslim güncellemesi — 12 Ekim 2026

Kullanıcının açık isteğiyle FAZ 3G kaynakları, ilgili Markdown belgeleri ve Sites kopyaları aynı teslim kapsamına alındı. [FAZ 3G raporu](arsiv/phase3g.md), [test raporu](TEST-REPORT.md), README ve uygulama planı güncellendi. İlk Git kurulumuna ilişkin yukarıdaki kayıt tarihsel olarak korunur.

Son uygulama doğrulaması: standart pakette 195 test, 186 geçiş, 9 dış kaynak atlaması, 0 hata; TypeScript ve üretim derlemesi çıkış 0; HTTP/SQLite kontrolleri 9/9. Öğretmen hesabıyla gerçek HTTP girişi doğrulandı. Gerçek tarayıcı giriş/PDF yükleme simülasyonu, bağımsız 49 soruluk OCR ve dijital Tapu doğrulanmadı; nedenler ve gereken girdiler FAZ 3G raporunda yer alır.

Çalışma başlangıcındaki otomatik next-env.d.ts geliştirme değişikliği korunur ve bu teslim commit’ine eklenmez. Manifestte bu dosyanın depoda teslim edilen sürümü esas alınır. Şifre, oturum çerezi, yerel veritabanı ve .audit kayıtları Git kapsamı dışında kalır. Push sonucu yerel HEAD ile uzak main kimliği karşılaştırılarak doğrulanır.
