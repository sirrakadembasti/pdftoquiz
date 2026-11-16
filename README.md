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
node scripts/setup.mjs
pnpm dev
```

http://localhost:3000 adresini açın; `setup` terminalde ilk öğretmen hesabını gösterir, /account sayfasından giriş yapın.

## Komutlar

Hepsi `pnpm <komut>` ile çalışır (`setup` hariç: `node scripts/setup.mjs`).

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
| [docs/LLM-MANAGER.md](docs/LLM-MANAGER.md) | `/llm` paneli: nedir, nasıl kurulur ve kullanılır |
| [docs/lisanslar/DEPENDENCIES.md](docs/lisanslar/DEPENDENCIES.md) | Bağımlılık sürümleri ve lisansları (otomatik üretilir) |
