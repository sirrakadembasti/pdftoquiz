import {currentUser} from '../../../../lib/session';
export async function GET(){const user=await currentUser();return Response.json({user:user?{name:user.name,email:user.email}:null},{headers:{'Cache-Control':'no-store'}});}
