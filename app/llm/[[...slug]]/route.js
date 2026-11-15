export const runtime = 'nodejs';
import { llm } from '../../../llm.js';
export const GET = (req) => llm.fetch(req);
export const POST = (req) => llm.fetch(req);
export const PUT = (req) => llm.fetch(req);
export const DELETE = (req) => llm.fetch(req);
