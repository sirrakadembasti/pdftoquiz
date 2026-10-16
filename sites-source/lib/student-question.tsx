import type {Question,TextMark} from './quiz';
import {presentationMode,displaySettings,displayAvailability,displayIssues,type ContentDisplay} from './quiz';
export function StructuredText({text,marks}:{text:string;marks?:TextMark[]}){
 const safe=(marks||[]).filter(m=>Number.isInteger(m.start)&&Number.isInteger(m.end)&&m.start>=0&&m.end>m.start&&m.end<=text.length).sort((a,b)=>a.start-b.start);let position=0;const nodes:React.ReactNode[]=[];
 for(const m of safe){if(m.start<position)continue;if(m.start>position)nodes.push(text.slice(position,m.start));let content:React.ReactNode=text.slice(m.start,m.end);if(m.underline)content=<u>{content}</u>;if(m.bold)content=<strong>{content}</strong>;nodes.push(<span key={m.start}>{content}</span>);position=m.end;}nodes.push(text.slice(position));return <span className="structured-text">{nodes}</span>;
}
// Inputs are the safe student projection, also used by teacher preview.
export function StudentQuestion({question:q,selected,disabled,onSelect}:{question:Question;selected?:number;disabled?:boolean;onSelect:(i:number)=>void}){
 const d=displaySettings(q),mode=presentationMode(q),image=d.question==='image'?(mode==='full-image'?q.image:q.stemImage):undefined;
 return <div className={'student-question mode-'+mode}>
 {image?<img className="question-image" src={image} alt={mode==='full-image'?'Tam soru ve seçenekler':'Soru gövdesi'}/>:<h2><StructuredText text={q.text||'Soru içeriği eksik; öğretmeninize bildirin.'} marks={q.textMarks}/></h2>}
 {mode==='full-image'&&<p className="choice-instruction" id={'choices-'+q.id}>Seçenekler yukarıdaki görseldedir. Cevabınızı seçin.</p>}
 <div className={'quiz-options '+(mode==='full-image'?'compact-choices':'')} role="group" aria-label="Cevap seçenekleri" aria-describedby={mode==='full-image'?'choices-'+q.id:undefined}>
 {q.options.map((o,i)=><button type="button" key={i} aria-label={String.fromCharCode(65+i)+' seçeneği'+(mode==='text'&&o?': '+o:'')} aria-pressed={selected===i} className={selected===i?'picked':''} disabled={disabled} onClick={()=>onSelect(i)}><span>{String.fromCharCode(65+i)}</span>{d.options==='image'&&mode!=='full-image'&&q.optionImages?.[i]?<img className="option-image" src={q.optionImages[i]!} alt={String.fromCharCode(65+i)+' şıkkı içeriği'}/>:d.options==='text'?<p><StructuredText text={o||'İçerik eksik; öğretmeninize bildirin.'} marks={q.optionMarks?.[i]||undefined}/></p>:mode!=='full-image'?<p>Görsel eksik; öğretmeninize bildirin.</p>:null}</button>)}
 </div></div>;
}

export function DisplaySettings({question:q,onChange,onApplyAll,kind}:{question:Question;onChange:(p:Partial<Question>)=>void;onApplyAll:(field:'questionDisplay'|'optionDisplay',value:ContentDisplay)=>void;kind?:'question'|'options'}){
 const d=displaySettings(q),a=displayAvailability(q),kinds=kind?[kind]:['question','options'] as const;
 return <section className="display-settings" aria-label={kind==='options'?'Şık gösterim ayarı':'Soru gösterim ayarı'}>
  {kinds.map(k=>{const field=k==='question'?'questionDisplay':'optionDisplay';return <div className="display-choice" key={k}><label className="display-checkbox"><input type="checkbox" aria-label={k==='question'?'Soru görselini göster':'Cevap şıklarını görsel olarak göster'} checked={d[k]==='image'} onChange={e=>onChange({[field]:e.target.checked?'image':'text'})}/><span>{k==='question'?'Soru görselini göster':'Cevap şıklarını görsel olarak göster'}</span></label><button type="button" className="btn compact" onClick={()=>onApplyAll(field,d[k])}>Tüm sorulara uygula</button>{d[k]==='image'&&!a[k]&&<small role="status">Seçim kaydedildi; güvenli görsel tamamlanana kadar önizleme ve paylaşım engellenir.</small>}</div>;})}
  {(!kind||kind==='options')&&<>{q.hasFigure&&<div role="note" className="figure-options-note"><p>Bu soru şekil içeriyor; metin gösteriminde şekiller görünmez.</p><button type="button" className="btn compact" onClick={()=>onChange({optionDisplay:'image'})}>Görsel göster</button><label className="display-checkbox"><input type="checkbox" aria-label="Şekilli şıkları metin modunda yayınlamayı onayla" checked={!!q.figureOptionsAcknowledged} onChange={e=>onChange({figureOptionsAcknowledged:e.target.checked})}/><span>Metin modunda yayın öncesi kaynakla kontrol ettim.</span></label></div>}{displayIssues(q).map((message,i)=><p role="alert" key={i}>{message}</p>)}{q.penInkRisk&&<p role="alert">KALEM_IZI_RISKI · İşaretsiz kopya önerilir</p>}</>}
 </section>;
}
