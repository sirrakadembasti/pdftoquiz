import type {NextConfig} from 'next';
const config:NextConfig={output:'standalone',agentRules:false,turbopack:{},serverExternalPackages:['libsql','@libsql/client','@libsql/linux-x64-gnu','@libsql/linux-x64-musl','@libsql/win32-x64-msvc','@libsql/darwin-arm64','@libsql/darwin-x64','@sirrakadembasti/llm-manager'],webpack(config,{dev}){
// Persistent filesystem snapshots fail on this Windows/pnpm symlink layout.
// Keep development caching; production builds must not reuse the broken snapshot.
if(!dev)config.cache=false;return config;
}};
export default config;
