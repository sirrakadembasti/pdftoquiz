'use server';
import { askLLM } from '../../llm.js';
// Add your host authorization before exposing this action to users.
async function requireAuthorizedUser() { throw new Error('Bu eylemi etkinleştirmeden önce host kullanıcı yetkilendirmesini yapılandırın'); }
export async function ask(prompt) { await requireAuthorizedUser(); return askLLM(prompt); }
