import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Emily Matos Studio",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} overflow-x-hidden`}>
        {/* Layout Flex: No PC fica lado a lado, no Celular fica um em cima do outro */}
        <div className="flex flex-col md:flex-row min-h-screen w-full">
          
          {/* MENU LATERAL - Agora ele se esconde ou encolhe no celular */}
          <aside className="w-full md:w-64 bg-white border-b md:border-r border-pink-100 p-4 md:sticky md:top-0 md:h-screen z-50">
            <div className="text-center md:text-left mb-8">
              <h1 className="text-xl font-bold text-gray-800">EMILY MATOS</h1>
              <span className="text-[10px] bg-pink-400 text-white px-2 py-0.5 rounded">STUDIO</span>
            </div>
            {/* Nav: No mobile fica em linha horizontal com scroll, no PC lista vertical */}
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
               <a href="/agenda" className="px-4 py-2 bg-gray-50 rounded-xl whitespace-nowrap">Agenda</a>
               <a href="/clientes" className="px-4 py-2 bg-gray-50 rounded-xl whitespace-nowrap">Clientes</a>
               <a href="/financeiro" className="px-4 py-2 bg-gray-50 rounded-xl whitespace-nowrap">Financeiro</a>
               <a href="/servicos" className="px-4 py-2 bg-gray-50 rounded-xl whitespace-nowrap">Serviços</a>
            </nav>
          </aside>

          {/* CONTEÚDO PRINCIPAL - Ocupa o resto da tela */}
          <main className="flex-1 w-full relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}