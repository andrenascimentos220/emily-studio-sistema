"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Sparkles, Trash2, X, Edit2, Gift, Megaphone, Settings, Power, Ban, Tag } from "lucide-react";

export default function ServicosPage() {
  // ESTADOS DE NAVEGAÇÃO
  const [abaAtiva, setAbaAtiva] = useState<'catalogo' | 'promocoes' | 'regras'>('catalogo');

  // ESTADOS DE DADOS
  const [servicos, setServicos] = useState<any[]>([]);
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [configAniversario, setConfigAniversario] = useState({ ativo: false, valor: 10 }); // Padrão 10%
  
  // ESTADOS DE FORMULÁRIO
  const [busca, setBusca] = useState("");
  const [mostrarModalServico, setMostrarModalServico] = useState(false);
  const [mostrarModalPromo, setMostrarModalPromo] = useState(false);
  
  // OBJETOS DE EDIÇÃO/CRIAÇÃO
  const [novoServico, setNovoServico] = useState({ nome: "", preco_base: "", custo_material_base: "", tipo: "servico" });
  const [novaPromo, setNovaPromo] = useState({ nome: "", desconto_porcentagem: "", data_inicio: "", data_fim: "" });
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    const { data: s } = await supabase.from("servicos").select("*").order("nome");
    const { data: p } = await supabase.from("promocoes").select("*").order("created_at", { ascending: false });
    const { data: c } = await supabase.from("configuracoes").select("*").eq("chave", "aniversario").single();
    
    setServicos(s || []);
    setPromocoes(p || []);
    if (c && c.valor) setConfigAniversario(c.valor);
  }

  // --- FUNÇÕES DE SERVIÇOS ---
  async function salvarServico(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...novoServico };
    
    if (editandoId) {
        await supabase.from("servicos").update(payload).eq("id", editandoId);
    } else {
        await supabase.from("servicos").insert([payload]);
    }
    setNovoServico({ nome: "", preco_base: "", custo_material_base: "", tipo: "servico" });
    setEditandoId(null);
    setMostrarModalServico(false);
    carregarTudo();
  }

  async function excluirServico(id: string) {
    if (confirm("ATENÇÃO: Excluir este serviço pode afetar o histórico financeiro. Confirmar exclusão?")) {
      await supabase.from("servicos").delete().eq("id", id);
      carregarTudo();
    }
  }

  // --- FUNÇÕES DE PROMOÇÃO ---
  async function criarPromocao(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("promocoes").insert([{
        nome: novaPromo.nome,
        desconto_porcentagem: novaPromo.desconto_porcentagem,
        data_inicio: new Date(novaPromo.data_inicio).toISOString(),
        data_fim: new Date(novaPromo.data_fim).toISOString(),
        ativa: true,
        servicos_aplicaveis: 'todos' // Por enquanto simplificado para todos
    }]);
    setNovaPromo({ nome: "", desconto_porcentagem: "", data_inicio: "", data_fim: "" });
    setMostrarModalPromo(false);
    carregarTudo();
  }

  async function encerrarPromocao(id: string) {
    if(confirm("Deseja encerrar esta campanha agora? O preço voltará ao normal imediatamente.")) {
        await supabase.from("promocoes").update({ ativa: false }).eq("id", id);
        carregarTudo();
    }
  }

  async function excluirPromocao(id: string) {
      if(confirm("Apagar histórico desta promoção?")) {
          await supabase.from("promocoes").delete().eq("id", id);
          carregarTudo();
      }
  }

  // --- FUNÇÕES DE REGRAS (ANIVERSÁRIO) ---
  async function salvarRegraAniversario() {
      // Salva no banco como um JSON
      const { error } = await supabase.from("configuracoes").upsert({ 
          chave: "aniversario", 
          valor: configAniversario 
      });
      if(!error) alert("Regra de aniversário atualizada com sucesso!");
  }

  const servicosFiltrados = servicos.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      
      {/* CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-4xl font-serif tracking-[0.2em] uppercase text-[#F7ACCF] font-bold drop-shadow-sm">Gestão Comercial</h2>
            <p className="text-[10px] tracking-[0.4em] text-[#E0E0E0] font-light mt-1 uppercase">Serviços & Campanhas</p>
        </div>
      </header>

      {/* MENU DE ABAS (Navegação Interna) */}
      <div className="flex justify-center gap-4 bg-[#373F47]/50 p-2 rounded-2xl border border-[#D49FAF]/20 backdrop-blur-sm">
          <button onClick={() => setAbaAtiva('catalogo')} className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'catalogo' ? 'bg-[#F7ACCF] text-[#373F47] shadow-lg' : 'text-[#E0E0E0] hover:bg-white/10'}`}>
              <Sparkles size={16}/> Catálogo
          </button>
          <button onClick={() => setAbaAtiva('promocoes')} className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'promocoes' ? 'bg-[#F7ACCF] text-[#373F47] shadow-lg' : 'text-[#E0E0E0] hover:bg-white/10'}`}>
              <Megaphone size={16}/> Promoções
          </button>
          <button onClick={() => setAbaAtiva('regras')} className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'regras' ? 'bg-[#F7ACCF] text-[#373F47] shadow-lg' : 'text-[#E0E0E0] hover:bg-white/10'}`}>
              <Gift size={16}/> Regras Aniversário
          </button>
      </div>

      {/* =================================================================================
          ABA 1: CATÁLOGO DE SERVIÇOS E COMBOS
         ================================================================================= */}
      {abaAtiva === 'catalogo' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center gap-4">
                <div className="bg-white p-4 rounded-[2rem] border-2 border-[#D49FAF]/30 flex-1 flex items-center gap-4 shadow-sm">
                    <Search className="text-[#A16585]" />
                    <input placeholder="Buscar serviço ou combo..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent outline-none font-bold text-[#373F47] placeholder:text-gray-300" />
                </div>
                <button onClick={() => { setEditandoId(null); setNovoServico({ nome: "", preco_base: "", custo_material_base: "", tipo: "servico" }); setMostrarModalServico(true); }} className="bg-[#373F47] text-white px-6 py-4 rounded-[2rem] font-bold flex items-center gap-2 shadow-lg transition-all hover:bg-[#F7ACCF] hover:text-[#373F47]">
                    <Plus size={18} /> Novo Item
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {servicosFiltrados.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[2rem] border-2 border-[#D49FAF]/30 shadow-md hover:border-[#F7ACCF] transition-all group flex flex-col justify-between relative overflow-hidden">
                    {/* Tarja de Combo */}
                    {s.tipo === 'combo' && (
                        <div className="absolute top-0 right-0 bg-[#373F47] text-[#F7ACCF] text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl">COMBO ESPECIAL</div>
                    )}

                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl text-[#373F47] ${s.tipo === 'combo' ? 'bg-[#F7ACCF]/30' : 'bg-[#E0E0E0]'}`}>
                                {s.tipo === 'combo' ? <Tag size={20}/> : <Sparkles size={20}/>}
                            </div>
                            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setNovoServico(s); setEditandoId(s.id); setMostrarModalServico(true); }} className="p-2 text-[#373F47] hover:text-[#F7ACCF] bg-[#E0E0E0] rounded-full"><Edit2 size={16}/></button>
                                <button onClick={() => excluirServico(s.id)} className="p-2 text-[#A16585] hover:text-red-500 bg-[#E0E0E0] rounded-full"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-xl text-[#373F47] mb-1">{s.nome}</h3>
                    </div>
                    
                    <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-[#D49FAF]/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">Valor</span>
                            <span className="text-xl font-black text-[#F7ACCF]">R$ {parseFloat(s.preco_base).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {/* =================================================================================
          ABA 2: PROMOÇÕES E CAMPANHAS
         ================================================================================= */}
      {abaAtiva === 'promocoes' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl text-[#E0E0E0] font-serif uppercase tracking-widest">Campanhas Ativas</h3>
                <button onClick={() => setMostrarModalPromo(true)} className="bg-[#A16585] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:brightness-110">
                    <Megaphone size={18} /> Criar Campanha
                </button>
            </div>

            <div className="grid gap-6">
                {promocoes.length === 0 && <p className="text-gray-500 text-center py-10">Nenhuma campanha registrada.</p>}
                
                {promocoes.map(p => {
                    const hoje = new Date();
                    const inicio = new Date(p.data_inicio);
                    const fim = new Date(p.data_fim);
                    const estaValida = p.ativa && hoje >= inicio && hoje <= fim;
                    
                    return (
                        <div key={p.id} className={`p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 border-2 transition-all ${estaValida ? 'bg-white border-[#F7ACCF] shadow-[0_0_15px_rgba(247,172,207,0.3)]' : 'bg-gray-200 border-transparent opacity-70 grayscale'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-full ${estaValida ? 'bg-[#373F47] text-[#F7ACCF]' : 'bg-gray-400 text-white'}`}>
                                    <Tag size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[#373F47] uppercase">{p.nome}</h4>
                                    <p className="text-sm text-[#A16585] font-bold">Desconto: {p.desconto_porcentagem}% OFF</p>
                                    <p className="text-xs text-gray-500 mt-1">De {inicio.toLocaleDateString()} até {fim.toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {estaValida ? (
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Em Vigor
                                    </div>
                                ) : (
                                    <div className="bg-gray-300 text-gray-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Encerrada</div>
                                )}

                                {estaValida && (
                                    <button onClick={() => encerrarPromocao(p.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 border border-red-100 flex items-center gap-1" title="Encerrar antes da hora">
                                        <Ban size={12}/> Encerrar
                                    </button>
                                )}
                                <button onClick={() => excluirPromocao(p.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      )}

      {/* =================================================================================
          ABA 3: REGRAS DE ANIVERSÁRIO
         ================================================================================= */}
      {abaAtiva === 'regras' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[3rem] border-t-[12px] border-[#F7ACCF] shadow-2xl max-w-2xl mx-auto text-center">
                <div className="inline-block p-6 bg-[#F7ACCF]/20 rounded-full mb-6 text-[#A16585]">
                    <Gift size={48} />
                </div>
                <h3 className="text-2xl font-serif text-[#373F47] font-bold mb-2 uppercase">Mimo de Aniversário</h3>
                <p className="text-gray-400 text-sm mb-8 px-8">Configure como o sistema deve tratar as aniversariantes do mês. Quando ativado, o desconto aparecerá automaticamente no agendamento.</p>

                <div className="space-y-6 max-w-xs mx-auto">
                    <div className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${configAniversario.ativo ? 'border-[#373F47] bg-[#373F47] text-white' : 'border-gray-200 bg-gray-50 text-gray-400'}`} onClick={() => setConfigAniversario({...configAniversario, ativo: !configAniversario.ativo})}>
                        <span className="font-bold uppercase text-sm">Status do Desconto</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-all ${configAniversario.ativo ? 'bg-[#F7ACCF]' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${configAniversario.ativo ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>

                    <div className="relative opacity-100 transition-opacity">
                         <label className="text-[10px] font-bold text-[#A16585] uppercase mb-1 block">Porcentagem de Desconto</label>
                         <div className="flex items-center gap-2">
                             <input type="number" value={configAniversario.valor} onChange={e => setConfigAniversario({...configAniversario, valor: Number(e.target.value)})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-2xl text-center" disabled={!configAniversario.ativo} />
                             <span className="text-xl font-black text-[#373F47]">%</span>
                         </div>
                    </div>

                    <button onClick={salvarRegraAniversario} className="w-full py-4 bg-[#A16585] text-white rounded-2xl font-bold hover:brightness-110 shadow-lg mt-4">
                        SALVAR ALTERAÇÕES
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE SERVIÇO/COMBO */}
      {mostrarModalServico && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-b-8 border-[#F7ACCF]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-[#A16585] uppercase tracking-widest font-bold">{editandoId ? "Editar" : "Novo"} Item</h3>
                <button onClick={() => setMostrarModalServico(false)} className="text-gray-400 hover:text-[#373F47]"><X /></button>
            </div>
            
            <form onSubmit={salvarServico} className="space-y-4">
               {/* Seleção de Tipo: Serviço ou Combo */}
               <div className="flex gap-2 mb-4 bg-[#E0E0E0] p-1 rounded-xl">
                   <button type="button" onClick={() => setNovoServico({...novoServico, tipo: 'servico'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${novoServico.tipo === 'servico' ? 'bg-white text-[#373F47] shadow-sm' : 'text-gray-400'}`}>Serviço Comum</button>
                   <button type="button" onClick={() => setNovoServico({...novoServico, tipo: 'combo'})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${novoServico.tipo === 'combo' ? 'bg-[#373F47] text-[#F7ACCF] shadow-sm' : 'text-gray-400'}`}>Combo Promocional</button>
               </div>

              <input placeholder={novoServico.tipo === 'combo' ? "Nome do Combo (Ex: Olhar 4D)" : "Nome do Procedimento"} value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold placeholder:text-gray-400" required />
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-[#A16585] uppercase ml-4 mb-1 block">Preço Final</label>
                    <input type="number" step="0.01" value={novoServico.preco_base} onChange={e => setNovoServico({...novoServico, preco_base: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-lg" required />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-4 mb-1 block">Custo (Opcional)</label>
                    <input type="number" step="0.01" value={novoServico.custo_material_base} onChange={e => setNovoServico({...novoServico, custo_material_base: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-gray-500 rounded-2xl outline-none font-bold" />
                  </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModalServico(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs hover:text-[#373F47]">Cancelar</button>
                <button type="submit" className="flex-2 py-4 px-8 bg-[#F7ACCF] text-[#373F47] rounded-2xl font-black shadow-md hover:brightness-105">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CAMPANHA/PROMOÇÃO */}
      {mostrarModalPromo && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-t-[12px] border-[#A16585]">
            <h3 className="font-serif text-xl text-[#373F47] uppercase text-center mb-6 font-bold">Nova Campanha</h3>
            
            <form onSubmit={criarPromocao} className="space-y-4">
              <input placeholder="Nome da Campanha (Ex: Semana dos Cílios)" value={novaPromo.nome} onChange={e => setNovaPromo({...novaPromo, nome: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold placeholder:text-gray-400" required />
              
              <div className="relative">
                   <label className="text-[10px] font-bold text-[#A16585] uppercase ml-4 mb-1 block">Desconto (%)</label>
                   <div className="flex items-center gap-2">
                     <input type="number" value={novaPromo.desconto_porcentagem} onChange={e => setNovaPromo({...novaPromo, desconto_porcentagem: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-lg" required />
                     <span className="font-black text-[#373F47]">%</span>
                   </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Início</label>
                    <input type="date" value={novaPromo.data_inicio} onChange={e => setNovaPromo({...novaPromo, data_inicio: e.target.value})} className="w-full p-3 bg-[#E0E0E0] text-[#373F47] rounded-xl outline-none font-bold text-xs" required />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Fim</label>
                    <input type="date" value={novaPromo.data_fim} onChange={e => setNovaPromo({...novaPromo, data_fim: e.target.value})} className="w-full p-3 bg-[#E0E0E0] text-[#373F47] rounded-xl outline-none font-bold text-xs" required />
                 </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModalPromo(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs hover:text-[#373F47]">Cancelar</button>
                <button type="submit" className="flex-2 py-4 px-8 bg-[#A16585] text-white rounded-2xl font-black shadow-md hover:brightness-110">LANÇAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}