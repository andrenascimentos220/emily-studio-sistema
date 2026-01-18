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
        
        {/* --- BARRA LATERAL (APENAS PC) --- */}
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
                    opacity: 0.4 // Deixa o mármore sutil para ler o texto
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
            
            {/* Película Escura Geral */}
            <div className="absolute inset-0 bg-[#373F47]/80 mix-blend-multiply z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#373F47] via-transparent to-transparent z-10"></div>
          </div>

          {/* CONTEÚDO DA PÁGINA (Com espaço extra embaixo para o menu mobile) */}
          <div className="relative z-20 text-[#E0E0E0] p-6 pb-24 h-full overflow-y-auto">
            {children}
          </div>

          {/* --- MENU RODAPÉ TIPO APP (APENAS MOBILE) --- */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2A3036] border-t border-[#D49FAF]/20 z-50 px-6 py-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <Link href="/" className="flex flex-col items-center gap-1 text-[#D49FAF]">
                <span className="text-2xl">📅</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">Agenda</span>
            </Link>
            
            <Link href="/financeiro" className="flex flex-col items-center gap-1 text-[#E0E0E0] hover:text-[#D49FAF] transition-colors">
                <span className="text-2xl">💰</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">Caixa</span>
            </Link>

            <Link href="/clientes" className="flex flex-col items-center gap-1 text-[#E0E0E0] hover:text-[#D49FAF] transition-colors">
                <span className="text-2xl">👥</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">Clientes</span>
            </Link>

            <Link href="/servicos" className="flex flex-col items-center gap-1 text-[#E0E0E0] hover:text-[#D49FAF] transition-colors">
                <span className="text-2xl">💅</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">Serviços</span>
            </Link>
          </nav>

        </main>
      </body>
    </html>
  )
}