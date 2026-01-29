import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Emily Matos Studio',
  description: 'Sistema de Gestão Premium',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className="h-full">
      <body className={`${inter.className} flex h-full bg-[#373F47]`}>
        
        {/* --- BARRA LATERAL (APENAS PC/TABLET) --- */}
        <aside 
            className="hidden md:flex w-64 border-r border-[#D49FAF]/30 p-6 flex-col fixed inset-y-0 left-0 z-50 shadow-2xl"
            style={{
                backgroundImage: "url('/marmore-hd.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center"
            }}
        >
          <div className="mb-10">
            <h1 className="text-xl font-serif tracking-widest text-[#373F47] uppercase drop-shadow-sm font-bold">Emily Matos</h1>
            <div className="mt-2 inline-block bg-[#F7ACCF] px-2 py-1 rounded shadow-md">
                <p className="text-[9px] tracking-[0.3em] text-[#373F47] font-black uppercase">Studio</p>
            </div>
          </div>
          
          <nav className="space-y-4 flex-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#373F47] hover:bg-white/60 hover:text-[#A16585] font-bold transition-all border border-transparent">
              Agenda
            </Link>
            <Link href="/financeiro" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#373F47] hover:bg-white/60 hover:text-[#A16585] font-bold transition-all border border-transparent">
              Financeiro
            </Link>
            <Link href="/clientes" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#373F47] hover:bg-white/60 hover:text-[#A16585] font-bold transition-all border border-transparent">
              Clientes
            </Link>
            <Link href="/servicos" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#373F47] hover:bg-white/60 hover:text-[#A16585] font-bold transition-all border border-transparent">
              Serviços
            </Link>
          </nav>

          <div className="pt-6 border-t border-[#D49FAF]/50">
            <p className="text-[10px] text-[#A16585] uppercase tracking-widest font-bold">Emily Matos Beauty</p>
          </div>
        </aside>

        {/* --- ÁREA PRINCIPAL --- */}
        <main className="flex-1 md:ml-64 relative min-h-screen overflow-hidden flex flex-col">
          
          {/* FUNDO MÁRMORE (MOBILE) + MOSAICO (PC) */}
          <div className="fixed inset-0 md:ml-64 z-0 pointer-events-none select-none">
            {/* Versão Mobile: Mármore Escuro */}
            <div 
                className="absolute inset-0 md:hidden bg-[#373F47]"
                style={{
                    backgroundImage: "url('/marmore-hd.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.3
                }}
            />

            {/* Versão PC: Mosaico de Fotos */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 h-screen w-full">
                <div className="contents grayscale brightness-[0.6] contrast-125">
                    <div className="relative h-full w-full border-r border-[#373F47]/50">
                        <Image src="/emily-pose1.jpeg" alt="Fundo" fill className="object-cover object-top" priority />
                    </div>
                    <div className="relative h-full w-full border-r border-[#373F47]/50">
                        <Image src="/emily-tablet.jpeg" alt="Fundo" fill className="object-cover object-top" />
                    </div>
                    <div className="relative h-full w-full border-r border-[#373F47]/50">
                        <Image src="/emily-tools.jpeg" alt="Fundo" fill className="object-cover object-top" />
                    </div>
                    <div className="relative h-full w-full">
                        <Image src="/emily-pose2.jpeg" alt="Fundo" fill className="object-cover object-top" />
                    </div>
                </div>
            </div>
            
            <div className="absolute inset-0 bg-[#373F47]/85 mix-blend-multiply z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#373F47] via-transparent to-transparent z-10"></div>
          </div>

          {/* CONTEÚDO DA PÁGINA + RODAPÉ (AGORA SÃO IRMÃOS) */}
          <div className="relative z-20 h-full overflow-y-auto">
            
            {/* O conteúdo do site (page.tsx) entra aqui */}
            <div className="p-6 pb-28 min-h-full">
                {children}
            </div>

            {/* --- MENU RODAPÉ LUXO (SÓ MOBILE) --- */}
            {/* AGORA ESTÁ DENTRO DA ÁREA DE CONTEÚDO (z-30 perde para z-9999 do modal) */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-[#2A3036] border border-[#D49FAF]/30 rounded-2xl z-30 px-2 py-3 flex justify-around items-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                
                <Link href="/" className="flex flex-col items-center gap-1 group w-16">
                    <div className="p-2 rounded-xl bg-[#D49FAF]/10 group-active:bg-[#D49FAF]/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#D49FAF" className="drop-shadow-sm">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#E0E0E0] group-hover:text-white">Agenda</span>
                </Link>
                
                <Link href="/financeiro" className="flex flex-col items-center gap-1 group w-16">
                    <div className="p-2 rounded-xl bg-[#D49FAF]/10 group-active:bg-[#D49FAF]/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#D49FAF" className="drop-shadow-sm">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.47.33 2.62 1.26 2.79 3h-1.97c-.17-.72-.8-1.5-2.2-1.5-1.56 0-2.24.72-2.24 1.23 0 .65.41 1.43 2.38 1.98 2.86.79 4.41 1.71 4.41 3.75 0 1.8-1.48 2.9-3.37 3.18z"/>
                        </svg>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#E0E0E0] group-hover:text-white">Caixa</span>
                </Link>

                <Link href="/clientes" className="flex flex-col items-center gap-1 group w-16">
                    <div className="p-2 rounded-xl bg-[#D49FAF]/10 group-active:bg-[#D49FAF]/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#D49FAF" className="drop-shadow-sm">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#E0E0E0] group-hover:text-white">Clientes</span>
                </Link>

                <Link href="/servicos" className="flex flex-col items-center gap-1 group w-16">
                    <div className="p-2 rounded-xl bg-[#D49FAF]/10 group-active:bg-[#D49FAF]/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#D49FAF" className="drop-shadow-sm">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#E0E0E0] group-hover:text-white">Serviços</span>
                </Link>
            </nav>

          </div>

        </main>
      </body>
    </html>
  )
}