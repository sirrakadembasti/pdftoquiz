import type {NextConfig} from 'next';
// CSP: PDF.js/Tesseract WASM için 'wasm-unsafe-eval', çalışanlar için worker-src 'self' blob:. AI istekleri sunucudan çıktığı için connect-src yalnız 'self'.
const csp=(dev:boolean)=>["default-src 'self'","script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'"+(dev?" 'unsafe-eval'":''),"style-src 'self' 'unsafe-inline'","img-src 'self' data: blob:","font-src 'self' data:","connect-src 'self'"+(dev?' ws: wss:':''),"worker-src 'self' blob:","object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'"].join('; ');
const config:NextConfig={output:'standalone',async headers(){return [{source:'/:path*',headers:[{key:'Content-Security-Policy',value:csp(process.env.NODE_ENV!=='production')},{key:'X-Frame-Options',value:'DENY'},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'same-origin'}]}];},agentRules:false,turbopack:{},serverExternalPackages:['libsql','@libsql/client','@libsql/linux-x64-gnu','@libsql/linux-x64-musl','@libsql/win32-x64-msvc','@libsql/darwin-arm64','@libsql/darwin-x64','@sirrakadembasti/llm-manager'],webpack(config,{dev}){
// Persistent filesystem snapshots fail on this Windows/pnpm symlink layout.
// Keep development caching; production builds must not reuse the broken snapshot.
if(!dev)config.cache=false;return config;
}};
export default config;
