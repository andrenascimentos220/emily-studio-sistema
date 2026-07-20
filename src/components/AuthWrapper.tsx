"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock, LogIn } from "lucide-react";

// O SEGREDO: Definir que o componente aceita 'children' (filhos)
export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // 1. Verifica sessão ativa ao carregar a página
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // 2. Monitora mudanças no estado de login (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError("Acesso Negado: Dados incorretos.");
      setLoading(false);
    }
  };

  // Enquanto o Supabase responde, mostra o Loader
  if (loading && !session) {
    return (
      <div className="w-full h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#C27B5D] w-12 h-12 mb-4" />
        <p className="text-[#C27B5D] font-cinzel text-[10px] tracking-[0.3em] uppercase">Sincronizando Acesso...</p>
      </div>
    );
  }

  // TELA DE LOGIN: Se não houver sessão ativa
  if (!session) {
    return (
      <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <form 
          onSubmit={handleLogin} 
          className="bg-black/60 backdrop-blur-xl border border-[#C27B5D]/30 p-10 rounded-[40px] w-full max-w-sm shadow-2xl flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-[#C27B5D]/10 rounded-full flex items-center justify-center mb-6 border border-[#C27B5D]/20">
            <Lock className="text-[#C27B5D] w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-cinzel text-white mb-2 uppercase tracking-widest text-center">Acesso Privado</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-8 text-center">Espaço Emily Matos</p>

          <div className="w-full space-y-4">
            <input 
              type="email" 
              placeholder="E-MAIL" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-[#C27B5D] transition-all text-xs tracking-widest"
              required
            />
            <input 
              type="password" 
              placeholder="SENHA" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-[#C27B5D] transition-all text-xs tracking-widest"
              required
            />
          </div>

          {authError && <p className="text-red-500 text-[9px] font-bold uppercase mt-4 animate-pulse">{authError}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-8 py-5 bg-[#C27B5D] text-white rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><LogIn className="w-4 h-4" /> Entrar no Painel</>}
          </button>
        </form>
      </div>
    );
  }

  // SE LOGADO: Deixa o sistema aparecer
  return <>{children}</>;
}