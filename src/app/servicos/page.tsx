"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Sparkles, Trash2, X, Edit2, Gift, Megaphone, Tag, Ban, Loader2 } from "lucide-react";

export default function ServicosPage() {
  // ESTADOS DE NAVEGAÇÃO
  const [abaAtiva, setAbaAtiva] = useState<'catalogo' | 'promocoes' | 'regras'>('catalogo');

  // ESTADOS DE DADOS
  const [servicos, setServicos] = useState<any[]>([]);
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [configAniversario, setConfigAniversario] = useState({ ativo: false, valor: 10 });
  
  // ESTADOS DE FORMULÁRIO E LOADING
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
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
    try {
        const { data: s } = await supabase.from("servicos").select("*").order("nome");
        const { data: p } = await supabase.from("promocoes").select("*").order("created_at", { ascending: false });
        const { data: c } = await supabase.from("configuracoes").select("*").eq("chave", "aniversario").single();
        
        setServicos(s || []);
        setPromocoes(p || []);
        if (c && c.valor) setConfigAniversario(c.valor);
    } catch (error) {
        console.error("Erro geral:", error);
    }
  }

  // --- FUNÇÕES DE SERVIÇOS ---
  async function salvarServico(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
        const payload = { 
            nome: novoServico.nome,
            preco_base: parseFloat(String(novoServico.preco_base).replace(',', '.')),
            custo_material_base: novoServico.custo_material_base ? parseFloat(String(novoServico.custo_material_base).replace(',', '.')) : 0,
            tipo: novoServico.tipo 
        };
        
        let error;
        
        if (editandoId) {
            const res = await supabase.from("servicos").update(payload).eq("id", editandoId);
            error = res.error;
        } else {
            const res = await supabase.from("servicos").insert([payload]);
            error = res.error;
        }

        if (error) throw error;

        setNovoServico({ nome: "", preco_base: "", custo_material_base: "", tipo: "servico" });
        setEditandoId(null);
        setMostrarModalServico(false);
        carregarTudo();
    } catch (error: any) {
        alert("Erro ao salvar serviço: " + (error.message || "Erro desconhecido"));
    } finally {
        setLoading(false);
    }
  }

  async function excluirServico(id: string) {
    if (confirm("Confirmar exclusão?")) {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) alert("Erro ao excluir: " + error.message);
      else carregarTudo();
    }
  }

  // --- FUNÇÕES DE PROMOÇÃO ---
  async function criarPromocao(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase.from("promocoes").insert([{
            nome: novaPromo.nome,
            desconto_porcentagem: parseFloat(String(novaPromo.desconto_porcentagem)),
            data_inicio: new Date(novaPromo.data_inicio).toISOString(),
            data_fim: new Date(novaPromo.data_fim).toISOString(),
            ativa: true,
            servicos_aplicaveis: 'todos'
        }]);

        if (error) throw error;

        setNovaPromo({ nome: "", desconto_porcentagem: "", data_inicio: "", data_fim: "" });
        setMostrarModalPromo(false);
        carregarTudo();
    } catch (error: any) {
        alert("Erro ao criar promoção: " + error.message);
    } finally {
        setLoading(false);
    }
  }

  async function encerrarPromocao(id: string) {
    if(confirm("Encerrar campanha agora?")) {
        await supabase.from("promocoes").update({ ativa: false }).eq("id", id);
        carregarTudo();
    }
  }

  async function excluirPromocao(id: string) {
      if(confirm("Apagar histórico?")) {
          await supabase.from("promocoes").delete().eq("id", id);
          carregarTudo();
      }
  }

  // --- FUNÇÕES DE REGRAS ---
  async function salvarRegraAniversario() {
      setLoading(true);
      const { error } = await supabase.from("configuracoes").upsert({ 
          chave: "aniversario", 
          valor: configAniversario 
      });
      setLoading(false);
      if(error) alert("Erro: " + error.message);
      else alert("Regra atualizada!");
  }

  const servicosFiltrados = servicos.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      
      {/* CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
            <h2 className="text-3xl md:text-4xl font-serif tracking-[0.2em] uppercase text-[#F7ACCF] font-bold drop-shadow-sm">Gestão Comercial</h2>
            <p className="text-[10px] tracking-[0.4em] text-[#E0E0E0] font-light mt-1 uppercase">Serviços & Campanhas</p>
        </div>
      </header>

      {/* MENU DE ABAS */}
      <div className="flex overflow-x-auto pb-2 md:pb-0 md:justify-center gap-4 bg-[#373F47]/50 p-2 rounded-2xl border border-[#D49FAF]/20 backdrop-blur-sm no-scrollbar">
          <button 
            onClick={() => setAbaAtiva('catalogo')} 
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'catalogo' ? 'bg-[#F7ACCF] text-[#373F47] shadow-lg' : 'text-[#E0E0E0] hover:bg-white/10'}`}
          >
              <Sparkles size={16}/> Catálogo
          </button>
          
          <button 
            onClick={() => setAbaAtiva('promocoes')} 
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'promocoes' ? 'bg-[#F7ACCF] text-[#373F47] shadow-lg' : 'text-[#E0E0E0] hover:bg-white/10'}`}
          >
              <Megaphone size={16}/> Promoções
          </button>
          
          <button 
            onClick={() => setAbaAtiva('regras')} 
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'regras' ? 'bg-[#F7ACCF] text-[#373F47] shadow-lg' : 'text-[#E0E0E0] hover:bg-white/10'}`}
          >
              <Gift size={16}/> Regras Aniversário
          </button>
      </div>

      {/* ABA 1: CATÁLOGO */}
      {abaAtiva === 'catalogo' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
                <div className="bg-white p-4 rounded-[2rem] border-2 border-[#D49FAF]/30 flex-1 flex items-center gap-4 shadow-sm">
                    <Search className="text-[#A16585]" />
                    <input placeholder="Buscar serviço..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent outline-none font-bold text-[#373F47]" />
                </div>
                <button 
                    onClick={() => { setEditandoId(null); setNovoServico({ nome: "", preco_base: "", custo_material_base: "", tipo: "servico" }); setMostrarModalServico(true); }} 
                    className="bg-[#373F47] text-white px-6 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#F7ACCF] hover:text-[#373F47]"
                >
                    <Plus size={18} /> Novo Item
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {servicosFiltrados.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[2rem] border-2 border-[#D49FAF]/30 shadow-md flex flex-col justify-between relative overflow-hidden">
                    {s.tipo === 'combo' && (
                        <div className="absolute top-0 right-0 bg-[#373F47] text-[#F7ACCF] text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl">COMBO</div>
                    )}
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl text-[#373F47] ${s.tipo === 'combo' ? 'bg-[#F7ACCF]/30' : 'bg-[#E0E0E0]'}`}>
                                {s.tipo === 'combo' ? <Tag size={20}/> : <Sparkles size={20}/>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setNovoServico(s); setEditandoId(s.id); setMostrarModalServico(true); }} className="p-2 text-[#373F47] bg-[#E0E0E0] rounded-full hover:bg-gray-300">
                                    <Edit2 size={16}/>
                                </button>
                                <button onClick={() => excluirServico(s.id)} className="p-2 text-[#A16585] bg-[#E0E0E0] rounded-full hover:bg-gray-300">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-xl text-[#373F47] mb-1">{s.nome}</h3>
                    </div>
                    
                    <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-[#D49FAF]/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">Valor</span>
                            <span className="text-xl font-black text-[#F7ACCF]">R$ {Number(s.preco_base).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {/* ABA 2: PROMOÇÕES */}
      {abaAtiva === 'promocoes' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl md:text-2xl text-[#E0E0E0] font-serif uppercase tracking-widest">Campanhas Ativas</h3>
                <button 
                    onClick={() => setMostrarModalPromo(true)} 
                    className="w-full md:w-auto bg-[#A16585] text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                    <Megaphone size={18} /> Criar Campanha
                </button>
            </div>

            <div className="grid gap-6">
                {promocoes.map(p => {
                    const hoje = new Date();
                    const inicio = new Date(p.data_inicio);
                    const fim = new Date(p.data_fim);
                    fim.setHours(23, 59, 59, 999);
                    const estaValida = p.ativa && hoje >= inicio && hoje <= fim;
                    
                    return (
                        <div key={p.id} className={`p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 border-2 transition-all ${estaValida ? 'bg-white border-[#F7ACCF]' : 'bg-gray-200 opacity-70'}`}>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`p-4 rounded-full flex-shrink-0 ${estaValida ? 'bg-[#373F47] text-[#F7ACCF]' : 'bg-gray-400 text-white'}`}>
                                    <Tag size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[#373F47] uppercase">{p.nome}</h4>
                                    <p className="text-sm text-[#A16585] font-bold">{p.desconto_porcentagem}% OFF</p>
                                    <p className="text-xs text-gray-500 mt-1">{inicio.toLocaleDateString()} - {fim.toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                {estaValida ? (
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Ativa
                                    </div>
                                ) : (
                                    <div className="bg-gray-300 text-gray-500 px-4 py-2 rounded-xl text-xs font-black uppercase">Inativa</div>
                                )}

                                <div className="flex gap-2">
                                    {estaValida && (
                                        <button onClick={() => encerrarPromocao(p.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-1">
                                            <Ban size={12}/> Parar
                                        </button>
                                    )}
                                    <button onClick={() => excluirPromocao(p.id)} className="p-2 text-gray-400 hover:text-red-500">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      )}

      {/* ABA 3: REGRAS */}
      {abaAtiva === 'regras' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[3rem] border-t-[12px] border-[#F7ACCF] shadow-2xl max-w-2xl mx-auto text-center">
                <div className="inline-block p-6 bg-[#F7ACCF]/20 rounded-full mb-6 text-[#A16585]">
                    <Gift size={48} />
                </div>
                <h3 className="text-2xl font-serif text-[#373F47] font-bold mb-2 uppercase">Mimo de Aniversário</h3>

                <div className="space-y-6 max-w-xs mx-auto">
                    <div className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between ${configAniversario.ativo ? 'border-[#373F47] bg-[#373F47] text-white' : 'border-gray-200 bg-gray-50 text-gray-400'}`} onClick={() => setConfigAniversario({...configAniversario, ativo: !configAniversario.ativo})}>
                        <span className="font-bold uppercase text-sm">Status</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-all ${configAniversario.ativo ? 'bg-[#F7ACCF]' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${configAniversario.ativo ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="number" value={configAniversario.valor} onChange={e => setConfigAniversario({...configAniversario, valor: Number(e.target.value)})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-2xl text-center" disabled={!configAniversario.ativo} />
                        <span className="text-xl font-black text-[#373F47]">%</span>
                    </div>

                    <button onClick={salvarRegraAniversario} disabled={loading} className="w-full py-4 bg-[#A16585] text-white rounded-2xl font-bold hover:brightness-110 shadow-lg mt-4 flex items-center justify-center gap-2">
                        {loading && <Loader2 className="animate-spin" />}
                        {loading ? "SALVANDO..." : "SALVAR"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL SERVIÇO */}
      {mostrarModalServico && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-b-8 border-[#F7ACCF]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-[#A16585] uppercase tracking-widest font-bold">{editandoId ? "Editar" : "Novo"} Item</h3>
                <button onClick={() => setMostrarModalServico(false)} className="text-gray-400 hover:text-[#373F47]">
                    <X />
                </button>
            </div>
            
            <form onSubmit={salvarServico} className="space-y-4">
               <div className="flex gap-2 mb-4 bg-[#E0E0E0] p-1 rounded-xl">
                   <button type="button" onClick={() => setNovoServico({...novoServico, tipo: 'servico'})} className={`flex-1 py-3 md:py-2 rounded-lg text-xs font-bold uppercase transition-all ${novoServico.tipo === 'servico' ? 'bg-white text-[#373F47] shadow-sm' : 'text-gray-400'}`}>
                    Serviço
                   </button>
                   <button type="button" onClick={() => setNovoServico({...novoServico, tipo: 'combo'})} className={`flex-1 py-3 md:py-2 rounded-lg text-xs font-bold uppercase transition-all ${novoServico.tipo === 'combo' ? 'bg-[#373F47] text-[#F7ACCF] shadow-sm' : 'text-gray-400'}`}>
                    Combo
                   </button>
               </div>

              <input placeholder="Nome..." value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold" required />
              
              <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.01" placeholder="Preço" value={novoServico.preco_base} onChange={e => setNovoServico({...novoServico, preco_base: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-lg" required />
                  <input type="number" step="0.01" placeholder="Custo" value={novoServico.custo_material_base} onChange={e => setNovoServico({...novoServico, custo_material_base: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-gray-500 rounded-2xl outline-none font-bold" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModalServico(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs hover:text-[#373F47]">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-2 py-4 px-8 bg-[#F7ACCF] text-[#373F47] rounded-2xl font-black shadow-md flex items-center gap-2">
                    {loading ? "..." : "SALVAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROMOÇÃO */}
      {mostrarModalPromo && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-t-[12px] border-[#A16585]">
            <h3 className="font-serif text-xl text-[#373F47] uppercase text-center mb-6 font-bold">Nova Campanha</h3>
            
            <form onSubmit={criarPromocao} className="space-y-4">
              <input placeholder="Nome da Campanha" value={novaPromo.nome} onChange={e => setNovaPromo({...novaPromo, nome: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold" required />
              
              <div className="flex items-center gap-2">
                 <input type="number" placeholder="Desconto" value={novaPromo.desconto_porcentagem} onChange={e => setNovaPromo({...novaPromo, desconto_porcentagem: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-lg" required />
                 <span className="font-black text-[#373F47]">%</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <input type="date" value={novaPromo.data_inicio} onChange={e => setNovaPromo({...novaPromo, data_inicio: e.target.value})} className="w-full p-3 bg-[#E0E0E0] text-[#373F47] rounded-xl outline-none font-bold text-xs" required />
                 <input type="date" value={novaPromo.data_fim} onChange={e => setNovaPromo({...novaPromo, data_fim: e.target.value})} className="w-full p-3 bg-[#E0E0E0] text-[#373F47] rounded-xl outline-none font-bold text-xs" required />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModalPromo(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs hover:text-[#373F47]">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-2 py-4 px-8 bg-[#A16585] text-white rounded-2xl font-black shadow-md flex items-center gap-2">
                    {loading ? "..." : "LANÇAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}