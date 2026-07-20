"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { 
  Calendar, Users, LineChart, Scissors, Wallet, LogOut, Menu, X 
} from "lucide-react";

// Importando a Logo da Emily
import logoEmily from "../../public/logo-emily.png";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    if (confirm("Deseja encerrar a sessão?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const menuItems = [
    { name: "Agenda", icon: <Calendar className="w-5 h-5" />, path: "/" },
    { name: "Clientes", icon: <Users className="w-5 h-5" />, path: "/clientes" },
    { name: "Financeiro", icon: <LineChart className="w-5 h-5" />, path: "/financeiro" },
    { name: "Serviços", icon: <Scissors className="w-5 h-5" />, path: "/servicos" },
    { name: "Capital Pessoal", icon: <Wallet className="w-5 h-5" />, path: "/pessoal" },
  ];

  return (
    <>
      {/* BOTÃO MOBILE (Hambúrguer) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-5 left-5 z-[100] p-3 bg-primary text-white rounded-xl shadow-2xl transition-transform active:scale-90"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* SIDEBAR ASIDE */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[90] w-64 bg-black border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        
        {/* ÁREA DA LOGO OFICIAL */}
<div className="p-8 pb-4 flex justify-center items-center">
  <Image 
    src={logoEmily} 
    alt="Emily Matos Studio" 
    width={160} 
    height={80} 
    style={{ height: "auto" }} // Adicione isso para blindar a proporção original
    className="object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
    priority
  />
</div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-primary/10 text-white border border-primary/20 shadow-lg shadow-primary/5' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`${isActive ? 'text-primary' : 'group-hover:text-primary'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-5 text-gray-500 hover:text-red-500 transition-all w-full rounded-2xl hover:bg-red-500/5 group text-left"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Encerrar Sessão
            </span>
          </button>
        </div>
      </aside>

      {/* OVERLAY MOBILE: Fecha o menu ao clicar fora */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] transition-opacity"
        />
      )}
    </>
  );
}