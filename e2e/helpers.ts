import { expect, type Page } from '@playwright/test';

// scripts/e2e-server.mjs ilk öğretmen hesabını bu bilgilerle oluşturur.
export const teacher = { email: process.env.E2E_EMAIL || 'teacher@example.test', password: process.env.E2E_PASSWORD || 'E2e-test-password-2026' };

// Tarayıcı hatalarını ve CSP ihlallerini toplar; testin sonunda boş olmaları beklenir.
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
}

export async function login(page: Page, password = teacher.password) {
  // Giriş sonrası return_to adresine gidilir; hesap sayfasına dönüp oturumu doğrularız.
  await page.goto('/account?return_to=/account');
  // React bağlanmadan doldurulan alanlar boş durumla gönderilir; sayfanın oturum denetimi bitene kadar beklenir.
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-posta').fill(teacher.email);
  await page.getByLabel('Şifre', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('form', { name: 'Şifre değiştir' })).toBeVisible();
}

// Öğretmen oturumu açık bir sayfadan, arayüzdeki yayın akışını atlayıp API ile basit bir metin sınavı oluşturur.
export async function createExam(page: Page, title: string) {
  const exam = {
    title, subject: 'Matematik', duration: 10, sections: [{ id: 's1', name: 'Matematik', order: 0 }],
    questions: [1, 2].map(n => ({ id: 'q' + n, number: n, sectionId: 's1', text: n + ' + ' + n + ' kaçtır?', options: [String(n * 2), String(n * 2 + 1), String(n * 2 + 2), String(n * 2 + 3)], correct: 0, reviewed: true, page: 1, provenance: { text: { source: 'manual', confidence: 1, page: 1, warningCodes: [], locked: true } } })),
  };
  const origin = new URL(page.url()).origin;
  const r = await page.request.post('/api/exams', { headers: { Origin: origin }, multipart: { exam: JSON.stringify(exam), pdf: { name: 'source.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-test') } } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id as string;
}
