import 'dotenv/config';
import {createClient, type Client, type InValue} from '@libsql/client';
import {resolve,dirname} from 'node:path';
import {mkdirSync} from 'node:fs';

const raw=process.env.DATABASE_URL||'file:./data/quiz.db';
if(!raw.startsWith('file:'))throw new Error('Yerel SQLite file: adresi gerekli.');
export const databasePath=resolve(raw.slice(5));
mkdirSync(dirname(databasePath),{recursive:true});

export type User={id:string;email:string;name:string;passwordHash:string;createdAt:Date};
type Session={tokenHash:string;userId:string;expiresAt:Date;user?:User};
type LoginLimit={key:string;count:number;expiresAt:Date};
type StoredObject={key:string;data:Uint8Array;contentType:string|null;customMetadata:string|null;updatedAt:Date};
type Row=Record<string,unknown>;

const schema=[
 'PRAGMA foreign_keys = ON',
 'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
 'CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")',
 'CREATE TABLE IF NOT EXISTS "Session" ("tokenHash" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE)',
 'CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt")',
 'CREATE TABLE IF NOT EXISTS "LoginLimit" ("key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" DATETIME NOT NULL)',
 'CREATE TABLE IF NOT EXISTS "StoredObject" ("key" TEXT NOT NULL PRIMARY KEY, "data" BLOB NOT NULL, "contentType" TEXT, "customMetadata" TEXT, "updatedAt" DATETIME NOT NULL)'
];

const globalDb=globalThis as unknown as {quizSql?:Client;quizSchema?:Promise<void>};
const client=globalDb.quizSql??createClient({url:'file:'+databasePath});
if(process.env.NODE_ENV!=='production')globalDb.quizSql=client;
export async function ensureDatabase(){
 const pending=globalDb.quizSchema??(async()=>{for(const sql of schema)await client.execute(sql);})();
 if(process.env.NODE_ENV!=='production')globalDb.quizSchema=pending;
 await pending;
}

const date=(value:unknown)=>new Date(String(value));
const user=(row:Row):User=>({id:String(row.id),email:String(row.email),name:String(row.name),passwordHash:String(row.passwordHash),createdAt:date(row.createdAt)});
const blob=(value:unknown)=>value instanceof Uint8Array?value:value instanceof ArrayBuffer?new Uint8Array(value):new Uint8Array();
async function execute(sql:string,args:InValue[]=[]){await ensureDatabase();return client.execute({sql,args});}

export const db={
 async $queryRawUnsafe(sql:string){return execute(sql);},
 async $disconnect(){client.close();if(process.env.NODE_ENV!=='production'){delete globalDb.quizSql;delete globalDb.quizSchema;}},
 user:{
  async count(){const result=await execute('SELECT COUNT(*) AS count FROM "User"');return Number(result.rows[0]?.count||0);},
  async create({data}:{data:{email:string;name:string;passwordHash:string}}){const id=crypto.randomUUID(),createdAt=new Date();await execute('INSERT INTO "User" ("id","email","name","passwordHash","createdAt") VALUES (?,?,?,?,?)',[id,data.email,data.name,data.passwordHash,createdAt.toISOString()]);return {id,...data,createdAt};},
  async findUnique({where}:{where:{email:string}}){const result=await execute('SELECT * FROM "User" WHERE "email" = ? LIMIT 1',[where.email]);return result.rows[0]?user(result.rows[0] as Row):null;},
  async update({where,data}:{where:{email:string};data:{passwordHash:string}}){await execute('UPDATE "User" SET "passwordHash" = ? WHERE "email" = ?',[data.passwordHash,where.email]);return db.user.findUnique({where});}
 },
 session:{
  async deleteMany({where}:{where:{tokenHash?:string;expiresAt?:{lt:Date};user?:{email:string};userId?:string;exceptTokenHash?:string}}){let sql='DELETE FROM "Session"',args:InValue[]=[];if(where.userId){sql+=' WHERE "userId" = ?'+(where.exceptTokenHash?' AND "tokenHash" <> ?':'');args=where.exceptTokenHash?[where.userId,where.exceptTokenHash]:[where.userId];}else if(where.tokenHash){sql+=' WHERE "tokenHash" = ?';args=[where.tokenHash];}else if(where.expiresAt){sql+=' WHERE "expiresAt" < ?';args=[where.expiresAt.lt.toISOString()];}else if(where.user){sql+=' WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email" = ?)';args=[where.user.email];}const result=await execute(sql,args);return {count:result.rowsAffected};},
  async count({where}:{where:{userId:string}}){const r=await execute('SELECT COUNT(*) AS count FROM "Session" WHERE "userId"=? AND "expiresAt">?',[where.userId,new Date().toISOString()]);return Number(r.rows[0]?.count||0);},
  async create({data}:{data:{tokenHash:string;userId:string;expiresAt:Date}}){await execute('INSERT INTO "Session" ("tokenHash","userId","expiresAt") VALUES (?,?,?)',[data.tokenHash,data.userId,data.expiresAt.toISOString()]);return data;},
  async findUnique({where,include}:{where:{tokenHash:string};include?:{user:boolean}}):Promise<Session|null>{const sql=include?.user?'SELECT s.*,u."id" AS "u_id",u."email" AS "u_email",u."name" AS "u_name",u."passwordHash" AS "u_passwordHash",u."createdAt" AS "u_createdAt" FROM "Session" s JOIN "User" u ON u."id"=s."userId" WHERE s."tokenHash"=? LIMIT 1':'SELECT * FROM "Session" WHERE "tokenHash"=? LIMIT 1';const result=await execute(sql,[where.tokenHash]);const row=result.rows[0] as Row|undefined;if(!row)return null;const found:Session={tokenHash:String(row.tokenHash),userId:String(row.userId),expiresAt:date(row.expiresAt)};if(include?.user)found.user=user({id:row.u_id,email:row.u_email,name:row.u_name,passwordHash:row.u_passwordHash,createdAt:row.u_createdAt});return found;}
 },
 loginLimit:{
  async findUnique({where}:{where:{key:string}}):Promise<LoginLimit|null>{const result=await execute('SELECT * FROM "LoginLimit" WHERE "key"=? LIMIT 1',[where.key]);const row=result.rows[0] as Row|undefined;return row?{key:String(row.key),count:Number(row.count),expiresAt:date(row.expiresAt)}:null;},
  async upsert({where,create,update}:{where:{key:string};create:LoginLimit;update:{count:number;expiresAt:Date}}){await execute('INSERT INTO "LoginLimit" ("key","count","expiresAt") VALUES (?,?,?) ON CONFLICT("key") DO UPDATE SET "count"=excluded."count","expiresAt"=excluded."expiresAt"',[where.key,create.count,create.expiresAt.toISOString()]);return {...create,...update,key:where.key};},
  async update({where,data}:{where:{key:string};data:{count:{increment:number}}}){await execute('UPDATE "LoginLimit" SET "count"="count"+? WHERE "key"=?',[data.count.increment,where.key]);return db.loginLimit.findUnique({where});},
  async deleteMany({where}:{where:{key:string}}){const result=await execute('DELETE FROM "LoginLimit" WHERE "key"=?',[where.key]);return {count:result.rowsAffected};}
 },
 storedObject:{
  async upsert({where,create,update}:{where:{key:string};create:{key:string;data:Uint8Array;contentType:string|null;customMetadata:string|null};update:{data:Uint8Array;contentType:string|null;customMetadata:string|null}}){const now=new Date().toISOString();await execute('INSERT INTO "StoredObject" ("key","data","contentType","customMetadata","updatedAt") VALUES (?,?,?,?,?) ON CONFLICT("key") DO UPDATE SET "data"=excluded."data","contentType"=excluded."contentType","customMetadata"=excluded."customMetadata","updatedAt"=excluded."updatedAt"',[where.key,create.data,create.contentType,create.customMetadata,now]);return {...create,...update,updatedAt:new Date(now)};},
  async insertIfAbsent({key,data}:{key:string;data:Uint8Array}){const result=await execute('INSERT INTO "StoredObject" ("key","data","contentType","customMetadata","updatedAt") VALUES (?,?,NULL,NULL,?) ON CONFLICT("key") DO NOTHING',[key,data,new Date().toISOString()]);return result.rowsAffected;},
  async delete({where}:{where:{key:string}}){const result=await execute('DELETE FROM "StoredObject" WHERE "key"=?',[where.key]);return result.rowsAffected;},
  async findUnique({where}:{where:{key:string}}):Promise<StoredObject|null>{const result=await execute('SELECT * FROM "StoredObject" WHERE "key"=? LIMIT 1',[where.key]);const row=result.rows[0] as Row|undefined;return row?{key:String(row.key),data:blob(row.data),contentType:row.contentType==null?null:String(row.contentType),customMetadata:row.customMetadata==null?null:String(row.customMetadata),updatedAt:date(row.updatedAt)}:null;},
  async findMany({where,orderBy,take,after}:{where:{key:{startsWith:string}};orderBy:{key:'asc'};take:number;after?:string;select:{key:boolean;customMetadata:boolean}}){void orderBy;const result=await execute('SELECT "key","customMetadata" FROM "StoredObject" WHERE "key" LIKE ? ESCAPE \'\\\' '+(after?'AND "key" > ? ':'')+'ORDER BY "key" ASC LIMIT ?',[where.key.startsWith.replaceAll('\\','\\\\').replaceAll('%','\\%').replaceAll('_','\\_')+'%',...(after?[after]:[]),take]);return result.rows.map(row=>({key:String(row.key),customMetadata:row.customMetadata==null?null:String(row.customMetadata)}));}
 }
};
