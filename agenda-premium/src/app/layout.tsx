import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Configurações para transformar o site em "App" (PWA)
export const metadata: Metadata = {
  title: "Emily Matos Studio",
  description: "Sistema de Gerenciamento Emily Matos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Emily Studio",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

// Configura a cor da barra superior do navegador no celular
export const viewport: Viewport = {
  themeColor: "#FFB6C1", // Rosa claro aproximado da logo
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        {/* Força o ícone em dispositivos Apple antigos */}
        <link rel="apple-touch-icon" href="/icon.png" />
        {/* Meta tag para garantir que o app ocupe a tela toda no iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}