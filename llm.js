import { createLLMManager } from '@sirrakadembasti/llm-manager/core';
try { process.loadEnvFile?.('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
export const llm = createLLMManager({
  dataDir: process.env.LLM_DATA_DIR || './data',
  adminUser: process.env.LLM_ADMIN_USER || 'admin',
  adminPassword: process.env.LLM_ADMIN_PASSWORD,
  chatTokens: process.env.LLM_CHAT_TOKENS?.split(',')
});
const managementFetch = llm.fetch;
llm.fetch = (request, options = {}) => !process.env.LLM_ADMIN_PASSWORD ? notConfigured(request) : managementFetch(request, {
  pagePath: process.env.LLM_PAGE_PATH || "/llm",
  apiPath: process.env.LLM_API_PATH || "/api/llm",
  ...options
});
export async function askLLM(prompt, options = {}) { return llm.ask(prompt, options); }


// Parola tanımlı değilse panel bilerek kapalıdır: paket 500 yerine açıklayıcı 503 döner.
function notConfigured(request) {
  const message = 'LLM Manager kapalı: .env dosyasında LLM_ADMIN_PASSWORD tanımlayıp sunucuyu yeniden başlatın.';
  const headers = { 'Cache-Control': 'no-store', 'Retry-After': '3600' };
  if ((request.headers.get('accept') || '').includes('text/html')) {
    return new Response('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LLM Manager kapalı</title><body style="font-family:system-ui;max-width:36rem;margin:4rem auto;padding:0 1rem"><h1>LLM Manager kapalı</h1><p>' + message + '</p></body></html>', { status: 503, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return Response.json({ code: 'AUTH_NOT_CONFIGURED', error: message }, { status: 503, headers });
}
