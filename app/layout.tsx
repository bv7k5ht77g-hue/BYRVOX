import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:{default:'BYRVOX — Beyond the Headlines',template:'%s | BYRVOX'},description:'Information, radio, télévision et podcasts. Un nouveau regard sur le monde.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>}
