import { expect, test } from '@playwright/test';
import { login, teacher, watchErrors } from './helpers';

test('Hesap: uyuşmayan şifre sunucuya gitmez; şifre değişir ve eski haline döndürülür', async ({ page }) => {
  const errors = watchErrors(page);
  const next = 'Yeni-e2e-sifre-2026';
  let current = teacher.password;
  await login(page);
  const form = page.getByRole('form', { name: 'Şifre değiştir' });
  const change = async (from: string, to: string, again = to) => {
    await form.getByLabel('Mevcut şifre').fill(from);
    await form.getByLabel('Yeni şifre (en az 12 karakter)').fill(to);
    await form.getByLabel('Yeni şifre (tekrar)').fill(again);
    await form.getByRole('button', { name: 'Şifreyi değiştir' }).click();
  };
  let calls = 0;
  page.on('request', r => { if (r.url().endsWith('/api/auth/password')) calls++; });
  try {
    await change(teacher.password, next, 'Farkli-e2e-sifre-2026');
    await expect(page.getByRole('alert').or(page.getByRole('status')).first()).toBeVisible();
    expect(calls).toBe(0);

    await change(teacher.password, next);
    await expect.poll(() => calls).toBe(1);
    current = next;
    // Çıkış sayfayı kendisi /account'a yönlendirir; giriş formu görünmeden yeni gezinme başlatılmaz.
    await page.getByRole('button', { name: 'Çıkış yap' }).click();
    await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeVisible();
    await login(page, next);
    await change(next, teacher.password);
    await expect.poll(() => calls).toBe(2);
    current = teacher.password;
  } finally {
    // Test yarıda kalsa bile sonraki testler için şifre eski haline döner.
    if (current !== teacher.password) {
      const origin = new URL(page.url()).origin;
      await page.request.post('/api/auth/login', { headers: { Origin: origin }, data: { email: teacher.email, password: current } });
      await page.request.post('/api/auth/password', { headers: { Origin: origin }, data: { current, next: teacher.password } });
    }
  }
  expect(errors).toEqual([]);
});
