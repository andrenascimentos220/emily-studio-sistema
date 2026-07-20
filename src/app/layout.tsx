import type { Metadata, Viewport } from "next";
import { Cinzel, Lato } from "next/font/google";
import "@/app/globals.css"; // Corrigido erro do VS Code

// Componentes de Estrutura
import AuthWrapper from "../components/AuthWrapper";
import Sidebar from "../components/Sidebar"; 

// Importação das Fotos de Fundo (Padrão Studio de Luxo)
import foto1 from "../../public/emily-pose1.jpeg";
import foto2 from "../../public/emily-pose2.jpeg";
import foto3 from "../../public/emily-tablet.jpeg";

// Configuração da Fonte Cinzel (Títulos)
const cinzel = Cinzel({ 
  subsets: ["latin"], 
  variable: "--font-cinzel-standard",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Configuração da Fonte Lato (Textos e Labels)
const lato = Lato({ 
  subsets: ["latin"], 
  variable: "--font-lato-standard",
  weight: ["100", "300", "400", "700", "900"],
});

// Metadados do Sistema (SEO e Aba do Navegador)
export const metadata: Metadata = {
  title: "Emily Matos Studio",
  description: "Sistema de Gestão Premium e Controle de Atendimento",
  icons: {
    icon: "/favicon.ico", 
  },
};

// Configuração de Viewport para evitar zoom indesejado no mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="dark">
      <body 
        className={`
          ${cinzel.variable} 
          ${lato.variable} 
          font-lato-standard 
          bg-[#0a0a0a] 
          text-gray-200 
          antialiased 
          selection:bg-primary 
          selection:text-white
        `}
      >
        
        {/* AuthWrapper: Garante que NADA aparece sem a senha do Supabase */}
        <AuthWrapper>
          <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row">
            
            {/* Menu Lateral Responsivo */}
            <Sidebar />

            {/* Área de Conteúdo Principal */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#0a0a0a]">
              
              {/* --- 📸 LAYER DE FUNDO (BACKGROUND) --- */}
              <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                <div className="h-full w-full flex flex-col md:flex-row opacity-20">
                    
                    {/* Foto 1: Única que aparece em qualquer dispositivo (Mobile e PC) */}
                    <div 
                      className="flex-1 bg-cover bg-center h-full w-full transition-opacity duration-1000" 
                      style={{ backgroundImage: `url(${foto1.src})` }}
                    ></div>
                    
                    {/* Foto 2: Escondida no Mobile (hidden), visível apenas de MD para cima */}
                    <div 
                      className="hidden md:block flex-1 bg-cover bg-center h-full w-full border-l border-white/5" 
                      style={{ backgroundImage: `url(${foto2.src})` }}
                    ></div>
                    
                    {/* Foto 3: Escondida no Mobile (hidden), visível apenas de MD para cima */}
                    <div 
                      className="hidden md:block flex-1 bg-cover bg-center h-full w-full border-l border-white/5" 
                      style={{ backgroundImage: `url(${foto3.src})` }}
                    ></div>

                </div>
                
                {/* Overlay de Gradiente para suavizar as fotos no fundo escuro */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/20 via-[#0a0a0a]/80 to-[#0a0a0a]"></div>
              </div>

              {/* --- 🚀 CONTEÚDO DAS PÁGINAS --- */}
              <div className="relative z-10 w-full min-h-full">
                {children}
              </div>

            </main>

          </div>
        </AuthWrapper>

      </body>
    </html>
  );
}