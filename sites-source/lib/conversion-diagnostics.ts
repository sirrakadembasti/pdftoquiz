import type {Line} from './pdf-layout';
export type DiagnosticPage={page:number;reading:'digital'|'ocr';lines:Line[];width?:number;height?:number;pngHash?:string;ms:number;failure?:string};
export type DiagnosticPackage={format:'pdfquiz-diagnostics';version:1;appVersion:string;created:string;device:{userAgent:string;platform:string;cores?:number;memoryGiB?:number};parameters:{language:string;oem:number;psm:number;renderDpi:number;hintDpi:number;numberStrips:number};pages:DiagnosticPage[];warningCodes:string[]};
export function diagnosticPackage(pages:DiagnosticPage[],warningCodes:string[]=[]):DiagnosticPackage{
 const n=typeof navigator==='undefined'?undefined:navigator;
 return {format:'pdfquiz-diagnostics',version:1,appVersion:'2.0.10',created:new Date().toISOString(),device:{userAgent:n?.userAgent||'Node',platform:n?.platform||'Node',cores:n?.hardwareConcurrency,memoryGiB:(n as any)?.deviceMemory},parameters:{language:'tur+eng',oem:1,psm:11,renderDpi:144,hintDpi:150,numberStrips:6},pages,warningCodes:[...new Set(warningCodes)]};
}
export async function canvasPNGHash(c:HTMLCanvasElement){const base64=c.toDataURL('image/png').split(',')[1],bytes=Uint8Array.from(atob(base64),s=>s.charCodeAt(0)),digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');}
