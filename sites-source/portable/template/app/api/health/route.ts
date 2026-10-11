import {db} from '../../../lib/db';
export async function GET(){try{await db.$queryRawUnsafe('SELECT 1');await db.user.count();return Response.json({ok:true,storage:'sqlite'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({ok:false},{status:503,headers:{'Cache-Control':'no-store'}});}}
