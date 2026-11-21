import { expect, test } from '@playwright/test';
import { login, watchErrors } from './helpers';

// PDF.js ve Tesseract (worker + WASM) yerel dosyalardan, CSP altında gerçek tarayıcıda çalışmalı.
for (const [file, label, timeout] of [['exam.pdf', 'dijital', 60_000], ['scanned.pdf', 'taranmış (OCR)', 240_000]] as const) {
  test(`PDF yükleme: ${label} belge düzenleyicide sorulara dönüşür, CSP ihlali olmaz`, async ({ page }) => {
    test.setTimeout(timeout + 30_000);
    const errors = watchErrors(page);
    await login(page);
    await page.goto('/');
    await page.locator('input[type=file][accept*="application/pdf"]').setInputFiles('tests/fixtures/' + file);
    const summary = page.getByLabel('Çözümleme özeti');
    await expect(summary).toBeVisible({ timeout });
    await expect(summary).toContainText(/[1-9]\d*\s+soru/);
    expect(errors).toEqual([]);
  });
}
