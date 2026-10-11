import type {NextConfig} from 'next';
const config:NextConfig={output:'standalone',serverExternalPackages:['@prisma/adapter-libsql','libsql','@libsql/client','@libsql/linux-x64-gnu','@libsql/linux-x64-musl','@libsql/win32-x64-msvc','@libsql/darwin-arm64','@libsql/darwin-x64']};
export default config;
