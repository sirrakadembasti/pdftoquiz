const databaseName='pdfquiz';
const storeName='draft';
const currentDraftKey='current';

async function openDraftDatabase(){
 return new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(databaseName,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(storeName);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}

export async function draft<T=unknown>(action:'get'|'put'|'delete',value?:T){
 const database=await openDraftDatabase();
 return new Promise<T|undefined>((resolve,reject)=>{
  const transaction=database.transaction(storeName,action==='get'?'readonly':'readwrite');
  const store=transaction.objectStore(storeName);
  const request=action==='get'?store.get(currentDraftKey):action==='put'?store.put(value,currentDraftKey):store.delete(currentDraftKey);
  let result:T|undefined;
  request.onsuccess=()=>{result=request.result as T|undefined;};
  transaction.oncomplete=()=>{database.close();resolve(result);};
  transaction.onerror=()=>{database.close();reject(transaction.error);};
 });
}
