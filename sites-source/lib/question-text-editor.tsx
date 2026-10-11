'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import type {TextMark} from './quiz';
import {readEditorText,writeEditorText} from './editor-text';
export function QuestionTextEditor({text,marks,onChange,badge}:{text:string;marks?:TextMark[];onChange:(value:{text:string;textMarks:TextMark[]})=>void;badge?:ReactNode}){
 const field=useRef<HTMLDivElement>(null),last=useRef('');const signature=JSON.stringify([text,marks||[]]);
 useEffect(()=>{if(field.current&&signature!==last.current){writeEditorText(field.current,text,marks);last.current=signature;}},[signature,text,marks]);
 const change=()=>{if(!field.current)return;const value=readEditorText(field.current);last.current=JSON.stringify([value.text,value.textMarks]);onChange(value);};
 const command=(name:string)=>{field.current?.focus();document.execCommand(name,false);change();};
 return <section className="question-text-editor" aria-label="Soru metninin dönüştürülmüş metin görünümü"><div className="text-editor-heading"><label htmlFor="question-converted-text">Soru metni · Dönüştürülmüş metin görünümü</label>{badge}</div><div className="text-editor-tools" role="toolbar" aria-label="Basit metin düzenleme araçları">{[['bold','Kalın'],['underline','Altı çizili'],['insertUnorderedList','Liste'],['undo','Geri al'],['redo','Yinele'],['removeFormat','Biçimi temizle']].map(([name,label])=><button type="button" key={name} className="btn compact" onMouseDown={e=>e.preventDefault()} onClick={()=>command(name)}>{label}</button>)}</div><div id="question-converted-text" ref={field} role="textbox" aria-label="Soru metni" aria-multiline="true" contentEditable suppressContentEditableWarning className="converted-text-input" data-placeholder="Kaynak PDF’deki soru metnini düzenleyin" onInput={change} onPaste={e=>{e.preventDefault();field.current?.focus();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));change();}}/><p className="subtle">Metni doğrudan düzenleyin; biçimlendirmek için ilgili kısmı seçin.</p></section>;
}
