import { expect, test } from '@playwright/test';
import { createExam, login, watchErrors } from './helpers';

test('Öğrenci sınavı çözer; öğretmen sonuç tablosunu görür, CSV indirir ve sınavı kapatır', async ({ page, browser }) => {
  const errors = watchErrors(page);
  await login(page);
  const title = 'E2E deneme ' + Date.now();
  const id = await createExam(page, title);

  // Öğrenci ayrı, oturumsuz bir tarayıcı bağlamında çözer.
  const student = await browser.newContext();
  const s = await student.newPage();
  const studentErrors = watchErrors(s);
  await s.goto('/?exam=' + id);
  await expect(s.getByRole('heading', { name: title })).toBeVisible();
  await s.getByPlaceholder('Sonuçlarda görünecek adınız').fill('Ayşe Öğrenci');
  await s.getByRole('button', { name: /Sınava başla/ }).click();
  await s.getByRole('button', { name: /^A seçeneği/ }).click();
  await s.getByRole('button', { name: /Sonraki soru/ }).click();
  await s.getByRole('button', { name: /^B seçeneği/ }).click();
  await s.getByRole('button', { name: /Sınavı bitir/ }).last().click();
  await s.getByRole('dialog').getByRole('button', { name: 'Bitir ve gönder' }).click();
  await expect(s.getByText('Emeğinize sağlık.')).toBeVisible();
  await expect(s.locator('.score')).toContainText('50');

  // Öğretmen: Sınavlarım → sonuçlar.
  await page.goto('/');
  await page.getByRole('button', { name: /Sınavlarım/ }).first().click();
  const card = page.locator('.saved-card').filter({ has: page.getByRole('heading', { name: title }) });
  await card.getByTitle('Öğrenci sonuçları').click();
  const results = page.getByRole('dialog', { name: title + ' — Öğrenci sonuçları' });
  await expect(results.getByRole('row').filter({ hasText: 'Ayşe Öğrenci' })).toContainText('50');
  const [download] = await Promise.all([page.waitForEvent('download'), results.getByRole('link', { name: /CSV indir/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^sonuclar-[a-f0-9]{8}\.csv$/);
  const csv = await download.createReadStream().then(async stream => { const parts: Buffer[] = []; for await (const c of stream) parts.push(c as Buffer); return Buffer.concat(parts).toString('utf8'); });
  expect(csv.startsWith('﻿Öğrenci;Puan;')).toBe(true);
  expect(csv).toContain('Ayşe Öğrenci;50;');
  await results.getByRole('button', { name: 'Kapat' }).click();

  // Erişim ayarı: sınavı kapat; öğrenci bağlantısı artık açılmaz.
  await card.getByTitle(/Erişim ayarı/).click();
  const access = page.getByRole('dialog', { name: title + ' — Erişim ayarı' });
  await access.getByLabel(/Sınavı kapat/).check();
  await access.getByRole('button', { name: /Kaydet/ }).click();
  await expect(access).toBeHidden();
  await expect(card).toContainText('KAPALI');
  const late = await student.newPage();
  await late.goto('/?exam=' + id);
  await expect(late.getByRole('heading', { name: 'Sınav açılamadı.' })).toBeVisible();
  await student.close();

  expect(errors).toEqual([]);
  expect(studentErrors).toEqual([]);
});
