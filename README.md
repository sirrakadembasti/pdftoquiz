# PDF → Online Quiz

Öğretmenlerin PDF sınavlarını, soru ve şık görselleri korunarak paylaşılabilir web sınavlarına dönüştürdüğü Türkçe uygulama. Next.js 16 + React 19 + yerel SQLite; harici hizmet gerektirmez.

## Ne yapar

- PDF'i tarayıcıda yerel olarak sorulara ve şıklara dönüştürür (PDF.js + Tesseract OCR, taranmış sayfalar dahil).
- Öğretmen soruları, görselleri ve cevap anahtarını düzenler; isteğe bağlı AI kalite kontrolü kullanıcının kendi anahtarıyla çalışır.
- Öğrenci sınavı paylaşım bağlantısıyla çözer; puanlama sunucuda yapılır, öğrenciye cevap anahtarı gönderilmez.

Sınırlar: 20 MB / 100 sayfa PDF, 300 soru, 1200 görsel. Taranmış belgelerde öğretmen kontrolü beklenir.

## Hızlı başlangıç

Node.js 24 LTS (>=22.13) ve pnpm 11.25.0 gerekir (pnpm yoksa: `corepack enable` ya da `npm install -g pnpm@11.25.0`); ilk kurulum internet ister.

```powershell
git clone https://github.com/sirrakadembasti/pdftoquiz.git
cd pdftoquiz
pnpm install
Copy-Item .env.example .env
```

`.env` dosyasını açıp `INITIAL_ADMIN_PASSWORD=` satırına en az 12 karakterlik bir şifre yazın, sonra `pnpm dev` ile başlatın. Hesap yoksa sunucu ilk açılışta `admin@local.test` e-postası (`INITIAL_ADMIN_EMAIL` ile değişir) ve bu şifreyle öğretmen hesabını kendisi oluşturur; http://localhost:3000/account sayfasından giriş yapın. Veritabanı da ilk çalıştırmada kendiliğinden oluşur. Hesap oluştuktan sonra `.env`'deki bu değerler yok sayılır; şifreyi değiştirmek için `pnpm user:reset` kullanın. Şifre yazmak istemezseniz `pnpm user:add` rastgele şifreli hesap oluşturur ve şifreyi terminalde gösterir.

## Komutlar

Hepsi `pnpm <komut>` ile çalışır.

| Komut | Ne yapar |
|---|---|
| `dev` | Geliştirme sunucusu (`127.0.0.1:3000`) |
| `build` / `start` | Üretim derlemesi / üretim sunucusu |
| `typecheck` / `test` | Tür denetimi / standart test paketi |
| `test:server` | Gerçek sunucu + SQLite testi (önce `build`) |
| `user:add` / `user:reset` | Öğretmen ekle / şifre sıfırla |
| `backup` | Veritabanı yedeği |

## Belgeler

| Belge | İçinde ne var |
|---|---|
| [docs/KURULUM-ISLETIM.md](docs/KURULUM-ISLETIM.md) | Ayrıntılı kurulum, üretim/sunucu, hesaplar ve güvenlik, veri ve yedek |
| [docs/GELISTIRICI-REHBERI.md](docs/GELISTIRICI-REHBERI.md) | Test düzeni, PDF/OCR ilkeleri, düzenleyici davranışları, referans PDF'ler, bilinen sınırlar |
| [docs/AJAN-REHBERI.md](docs/AJAN-REHBERI.md) | Yapay zekâ kod ajanları ve yeni geliştiriciler için: mimari, dizin haritası, veri modeli, API, test düzeni, değişmezler, tuzaklar |
| [docs/LLM-MANAGER.md](docs/LLM-MANAGER.md) | `/llm` paneli: nedir, nasıl kurulur ve kullanılır |
| [docs/lisanslar/DEPENDENCIES.md](docs/lisanslar/DEPENDENCIES.md) | Bağımlılık sürümleri ve lisansları (otomatik üretilir) |
