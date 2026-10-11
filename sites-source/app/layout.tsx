import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'PDF to Online Quiz — Sınavlarınıza yeni bir sayfa açın',description:'PDF sınavlarını düzenleyin, görsellerini koruyun ve öğrencilerinizle paylaşın.',icons:{icon:'/favicon.svg'}};
// Browser extensions can add body attributes before React hydrates. Keep this
// exception on body only; application descendants still report mismatches.
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body suppressHydrationWarning>{children}</body></html>}
