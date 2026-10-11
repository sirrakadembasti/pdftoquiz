# Bağımlılıklar ve lisanslar — 7 Ekim 2026

Sürümler taşınabilir paketin doğrudan kurulan bağımlılıklarıdır. Tam transitive/işletim sistemi çözümlemesi pnpm-lock.yaml içindedir. PDF/OCR/TypeScript/ESLint major sürümleri uyumluluk doğrulanmadan yükseltilmedi.

| Paket | Kullanılan sürüm | Lisans |
|---|---|---|
| @base-ui/react | 1.8.0 | MIT |
| @hookform/resolvers | 5.9.1 | MIT |
| @libsql/client | 0.18.0 | MIT |
| @napi-rs/canvas | 0.1.100 | MIT |
| @prisma/adapter-libsql | 7.10.0 | Apache-2.0 |
| @prisma/client | 7.10.0 | Apache-2.0 |
| @shadcn/react | 0.3.1 | MIT |
| @tailwindcss/postcss | 4.3.3 | MIT |
| @types/node | 22.19.19 | MIT |
| @types/react | 19.2.14 | MIT |
| @types/react-dom | 19.2.3 | MIT |
| class-variance-authority | 0.7.1 | Apache-2.0 |
| clsx | 2.1.1 | MIT |
| cmdk | 1.1.1 | MIT |
| date-fns | 4.4.0 | MIT |
| dotenv | 18.0.6 | BSD-2-Clause |
| embla-carousel-react | 8.6.0 | MIT |
| eslint | 9.39.4 | MIT |
| eslint-config-next | 16.4.0 | MIT |
| input-otp | 1.5.0 | MIT |
| lucide-react | 1.52.0 | ISC |
| next | 16.4.0 | MIT |
| next-themes | 0.4.6 | MIT |
| pdfjs-dist | 5.4.296 | Apache-2.0 |
| prisma | 7.10.0 | Apache-2.0 |
| radix-ui | 1.7.0 | MIT |
| react | 19.3.0 | MIT |
| react-day-picker | 10.0.2 | MIT |
| react-dom | 19.3.0 | MIT |
| react-hook-form | 7.89.0 | MIT |
| react-resizable-panels | 4.14.2 | MIT |
| react-test-renderer | 19.3.0 | MIT |
| recharts | 3.10.1 | MIT |
| sonner | 2.0.8 | MIT |
| tailwind-merge | 3.6.0 | MIT |
| tailwindcss | 4.3.3 | MIT |
| tesseract.js | 5.1.1 | Apache-2.0 |
| tsx | 4.23.15 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| vaul | 1.1.2 | MIT |
| zod | 3.25.76 | MIT |

pnpm: 11.25.0, MIT; tools/pnpm dağıtımının özgün lisans ve bildirimleri dahil.

VENDOR-LICENSES doğrudan paketlerin mevcut LICENSE/COPYING/NOTICE dosyalarını içerir. Her transitif paketin özgün lisansı kurulumdan sonra node_modules içinde korunur. Kullanıcının uygulamasına yeni bir açık kaynak lisansı atanmamıştır.

PDF.js, Tesseract ve sunulan WASM/dil varlıkları birlikte korunmuştur; gerçek telifli referans sınavı pakete eklenmemiştir.


## 11 Ekim 2026 uygulama geliştirmeleri

Birleşik metin editörü, checkbox gösterimi, cevap tablosu ve body hydration istisnası için yeni bağımlılık eklenmedi. Next/React/PDF.js/Tesseract sürümleri ve OCR tur+eng/OEM1/PSM11/144 DPI parametreleri bu değişikliklerle değiştirilmedi. Vendor lisansları aynen korunur.
