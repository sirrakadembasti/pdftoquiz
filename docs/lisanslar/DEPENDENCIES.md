# Bağımlılıklar ve lisanslar

Bu dosya ve `docs/lisanslar/vendor/` klasörü `node scripts/licenses.mjs` ile `package.json` ve `node_modules` içeriğinden üretilir; elle düzenlemeyin. `build` komutu dosyaları günceller, standart test paketi güncel olup olmadığını denetler.

Sürümler taşınabilir paketin doğrudan kurulan bağımlılıklarıdır. Tam transitive/işletim sistemi çözümlemesi `pnpm-lock.yaml` içindedir.

| Paket | Kullanılan sürüm | Lisans |
|---|---|---|
| @libsql/client | 0.18.0 | MIT |
| @napi-rs/canvas | 0.1.100 | MIT |
| @sirrakadembasti/llm-manager | 2.0.0 | MIT |
| @tailwindcss/postcss | 4.3.3 | MIT |
| @types/node | 22.19.19 | MIT |
| @types/react | 19.2.14 | MIT |
| @types/react-dom | 19.2.3 | MIT |
| dotenv | 18.0.6 | BSD-2-Clause |
| lucide-react | 1.52.0 | ISC |
| next | 16.4.6 | MIT |
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

`vendor/` doğrudan paketlerin LICENSE/COPYING/NOTICE dosyalarını içerir. Her transitif paketin özgün lisansı kurulumdan sonra `node_modules` içinde korunur. Uygulamanın kendisine yeni bir açık kaynak lisansı atanmamıştır.

PDF.js, Tesseract ve sunulan WASM/dil varlıkları birlikte korunmuştur. Referans sınav PDF'leri `tests/reference/` altındadır.
