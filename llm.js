import { createLLMManager } from '@sirrakadembasti/llm-manager/core';
try { process.loadEnvFile?.('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
export const llm = createLLMManager({
  dataDir: process.env.LLM_DATA_DIR || './data',
  adminUser: process.env.LLM_ADMIN_USER || 'admin',
  adminPassword: process.env.LLM_ADMIN_PASSWORD,
  chatTokens: process.env.LLM_CHAT_TOKENS?.split(',')
});
const managementFetch = llm.fetch;
llm.fetch = (request, options = {}) => managementFetch(request, {
  pagePath: process.env.LLM_PAGE_PATH || "/llm",
  apiPath: process.env.LLM_API_PATH || "/api/llm",
  ...options
});
export async function askLLM(prompt, options = {}) { return llm.ask(prompt, options); }

