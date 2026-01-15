"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, User, Phone, Calendar, Trash2, X, Edit2, MessageCircle, HeartCrack, Gift, Sparkles, Cake } from "lucide-react";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "", data_nascimento: "" });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  // ESTADO PARA LER CONFIGURAÇÃO DE ANIVERSÁRIO (Para saber a %)
  const [configAniversario, setConfigAniversario] = useState({ ativo: false, valor: 0 });
  const [modalMensagem, setModalMensagem] = useState<any>(null);

  useEffect(() => { 
      carregarClientes(); 
      carregarConfiguracoes();
  }, []);

  async function carregarClientes() {
    const { data } = await supabase.from("clientes").select("*").order("nome");
    setClientes(data || []);
  }

  async function carregarConfiguracoes() {
    const { data } = await supabase.from("configuracoes").select("*").eq("chave", "aniversario").single();
    if(data) setConfigAniversario(data.valor);
  }

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault();
    if (editandoId) {
        await supabase.from("clientes").update(novoCliente).eq("id", editandoId);
    } else {
        await supabase.from("clientes").insert([novoCliente]);
    }
    setNovoCliente({ nome: "", telefone: "", data_nascimento: "" });
    setEditandoId(null);
    setMostrarModal(false);
    carregarClientes();
  }

  async function excluirCliente(id: string) {
    if (confirm("Tem certeza que deseja excluir esta cliente?")) {
      await supabase.from("clientes").delete().eq("id", id);
      carregarClientes();
    }
  }

  const ehAniversarianteHoje = (dataNasc: string) => {
    if (!dataNasc) return false;
    const hoje = new Date();
    const [ano, mes, dia] = dataNasc.split('-').map(Number);
    return (mes === hoje.getMonth() + 1) && (dia === hoje.getDate());
  };

  // --- NOVOS TEXTOS AQUI ---
  const gerarMensagemCliente = (tipo: 'aniversario' | 'saudades' | 'feedback') => {
      if(!modalMensagem) return;
      const nome = modalMensagem.nome.split(' ')[0];
      let texto = "";

      switch(tipo) {
          case 'aniversario':
              // TEXTO 3
              const desconto = configAniversario.ativo ? configAniversario.valor : 10;
              texto = `Parabéns, ${nome}! 🎉\nQue este novo ciclo venha repleto de coisas boas e momentos especiais.\nComo forma de carinho, você tem *${desconto}% OFF* em um procedimento para usar no studio.\nSerá um prazer te receber. 🥳✨`;
              break;
          case 'saudades':
              // TEXTO 2
              texto = `Oi, ${nome}, tudo bem?\nFaz um tempinho que não te vejo por aqui e passei para te lembrar que será um prazer te receber novamente no studio.\nQuando quiser agendar um horário para cuidar da sua beleza, fico à disposição. ✨`;
              break;
          case 'feedback':
              // TEXTO 1
              texto = `Olá, ${nome}, tudo bem?😊\nPassando para saber como você se sentiu com o procedimento e se gostou do resultado.\nSe quiser me contar sua experiência aqui no studio, vou amar receber seu feedback. ✨`;
              break;
      }
      
      window.open(`https://wa.me/55${modalMensagem.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
      setModalMensagem(null);
  };

  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24">
      
      {/* CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-4xl font-serif tracking-[0.2em] uppercase text-[#F7ACCF] font-bold drop-shadow-sm">Clientes</h2>
            <p className="text-[10px] tracking-[0.4em] text-[#E0E0E0] font-light mt-1 uppercase">Gerenciamento VIP</p>
        </div>
        <button onClick={() => { setEditandoId(null); setNovoCliente({ nome: "", telefone: "", data_nascimento: "" }); setMostrarModal(true); }} className="bg-[#373F47] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all hover:bg-[#F7ACCF] hover:text-[#373F47]">
            <Plus size={18} /> Nova Cliente
        </button>
      </header>

      {/* BARRA DE BUSCA */}
      <div className="bg-white p-4 rounded-[2rem] border-2 border-[#D49FAF]/30 flex items-center gap-4 shadow-sm">
        <Search className="text-[#A16585]" />
        <input placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent outline-none font-bold text-[#373F47] placeholder:text-gray-300" />
      </div>

      {/* LISTA DE CARDS */}
      <div className="grid gap-4 md:grid-cols-2">
        {clientesFiltrados.map(c => {
            const isNiver = ehAniversarianteHoje(c.data_nascimento);
            return (
                <div key={c.id} className={`p-6 rounded-[2rem] border-2 shadow-md transition-all group relative ${isNiver ? 'bg-white border-[#F7ACCF] ring-2 ring-pink-100' : 'bg-white border-[#D49FAF]/30 hover:border-[#F7ACCF]'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${isNiver ? 'bg-[#F7ACCF] text-[#373F47] animate-pulse' : 'bg-[#E0E0E0] text-[#373F47]'}`}>
                                {isNiver ? <Cake size={20}/> : <User size={20}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[#373F47] flex items-center gap-2">
                                    {c.nome}
                                    {isNiver && <span className="text-[8px] bg-[#F7ACCF] text-[#373F47] px-2 rounded-full uppercase font-black">Hoje!</span>}
                                </h3>
                                <p className="text-xs text-[#A16585] font-bold flex items-center gap-1"><Phone size={10}/> {c.telefone}</p>
                            </div>
                        </div>
                        
                        {/* AÇÕES */}
                        <div className="flex gap-2">
                            {/* BOTÃO MENSAGENS GERAIS */}
                            <button onClick={() => setModalMensagem(c)} className={`p-2 rounded-full shadow-md transition-all ${isNiver ? 'bg-[#373F47] text-[#F7ACCF] animate-bounce' : 'text-white bg-[#A16585] hover:bg-pink-600'}`} title="Enviar Mensagem">
                                <MessageCircle size={16}/>
                            </button>

                            <button onClick={() => { setNovoCliente(c); setEditandoId(c.id); setMostrarModal(true); }} className="p-2 text-[#373F47] hover:text-[#F7ACCF] bg-[#E0E0E0] rounded-full"><Edit2 size={16}/></button>
                            <button onClick={() => excluirCliente(c.id)} className="p-2 text-gray-400 hover:text-red-500 bg-[#E0E0E0] rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    {c.data_nascimento && (
                        <div className="mt-4 bg-[#F7ACCF]/10 inline-block px-3 py-1 rounded-xl">
                            <p className="text-[10px] text-[#A16585] font-bold flex items-center gap-2"><Calendar size={12}/> Nasc: {c.data_nascimento.split('-').reverse().join('/')}</p>
                        </div>
                    )}
                </div>
            )
        })}
      </div>

      {/* MODAL DE MENSAGENS DO CLIENTE */}
      {modalMensagem && (
        <div className="fixed inset-0 bg-[#373F47]/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
           <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-t-[12px] border-green-400 relative">
              <button onClick={() => setModalMensagem(null)} className="absolute top-4 right-6 text-gray-300 hover:text-gray-600"><X/></button>
              
              <div className="text-center mb-6">
                  <div className="inline-block p-4 bg-green-100 rounded-full text-green-600 mb-2">
                      <MessageCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#373F47] uppercase">WhatsApp: {modalMensagem.nome.split(' ')[0]}</h3>
                  <p className="text-xs text-gray-400">Selecione o modelo:</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                  {/* ANIVERSÁRIO (Destaque se for hoje) */}
                  <button onClick={() => gerarMensagemCliente('aniversario')} className={`p-4 rounded-2xl border transition-all text-left group flex items-center gap-4 ${ehAniversarianteHoje(modalMensagem.data_nascimento) ? 'bg-[#F7ACCF] border-[#F7ACCF] shadow-lg ring-2 ring-pink-200' : 'bg-gray-50 border-gray-100 hover:bg-pink-50'}`}>
                      <div className={`p-2 rounded-full ${ehAniversarianteHoje(modalMensagem.data_nascimento) ? 'bg-white text-[#373F47]' : 'bg-white text-gray-400'}`}><Gift size={20}/></div>
                      <div>
                          <p className={`text-sm font-bold ${ehAniversarianteHoje(modalMensagem.data_nascimento) ? 'text-[#373F47]' : 'text-gray-600'}`}>Feliz Aniversário</p>
                          <p className="text-[10px] opacity-70">Mensagem de parabéns + Desconto</p>
                      </div>
                  </button>

                  {/* SAUDADES (RESGATE) */}
                  <button onClick={() => gerarMensagemCliente('saudades')} className="p-4 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 transition-all text-left group flex items-center gap-4">
                      <div className="p-2 rounded-full bg-white text-red-400 group-hover:text-red-600"><HeartCrack size={20}/></div>
                      <div>
                          <p className="text-sm font-bold text-[#373F47]">Saudades (Resgate)</p>
                          <p className="text-[10px] text-gray-400">"Faz um tempinho que não te vejo..."</p>
                      </div>
                  </button>

                  {/* FEEDBACK GERAL */}
                  <button onClick={() => gerarMensagemCliente('feedback')} className="p-4 rounded-2xl bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 transition-all text-left group flex items-center gap-4">
                      <div className="p-2 rounded-full bg-white text-purple-400 group-hover:text-purple-600"><Sparkles size={20}/></div>
                      <div>
                          <p className="text-sm font-bold text-[#373F47]">Feedback / Experiência</p>
                          <p className="text-[10px] text-gray-400">"Como você se sentiu..."</p>
                      </div>
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE CADASTRO (Mantido igual) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-b-8 border-[#F7ACCF]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-[#A16585] uppercase tracking-widest font-bold">{editandoId ? "Editar" : "Nova"} Cliente</h3>
                <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-[#373F47]"><X /></button>
            </div>
            
            <form onSubmit={salvarCliente} className="space-y-4">
              <input placeholder="Nome Completo" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold placeholder:text-gray-400" required />
              <input placeholder="WhatsApp (DDD + Número)" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold placeholder:text-gray-400" required />
              
              <div className="relative">
                <label className="text-[10px] font-bold text-[#A16585] uppercase ml-4 mb-1 block">Data de Nascimento (Opcional)</label>
                <input type="date" value={novoCliente.data_nascimento} onChange={e => setNovoCliente({...novoCliente, data_nascimento: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs hover:text-[#373F47]">Cancelar</button>
                <button type="submit" className="flex-2 py-4 px-8 bg-[#F7ACCF] text-[#373F47] rounded-2xl font-black shadow-md hover:brightness-105">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}