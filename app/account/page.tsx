'use client';
import {useEffect,useState} from 'react';
async function call(url:string,body?:unknown){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body??{})});let d:any={};try{d=await r.json();}catch{}if(!r.ok)throw new Error(d.error||'İşlem tamamlanamadı.');return d;}
export default function Account(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[user,setUser]=useState<any>(null),[sessions,setSessions]=useState<number|null>(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[again,setAgain]=useState('');
 const refresh=()=>fetch('/api/auth/me').then(r=>r.json()).then(d=>{setUser(d.user);setSessions(typeof d.sessions==='number'?d.sessions:null);}).catch(()=>setNotice('Sunucuya erişilemiyor.'));
 useEffect(()=>{refresh();},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}),d=await r.json();if(!r.ok)throw new Error(d.error);const path=new URLSearchParams(location.search).get('return_to')||'/';location.assign(path.startsWith('/')&&!path.startsWith('//')?path:'/');}catch(e:any){setNotice(e.message);}finally{setPassword('');setBusy(false);}}
 async function logout(){setBusy(true);try{const r=await fetch('/api/auth/logout',{method:'POST'});if(!r.ok)throw new Error('Çıkış tamamlanamadı.');setUser(null);location.assign('/account');}catch(e:any){setNotice(e.message);}finally{setBusy(false);}}
 async function changePassword(e:React.FormEvent){e.preventDefault();setNotice('');if(next!==again){setNotice('Yeni şifreler aynı değil.');return;}if(next.length<12){setNotice('Yeni şifre en az 12 karakter olmalı.');return;}setBusy(true);try{const d=await call('/api/auth/password',{current,next});setNotice('Şifre değiştirildi.'+(d.revoked?` Diğer ${d.revoked} oturum kapatıldı.`:''));setCurrent('');setNext('');setAgain('');await refresh();}catch(e:any){setNotice(e.message);}finally{setBusy(false);}}
 async function revoke(scope:'others'|'all'){setBusy(true);setNotice('');try{const d=await call('/api/auth/sessions',{scope});if(scope==='all'){location.assign('/account');return;}setNotice(d.revoked?`${d.revoked} diğer oturum kapatıldı.`:'Kapatılacak başka oturum yok.');await refresh();}catch(e:any){setNotice(e.message);}finally{setBusy(false);}}
 return <main style={{maxWidth:480,margin:'60px auto',padding:24}}><div className="eyebrow">PDF → ONLINE QUIZ</div><h1>Öğretmen hesabı</h1><p>Öğrenciler paylaşılan sınav bağlantısından katılır; öğretmen hesabı gerekmez.</p>
 {user?<>
  <p>{user.name} · {user.email}</p>
  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><a className="btn primary" href="/">Sınavlarıma git</a><button className="btn" disabled={busy} onClick={logout}>Çıkış yap</button></div>
  <form onSubmit={changePassword} aria-label="Şifre değiştir" style={{display:'grid',gap:16,marginTop:32}}><h2>Şifre değiştir</h2>
   <label>Mevcut şifre<input type="password" autoComplete="current-password" required value={current} onChange={e=>setCurrent(e.target.value)}/></label>
   <label>Yeni şifre (en az 12 karakter)<input type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={next} onChange={e=>setNext(e.target.value)}/></label>
   <label>Yeni şifre (tekrar)<input type="password" autoComplete="new-password" required value={again} onChange={e=>setAgain(e.target.value)}/></label>
   <button className="btn primary" disabled={busy}>Şifreyi değiştir</button><p className="subtle">Şifre değişince bu cihaz dışındaki tüm oturumlar kapanır.</p></form>
  <section aria-label="Oturumlar" style={{display:'grid',gap:12,marginTop:32}}><h2>Oturumlar</h2>
   <p>{sessions===null?'Etkin oturum sayısı okunamadı.':`${sessions} etkin oturum (bu cihaz dahil).`} Oturumlar 7 gün sonra kendiliğinden sona erer.</p>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="btn" disabled={busy} onClick={()=>revoke('others')}>Diğer oturumları kapat</button><button className="btn" disabled={busy} onClick={()=>revoke('all')}>Tüm oturumlardan çık</button></div></section>
 </>:<form onSubmit={login} style={{display:'grid',gap:20,marginTop:24}}><label>E-posta<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Şifre<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary" disabled={busy}>{busy?'Giriş yapılıyor…':'Giriş yap'}</button><p className="subtle">İlk hesabın bilgileri kurulum terminalinde gösterilir. Yeni öğretmen hesabı sunucudaki kullanıcı komutuyla eklenir.</p></form>}
 {notice&&<p role="alert">{notice}</p>}<p><a href="/">Ana ekrana dön</a></p></main>;
}
