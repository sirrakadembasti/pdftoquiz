# Bağımlılıklar ve lisanslar — 7 Ekim 2026

Sürümler taşınabilir paketin doğrudan kurulan bağımlılıklarıdır. Tam transitive/işletim sistemi çözümlemesi pnpm-lock.yaml içindedir. PDF/OCR/TypeScript/ESLint major sürümleri uyumluluk doğrulanmadan yükseltilmedi.

| Paket | Kullanılan sürüm | Lisans |
|---|---|---|
| @libsql/client | 0.18.0 | MIT |
| @napi-rs/canvas | 0.1.100 | MIT |
| @tailwindcss/postcss | 4.3.3 | MIT |
| @types/node | 22.19.19 | MIT |
| @types/react | 19.2.14 | MIT |
| @types/react-dom | 19.2.3 | MIT |
| dotenv | 18.0.6 | BSD-2-Clause |
| eslint | 9.39.4 | MIT |
| eslint-config-next | 16.4.0 | MIT |
| lucide-react | 1.52.0 | ISC |
| next | 16.4.0 | MIT |
| pdfjs-dist | 5.4.296 | Apache-2.0 |
| react | 19.3.0 | MIT |
| react-dom | 19.3.0 | MIT |
| react-test-renderer | 19.3.0 | MIT |
| tailwindcss | 4.3.3 | MIT |
| tesseract.js | 5.1.1 | Apache-2.0 |
| tsx | 4.23.15 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| zod | 3.25.76 | MIT |

pnpm: 11.25.0, MIT; tools/pnpm dağıtımının özgün lisans ve bildirimleri dahil.

VENDOR-LICENSES doğrudan paketlerin mevcut LICENSE/COPYING/NOTICE dosyalarını içerir. Her transitif paketin özgün lisansı kurulumdan sonra node_modules içinde korunur. Kullanıcının uygulamasına yeni bir açık kaynak lisansı atanmamıştır.

PDF.js, Tesseract ve sunulan WASM/dil varlıkları birlikte korunmuştur. Gerçek referans sınav PDF'leri `tests/reference/` altındadır.

## 23 Ekim 2026 bakım güncellemesi

Uygulama kaynaklarında kullanılmayan örnek UI bileşenleri, bunlara ait doğrudan paketler ve kullanılmayan D1/Drizzle örnek altyapısı kaldırıldı. Kilit dosyaları ve dağıtılan doğrudan lisans envanteri bu gerçek çalışma kümesine göre yenilendi. Toplu cevap aktarımı ve Docker/libSQL düzenlemesi yeni bağımlılık eklemedi.

## 6 Kasım 2026 temizliği

Kullanılmayan Prisma paketleri (`@prisma/client`, `@prisma/adapter-libsql`, `prisma`), `prisma/` şema–migrasyon klasörü ve `prisma.config.ts` kaldırıldı. SQLite şeması tek kaynak olarak `lib/db.ts` içindedir; `db:migrate` eksik tabloları oluşturur. Eski ChatGPT Sites profili (`sites-source/`) ve ChatGPT kimlik adlandırması da kaldırıldı; oturum okuma `lib/session.ts` içindedir.
