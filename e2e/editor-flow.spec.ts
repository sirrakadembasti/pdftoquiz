import { expect, test } from '@playwright/test';
import { login, watchErrors } from './helpers';

// Düzenleyici: PDF içe aktarma → elle düzeltme → önizleme kapısı → önizleme → paylaşım kapısı → yayın → öğrenci görünümü.
test('Düzenleyici: kapılar eksikleri bildirir; düzeltilen sınav önizlenir, yayınlanır ve öğrenciye cevapsız açılır', async ({ page, browser }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  const title = 'E2E editör ' + Date.now();
  await login(page);
  await page.goto('/');
  await page.locator('input[type=file][accept*="application/pdf"]').setInputFiles('tests/fixtures/exam.pdf');
  await expect(page.getByLabel('Çözümleme özeti')).toBeVisible({ timeout: 60_000 });

  // Elle düzeltme: sınav adı ve 1. sorunun A şıkkı.
  await page.getByRole('textbox', { name: 'Sınav adı' }).fill(title);
  await page.getByRole('textbox', { name: 'A seçeneği' }).fill('ALTI');

  // Önizleme kapısı: 3. sorunun şıkları boş olduğundan engellenir; eksik giderilince açılır.
  const preview = page.getByRole('button', { name: 'Önizle', exact: true });
  await preview.click();
  const gate = page.getByRole('alert');
  await expect(gate.getByRole('heading', { name: /Önizleme öncesi 4 kontrol gerekli/ })).toBeVisible();
  await gate.getByRole('button', { name: 'Git' }).first().click();
  for (const [letter, value] of [['A', '1'], ['B', '2'], ['C', '3'], ['D', '4']]) await page.getByRole('textbox', { name: letter + ' seçeneği' }).fill(value);
  await page.getByRole('combobox', { name: 'Sorunun doğru cevabı' }).selectOption('A');
  await preview.click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Sınava başla' }).click();
  await expect(page.getByRole('button', { name: 'A seçeneği: ALTI' })).toBeVisible();
  await page.getByRole('button', { name: 'Önizlemeyi kapat' }).click();

  // Paylaşım kapısı: öğretmen kontrol onayı olmadan yayınlanmaz; onaydan sonra bağlantı üretilir.
  const share = page.getByRole('button', { name: 'Sınavı paylaş' });
  await share.click();
  await expect(gate.getByRole('heading', { name: /Paylaşım öncesi 4 kontrol gerekli/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tüm soruları kontrol ettim' }).click();
  await share.click();
  const dialog = page.getByRole('dialog', { name: 'Sınavınız paylaşılmaya hazır' });
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  const shared = await dialog.locator('input').first().inputValue().catch(async () => await dialog.textContent() || '');
  const link = shared.match(/\?exam=([0-9a-f-]{36})/);
  expect(link, 'paylaşım bağlantısı').not.toBeNull();
  const id = link![1];

  // Öğrenci (oturumsuz bağlam): düzeltilmiş şık görünür, cevap anahtarı yanıtta yoktur.
  const student = await browser.newContext();
  const s = await student.newPage();
  const studentErrors = watchErrors(s);
  // Karşılaştırma: aynı sınavın öğretmen görünümünde anahtar vardır, öğrenci görünümünde yoktur.
  expect(await (await page.request.get('/api/exams/' + id + '?action=edit')).text()).toContain('"correct"');
  const response = await s.request.get('/api/exams/' + id);
  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain('"correct"');
  await s.goto('/?exam=' + id);
  await expect(s.getByRole('heading', { name: title })).toBeVisible();
  await s.getByPlaceholder('Sonuçlarda görünecek adınız').fill('Mehmet Öğrenci');
  await s.getByRole('button', { name: /Sınava başla/ }).click();
  await expect(s.getByRole('button', { name: 'A seçeneği: ALTI' })).toBeVisible();
  await student.close();

  expect(errors).toEqual([]);
  expect(studentErrors).toEqual([]);
});
