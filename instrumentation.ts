// Next.js sunucu başlarken bir kez çağrılır (https://nextjs.org/docs/app/guides/instrumentation).
export async function register(){
  if(process.env.NEXT_RUNTIME!=='nodejs')return;
  try{
    const {ensureInitialTeacher}=await import('./lib/initial-account');
    const result=await ensureInitialTeacher();
    if(result==='created')console.log('İlk öğretmen hesabı .env içindeki INITIAL_ADMIN_* değerleriyle oluşturuldu.');
    if(result==='invalid')console.warn('INITIAL_ADMIN_* değerleri geçersiz (e-posta biçimi veya şifre 12–256 karakter); ilk hesap oluşturulmadı.');
  }catch(error){
    console.warn('İlk öğretmen hesabı kontrol edilemedi:',error instanceof Error?error.message:error);
  }
}
