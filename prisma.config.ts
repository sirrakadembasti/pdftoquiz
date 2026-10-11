import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {resolve} from 'node:path';
const raw=process.env.DATABASE_URL||'file:./data/quiz.db';
if(!raw.startsWith('file:'))throw new Error('Bu paket yerel SQLite file: adresi gerektirir.');
export default defineConfig({schema:'prisma/schema.prisma',migrations:{path:'prisma/migrations'},datasource:{url:'file:'+resolve(raw.slice(5))}});
