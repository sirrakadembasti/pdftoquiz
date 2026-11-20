import {currentUser} from '../../../../lib/session';
import {activeSessions} from '../../../../lib/local-auth';
export async function GET(){const user=await currentUser();return Response.json({user:user?{name:user.name,email:user.email}:null,...(user?{sessions:await activeSessions(user.userId)}:{})},{headers:{'Cache-Control':'no-store'}});}
