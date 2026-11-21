# CLAUDE.md

Bu projenin kodla doğrulanmış ayrıntılı rehberi `AGENTS.md`'dir ve aşağıda içe aktarılır; mimari, API, test düzeni, ortam ve değişmezler oradadır. Bu dosya yalnız Claude Code oturumları için çalışma akışını ve AGENTS.md'de bulunmayan, pratikte doğrulanmış notları ekler.

**Yeni oturumda önce:** [docs/YOL-HARITASI.md](docs/YOL-HARITASI.md) içindeki "Devam rehberi" bölümünü okuyun; tamamlanan işler, açık işlerin öncelik sırası ve her açığın kök nedeni oradadır.

@AGENTS.md

## Çalışma akışı

- Yanıtlar, commit mesajları, PR metinleri ve belgeler Türkçe.
- Her iş ayrı dalda (`feat/`, `fix/`, `refactor/`, `test/`, `docs/`), Conventional Commits (`refactor: …`, `fix(test): …`) ile commit edilir, PR açılır. Commit, push, PR ve `main`'e birleştirme (merge commit, `gh pr merge N --merge`) kullanıcı onayıyla yapılır. PR'dan ve birleştirmeden sonra CI sonucu (`gh run watch <id> --exit-status`) takip edilip bildirilir.
- Bir hatayı düzeltmeden önce onu yeniden üreten test yazılır; ara sıra kalan testlerde nedeni kanıtlamadan (ör. saati dondurarak) düzeltme yapılmaz.
- Doğrulama: `node node_modules/typescript/bin/tsc --noEmit --incremental false --noUnusedLocals --noUnusedParameters`, `pnpm test`; sunucu/derleme/arayüz değiştiyse `pnpm build`, `pnpm test:server`, `pnpm test:e2e`. Dönüşüm hattı (`lib/pdf-*.ts`, `lib/quiz.ts`) değiştiyse ayrıca `pnpm reference`.

## Pratikte doğrulanmış notlar (21 Kasım 2026)

- **Uzun satırlı dosyalar:** `app/page.tsx` gibi dosyalarda büyük blok taşırken satırları elle yeniden yazmayın; satırları birebir kopyalayan küçük bir Node betiği kullanın, sınır satırlarını betikte doğrulayın, ardından `tsc --noUnusedLocals` çıktısına göre kullanılmayan import'ları temizleyin.
- **Yeni `app/` modülü:** 6 test dosyasındaki derleme listelerine (`for(const name of [...])`, `app/page.tsx`'ten önce) ve `tests/ui-followup-regression.mjs` içindeki kaynak dosya listesine eklenir. Bu listeleri `sed` ile toplu güncellerken `if(name==='app/page.tsx')` gibi koşulları ve `readFileSync` çağrılarını da değiştirmediğinizi `git diff` ile kontrol edin.
- **Node'da OCR:** `tesseract.js`, `global.document` tanımlıyken yüklenirse tarayıcı sürümünü seçer ve her sayfa `OCR_FAILED` olur; `document` tanımlanmadan `require` edin (bkz. `tests/scanned-sections-regression.mjs`).
- **Zaman varsayımları:** Art arda yapılan işlemler aynı milisaniyeye düşebilir (CI makinesi hızlıdır); zamana göre sıralanan sonuçları sınayan testlerde işlemler arasına kısa bekleme koyun.
- **Playwright:** Next sayfasındaki form, React bağlanmadan doldurulursa boş durumla gönderilir (`login()` bu yüzden `networkidle` bekler). Sayfa kendi yönlendirmesini yaparken (`location.assign`) yeni `page.goto` çağırmayın; `ERR_ABORTED` ile kesilir.
- **Fixture:** `tests/fixtures/scanned-sections.pdf` yalnız `node scripts/fixtures/scanned-sections.mjs` ile üretilir; test doğru şıkları ve anahtarı üreteçten okur. Gerçek (telifli) sınav PDF'leri repoya konmaz.
