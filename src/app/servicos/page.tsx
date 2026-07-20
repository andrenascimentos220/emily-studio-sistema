"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, X, Loader2, ShoppingBag, Scissors, Trash2, 
  Edit3, Save, MessageCircle, Megaphone, 
  Search, Users, Check
} from "lucide-react";

export default function Servicos() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos"); 
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingItem, setEditingItem] = useState<any>({
    id: null, nome: "", preco: "", custo: "", tipo: "servico", estoque: 0, mensagem_marketing: "", servico_nome_campanha: ""
  });
  
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [marketingTarget, setMarketingTarget] = useState("todas");

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resClients] = await Promise.all([
        supabase.from("servicos").select("*").order("nome"),
        supabase.from("clientes").select(`*, financeiro(valor, tipo)`)
      ]);

      if (resItems.error) throw resItems.error;
      if (resItems.data) setItems(resItems.data);

      if (resClients.data) {
        const processed = resClients.data.map(c => ({
          ...c,
          totalGasto: c.financeiro?.filter((f: any) => f.tipo === 'receita').reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0
        }));
        setClients(processed);
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      alert("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      nome: editingItem.nome,
      preco: parseFloat(editingItem.preco) || 0,
      custo: parseFloat(editingItem.custo) || 0,
      tipo: editingItem.tipo,
      estoque: editingItem.tipo === 'produto' ? parseInt(editingItem.estoque) || 0 : null,
      mensagem_marketing: editingItem.tipo === 'campanha' ? editingItem.mensagem_marketing : null,
      servico_nome_campanha: editingItem.tipo === 'campanha' ? editingItem.servico_nome_campanha : null
    };

    try {
      let error;
      if (editingItem.id) {
        const { error: err } = await supabase.from("servicos").update(payload).eq("id", editingItem.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("servicos").insert([payload]);
        error = err;
      }

      if (error) {
        console.error("Erro Supabase:", error);
        alert(`❌ ERRO NO BANCO:\n${error.message}`);
      } else {
        setIsFormOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNew = () => {
    const defaultType = filter === "todos" ? "servico" : filter;
    setEditingItem({
      id: null, nome: "", preco: "", custo: "", tipo: defaultType, estoque: 0, mensagem_marketing: "", servico_nome_campanha: ""
    });
    setIsFormOpen(true);
  };

  // LOGICA NOVA: Adicionar ou remover serviços da campanha
  const handleToggleService = (nomeServico: string) => {
    let currentServices = editingItem.servico_nome_campanha ? editingItem.servico_nome_campanha.split(', ') : [];
    
    if (currentServices.includes(nomeServico)) {
      currentServices = currentServices.filter((n: string) => n !== nomeServico); // Remove se já tiver
    } else {
      currentServices.push(nomeServico); // Adiciona se não tiver
    }
    
    setEditingItem({ ...editingItem, servico_nome_campanha: currentServices.join(', ') });
  };

  const sendMarketing = (client: any) => {
    let msg = selectedCampaign.mensagem_marketing || "Olá [NOME], temos uma oferta para você!";
    msg = msg
      .replace(/\[NOME\]/g, client.nome)
      .replace(/\[PRECO\]/g, `R$ ${(selectedCampaign.preco || 0).toFixed(2)}`)
      .replace(/\[SERVICO\]/g, selectedCampaign.servico_nome_campanha || "nossos procedimentos");
      
    const phone = client.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const lucro = (parseFloat(editingItem.preco) || 0) - (parseFloat(editingItem.custo) || 0);
  const margem = (parseFloat(editingItem.preco) || 0) > 0 ? (lucro / parseFloat(editingItem.preco)) * 100 : 0;

  return (
    <div className="w-full min-h-screen pt-20 md:pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white overflow-x-hidden">
      
      {/* HEADER PREMIUM */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-white/5 pb-8">
        <div className="text-center md:text-left group w-full">
          <h1 className="text-4xl md:text-5xl font-cinzel tracking-[0.1em] text-white transition-all duration-700">
            Catálogo <span className="text-primary-light font-extralight italic">& Lucro</span>
          </h1>
          <div className="flex gap-4 mt-6 overflow-x-auto pb-2 custom-scrollbar justify-center md:justify-start">
            {["todos", "servico", "produto", "campanha"].map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${filter === t ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                {t === 'todos' ? 'Ver Tudo' : t === 'servico' ? 'Serviços' : t === 'produto' ? 'Produtos' : 'Campanhas'}
              </button>
            ))}
          </div>
        </div>
        
        <button onClick={handleOpenNew} className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 hover:bg-primary-dark active:scale-95 whitespace-nowrap">
          <Plus className="w-4 h-4"/> Criar {filter === 'todos' ? 'Novo' : filter}
        </button>
      </div>

      {/* GRADE DE ITENS */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div> : 
          items.filter(i => filter === "todos" ? true : i.tipo === filter).map(item => (
            <div key={item.id} className="bg-black/40 border border-white/5 p-8 rounded-[40px] hover:bg-white/5 transition-all group relative overflow-hidden shadow-xl text-left flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl ${item.tipo === 'campanha' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'}`}>
                    {item.tipo === 'servico' && <Scissors className="w-6 h-6"/>}
                    {item.tipo === 'produto' && <ShoppingBag className="w-6 h-6"/>}
                    {item.tipo === 'campanha' && <Megaphone className="w-6 h-6 animate-pulse"/>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(item); setIsFormOpen(true); }} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit3 className="w-4 h-4"/></button>
                    <button onClick={async () => { if(confirm("Deseja excluir permanentemente?")) { await supabase.from("servicos").delete().eq("id", item.id); fetchData(); } }} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>

                <h2 className="text-xl font-cinzel text-white uppercase tracking-widest truncate">{item.nome}</h2>
                {item.tipo === 'campanha' && item.servico_nome_campanha && (
                  <p className="text-[9px] text-primary-dark uppercase tracking-widest mt-2 font-bold leading-relaxed">
                    Combos: <span className="text-gray-400 font-normal">{item.servico_nome_campanha}</span>
                  </p>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-end">
                <div>
                  <p className="text-2xl font-cinzel text-white">R$ {(item.preco || 0).toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">Lucro: R$ {((item.preco || 0) - (item.custo || 0)).toFixed(2)}</span>
                  </div>
                </div>
                {item.tipo === 'campanha' && (
                  <button onClick={() => { setSelectedCampaign(item); setIsMarketingOpen(true); }} className="bg-primary text-white p-3 rounded-xl shadow-lg hover:bg-primary-dark transition-all">
                    <MessageCircle className="w-5 h-5"/>
                  </button>
                )}
                {item.tipo === 'produto' && (
                  <div className="text-[9px] font-bold uppercase text-gray-500 bg-white/5 px-3 py-2 rounded-xl">
                    Qtd: {item.estoque || 0}
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* MODAL: CONFIGURAÇÃO 100% EDITÁVEL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left overflow-y-auto">
          <form onSubmit={handleSave} className="bg-[#0f0f0f] border border-primary/40 rounded-[40px] w-full max-w-lg p-10 relative my-auto shadow-2xl">
            <button type="button" onClick={() => setIsFormOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            
            <h2 className="text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">
               {editingItem.id ? 'Ajustar' : 'Novo'} {editingItem.tipo}
            </h2>

            <div className="space-y-6">
              
              {/* NOME */}
              <div>
                <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">
                  {editingItem.tipo === 'campanha' ? 'Título da Promoção' : `Nome do ${editingItem.tipo}`}
                </label>
                <input required value={editingItem.nome} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary/50 text-sm" placeholder={editingItem.tipo === 'campanha' ? 'Ex: Especial Mês das Mães' : 'Ex: Volume Russo'} />
              </div>

              {/* SELEÇÃO MÚLTIPLA DE SERVIÇOS (COMBO) */}
              {editingItem.tipo === 'campanha' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">Montar Combo (Selecione os Serviços)</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                    {items.filter(i => i.tipo === 'servico').length === 0 && (
                       <p className="text-xs text-gray-500 italic">Cadastre serviços primeiro para montar o combo.</p>
                    )}
                    {items.filter(i => i.tipo === 'servico').map(s => {
                      const isSelected = editingItem.servico_nome_campanha?.includes(s.nome);
                      return (
                        <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm select-none ${isSelected ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            {s.nome}
                          </span>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isSelected || false}
                            onChange={() => handleToggleService(s.nome)} 
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">Custo (R$)</label>
                  <input required type="number" step="0.01" value={editingItem.custo} onChange={e => setEditingItem({...editingItem, custo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none font-cinzel focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">{editingItem.tipo === 'campanha' ? 'Preço do Combo (R$)' : 'Venda (R$)'}</label>
                  <input required type="number" step="0.01" value={editingItem.preco} onChange={e => setEditingItem({...editingItem, preco: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none font-cinzel focus:border-primary/50" />
                </div>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                 <div>
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Lucro Estimado</p>
                    <p className="text-xl font-cinzel text-green-400">R$ {lucro.toFixed(2)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Margem Real</p>
                    <p className="text-xl font-cinzel text-primary">{margem.toFixed(0)}%</p>
                 </div>
              </div>

              {editingItem.tipo === 'produto' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">Unidades em Estoque</label>
                  <input type="number" value={editingItem.estoque} onChange={e => setEditingItem({...editingItem, estoque: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary/50" />
                </div>
              )}

              {/* MENSAGEM COM NOVAS VARIÁVEIS */}
              {editingItem.tipo === 'campanha' && (
                <div className="pt-4 border-t border-white/10">
                  <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">Mensagem de Disparo</label>
                  <textarea 
                    value={editingItem.mensagem_marketing} 
                    onChange={e => setEditingItem({...editingItem, mensagem_marketing: e.target.value})} 
                    placeholder="Oii [NOME]! Liberamos o combo de [SERVICO] por apenas [PRECO] neste mês. Vamos agendar?"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none focus:border-primary/50 custom-scrollbar" 
                  />
                  <p className="text-[9px] text-gray-500 mt-2">Tags inteligentes: use <strong className="text-primary">[NOME]</strong>, <strong className="text-primary">[SERVICO]</strong> e <strong className="text-primary">[PRECO]</strong>.</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary-dark hover:brightness-110">
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : <><Save className="w-5 h-5"/> Salvar {editingItem.tipo}</>}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: MARKETING DIRECIONADO */}
      {isMarketingOpen && selectedCampaign && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left overflow-y-auto">
          <div className="bg-[#0f0f0f] border border-primary/40 rounded-[40px] w-full max-w-2xl p-10 relative shadow-2xl my-auto">
            <button onClick={() => setIsMarketingOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-cinzel text-white uppercase tracking-widest mb-2 font-normal">Disparar Oferta</h2>
              <div className="text-primary font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Megaphone className="w-3 h-3"/> {selectedCampaign.nome}
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={() => setMarketingTarget("todas")} className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase border transition-all ${marketingTarget === 'todas' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>Todas Clientes</button>
              <button onClick={() => setMarketingTarget("vips")} className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase border transition-all ${marketingTarget === 'vips' ? 'bg-yellow-600 border-yellow-600 text-white shadow-lg shadow-yellow-600/20' : 'bg-white/5 border-white/10 text-gray-500'}`}>Somente VIPs</button>
            </div>

            <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {clients
                .filter(c => marketingTarget === "todas" ? true : c.totalGasto >= Number(localStorage.getItem("vipLimit") || 500))
                .map(client => (
                  <div key={client.id} className="bg-white/5 border border-white/5 p-5 rounded-[25px] flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="bg-black/50 p-3 rounded-xl">
                        <Users className="w-4 h-4 text-primary"/>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">{client.nome}</p>
                        <p className="text-[9px] text-gray-500 font-bold">Consumo: R$ {client.totalGasto.toFixed(2)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendMarketing(client)}
                      className="p-4 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-md flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5"/>
                      <span className="text-[9px] font-bold uppercase tracking-widest">Enviar</span>
                    </button>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}