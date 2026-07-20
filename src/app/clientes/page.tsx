"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, UserPlus, X, Loader2, Phone, User, Trash2, 
  Star, ShoppingBag, Scissors, Save, MessageCircle, Cake, Edit3, Settings, PieChart, Users
} from "lucide-react";

export default function Clientes() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // NOVO MODAL: Edição de WhatsApp
  const [whatsappModal, setWhatsappModal] = useState<{open: boolean, client: any, msg: string}>({ open: false, client: null, msg: "" });

  // Configurações Globais (VIP e Mensagens)
  const [vipLimit, setVipLimit] = useState(500);
  const [bdayMsg, setBdayMsg] = useState("Olá [NOME]! ✨ A Emily Matos Studio passa para desejar um feliz aniversário e um dia maravilhoso!");

  // Estados da Cliente Selecionada
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedVip = localStorage.getItem("vipLimit");
    const savedMsg = localStorage.getItem("bdayMsg");
    if (savedVip) setVipLimit(Number(savedVip));
    if (savedMsg) setBdayMsg(savedMsg);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select(`*, financeiro(valor, tipo, descricao, categoria, data_transacao)`)
        .order("nome");

      if (error) {
        throw error;
      }

      if (data) {
        const processed = data.map(c => {
          const total = c.financeiro
            ?.filter((f: any) => f.tipo === 'receita')
            .reduce((acc: number, cur: any) => acc + (parseFloat(cur.valor) || 0), 0) || 0;
          
          const isBdayMonth = c.data_nascimento ? 
            new Date(c.data_nascimento).getUTCMonth() === new Date().getMonth() : false;

          return { ...c, totalGasto: total, isBdayMonth };
        });
        setClients(processed);
      }
    } catch (err: any) {
      console.error("Erro ao buscar clientes:", err);
      alert("⚠️ Erro de Leitura no Banco de Dados:\n" + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const payload = {
        nome: formData.get("nome")?.toString() || "Sem Nome",
        telefone: formData.get("telefone")?.toString() || "",
        data_nascimento: formData.get("data_nascimento") ? formData.get("data_nascimento")?.toString() : null,
        observacoes: ""
      };

      const { error } = await supabase.from("clientes").insert([payload]);
      if (error) throw error;

      setIsFormOpen(false);
      form.reset();
      await fetchClients();
    } catch (error: any) {
      alert("❌ Erro ao cadastrar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          nome: selectedClient.nome,
          telefone: selectedClient.telefone,
          data_nascimento: selectedClient.data_nascimento || null,
          observacoes: selectedClient.observacoes
        })
        .eq("id", selectedClient.id);

      if (error) throw error;

      setIsDetailsOpen(false);
      await fetchClients();
    } catch (err: any) {
      alert("Erro ao atualizar ficha: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("⚠️ ATENÇÃO: Deseja excluir permanentemente esta cliente do sistema?")) return;
    
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      
      setIsDetailsOpen(false);
      await fetchClients();
    } catch (err: any) {
      alert("Não foi possível excluir. Talvez ela tenha histórico financeiro atrelado.");
    }
  };

  const openDetails = (client: any) => {
    setSelectedClient(client);
    const clientHistory = client.financeiro
      ?.filter((f: any) => f.tipo === 'receita')
      .sort((a: any, b: any) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
    setHistory(clientHistory || []);
    setIsDetailsOpen(true);
  };

  const saveSettings = () => {
    localStorage.setItem("vipLimit", vipLimit.toString());
    localStorage.setItem("bdayMsg", bdayMsg);
    setIsSettingsOpen(false);
    fetchClients();
  };

  // NOVA LÓGICA: Preparar texto pro WhatsApp antes de abrir a janela
  const openWhatsappEditor = (client: any) => {
    let defaultMsg = "Olá [NOME]! Tudo bem? ✨ "; // Mensagem Padrão
    
    if (client.isBdayMonth) {
      defaultMsg = bdayMsg; // Mensagem de Aniversário
    }
    
    // Substitui o [NOME] logo de cara para facilitar a vida da Emily
    defaultMsg = defaultMsg.replace(/\[NOME\]/g, client.nome.split(" ")[0]); 

    setWhatsappModal({ open: true, client, msg: defaultMsg });
  };

  const filteredClients = clients.filter(c => 
    (c.nome || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.telefone || "").includes(search)
  );

  return (
    <div className="w-full min-h-screen pt-24 md:pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white overflow-x-hidden">
      
      {/* --- HEADER PREMIUM --- */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-white/5 pb-8">
        <div className="text-center md:text-left group w-full">
          <h1 className="text-4xl md:text-5xl font-cinzel tracking-[0.1em] text-white transition-all duration-700">
            Gestão <span className="text-primary-light font-extralight italic">de Clientes</span>
          </h1>
          <p className="text-[11px] text-primary-dark font-medium uppercase tracking-[0.5em] antialiased mt-3">
            Prontuário de Luxo & Fidelização
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setIsSettingsOpen(true)} className="flex-1 md:flex-none p-4 bg-white/5 border border-white/10 rounded-full hover:bg-primary/20 text-gray-400 hover:text-primary transition-all shadow-xl">
            <Settings className="w-5 h-5"/>
          </button>
          <button onClick={() => setIsFormOpen(true)} className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 hover:bg-primary-dark active:scale-95 whitespace-nowrap">
            <UserPlus className="w-4 h-4"/> Nova Cliente
          </button>
        </div>
      </div>

      {/* --- BUSCA BLINDADA --- */}
      <div className="w-full max-w-6xl relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          value={search}
          placeholder="Pesquisar por nome ou WhatsApp..." 
          className="w-full bg-black/40 border border-white/5 rounded-full py-5 pl-16 pr-6 text-white outline-none focus:border-primary/50 transition-all backdrop-blur-md shadow-xl"
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {/* --- LISTA DE CLIENTES --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-black/20 rounded-[40px] border border-dashed border-white/10 shadow-xl">
            <Users className="w-16 h-16 mb-4 text-primary opacity-50" />
            <h3 className="text-xl font-cinzel text-white uppercase tracking-widest mb-2">Sem Resultados</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">
              {search ? "Nenhuma cliente encontrada com essa pesquisa." : "Cadastre sua primeira cliente no botão acima."}
            </p>
          </div>
        ) : (
          filteredClients.map(c => (
            <div key={c.id} onClick={() => openDetails(c)} className="bg-black/40 border border-white/5 p-8 rounded-[40px] hover:bg-white/5 transition-all cursor-pointer group relative shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary transition-colors">
                  <User className="text-primary group-hover:text-white w-6 h-6"/>
                </div>
                <div className="flex gap-2">
                  {c.isBdayMonth && <Cake className="w-5 h-5 text-pink-400 animate-pulse" />}
                  {c.totalGasto >= vipLimit && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 drop-shadow-lg" />}
                </div>
              </div>

              <h2 className="text-xl font-cinzel text-white uppercase tracking-widest truncate">{c.nome}</h2>
              <p className="text-xs text-gray-500 mt-2 font-bold tracking-tight">+55 {c.telefone || "Não cadastrado"}</p>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-left">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Consumido</p>
                  <p className="text-lg font-cinzel text-primary">R$ {c.totalGasto.toFixed(2)}</p>
                </div>
                <div className="text-[10px] font-bold text-gray-500 group-hover:text-primary uppercase flex items-center gap-2 transition-colors">Ver Ficha <Edit3 className="w-3 h-3"/></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL DETALHES (PRONTUÁRIO & HISTÓRICO) --- */}
      {isDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-[150] flex items-start md:items-center justify-center bg-black/98 backdrop-blur-xl p-0 md:p-4 overflow-y-auto">
          <div className="bg-[#0f0f0f] w-full max-w-5xl h-fit min-h-screen md:min-h-[85vh] flex flex-col md:flex-row relative shadow-2xl md:rounded-[40px] overflow-visible border border-primary/20">
            
            <button onClick={() => setIsDetailsOpen(false)} className="fixed md:absolute top-6 right-6 z-[250] text-gray-500 bg-black/50 p-3 rounded-full border border-white/10 hover:text-white shadow-xl transition-all hover:scale-110">
              <X className="w-6 h-6"/>
            </button>
            
            {/* LADO ESQUERDO: PRONTUÁRIO */}
            <div className="w-full md:w-1/2 p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/5 flex flex-col text-left pt-24 md:pt-12">
              <h3 className="text-2xl font-cinzel text-white mb-8 uppercase tracking-widest">Prontuário</h3>
              <form onSubmit={handleUpdateClient} className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-primary mb-1 block tracking-widest">Nome Completo</label>
                    <input value={selectedClient.nome} onChange={e => setSelectedClient({...selectedClient, nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary/50 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-primary mb-1 block tracking-widest">WhatsApp</label>
                      <input value={selectedClient.telefone || ""} onChange={e => setSelectedClient({...selectedClient, telefone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-primary mb-1 block tracking-widest">Nascimento</label>
                      <input type="date" value={selectedClient.data_nascimento || ""} onChange={e => setSelectedClient({...selectedClient, data_nascimento: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-primary mb-1 block tracking-widest">Observações Técnicas</label>
                    <textarea value={selectedClient.observacoes || ""} onChange={e => setSelectedClient({...selectedClient, observacoes: e.target.value})} placeholder="Alergias, preferências de cílios/sobrancelha, histórico..." className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none focus:border-primary/50 custom-scrollbar" />
                  </div>
                </div>
                
                {/* NOVA ÁREA DE BOTÕES SEPARADA DO 'X' */}
                <div className="mt-auto pt-6 flex flex-col gap-4 pb-10">
                  <div className="flex gap-4">
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-5 bg-gradient-to-r from-primary to-primary-dark rounded-2xl text-white font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>} Salvar Ficha
                    </button>
                    <button type="button" onClick={() => openWhatsappEditor(selectedClient)} className="px-6 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-xl group" title="Enviar Mensagem">
                      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform"/>
                    </button>
                  </div>
                  <button type="button" onClick={() => handleDeleteClient(selectedClient.id)} className="text-gray-600 hover:text-red-500 text-[9px] font-bold uppercase flex items-center justify-center gap-2 transition-colors py-2">
                    <Trash2 className="w-3 h-3"/> Excluir Registro Permanente
                  </button>
                </div>
              </form>
            </div>

            {/* LADO DIREITO: HISTÓRICO */}
            <div className="w-full md:w-1/2 p-6 md:p-12 bg-white/[0.01] flex flex-col text-left rounded-r-[40px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-cinzel text-white uppercase tracking-widest">Consumo</h3>
                {/* O botão do WhatsApp saiu daqui para não ficar embaixo do X */}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 min-h-[300px]">
                {history.length > 0 ? history.map((h, i) => (
                  <div key={i} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      {h.categoria === 'produto' ? <ShoppingBag className="w-5 h-5 text-primary"/> : <Scissors className="w-5 h-5 text-gray-500"/>}
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">{h.descricao}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase">{new Date(h.data_transacao).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="font-cinzel text-sm text-primary">R$ {h.valor.toFixed(2)}</span>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
                    <PieChart className="w-12 h-12 mb-4 text-primary"/>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-center text-white">Sem registros no histórico</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: EDITAR MENSAGEM DO WHATSAPP ANTES DE ENVIAR --- */}
      {whatsappModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <div className="bg-[#0f0f0f] border border-green-500/30 rounded-[40px] w-full max-w-md p-10 relative shadow-2xl">
            <h3 className="font-cinzel text-2xl text-white uppercase mb-6 flex items-center gap-3 font-normal"><MessageCircle className="text-green-500 w-6 h-6"/> Falar com Cliente</h3>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-3">Edite a mensagem antes de enviar:</p>
            <textarea 
              value={whatsappModal.msg} 
              onChange={(e) => setWhatsappModal({...whatsappModal, msg: e.target.value})} 
              className="w-full h-40 bg-black/50 border border-white/5 rounded-2xl p-5 text-gray-300 text-sm outline-none resize-none mb-8 focus:border-green-500/40 custom-scrollbar" 
            />
            <div className="flex gap-4">
              <button onClick={() => setWhatsappModal({open: false, client: null, msg: ""})} className="flex-1 py-5 bg-white/5 rounded-2xl text-[10px] font-bold text-gray-500 uppercase transition-colors hover:text-white hover:bg-white/10 tracking-widest">
                Cancelar
              </button>
              <button onClick={() => {
                  const safePhone = (whatsappModal.client?.telefone || "").replace(/\D/g, '');
                  window.open(`https://wa.me/55${safePhone}?text=${encodeURIComponent(whatsappModal.msg)}`, '_blank');
                  setWhatsappModal({open: false, client: null, msg: ""});
              }} className="flex-1 py-5 bg-green-600 rounded-2xl text-[10px] font-bold text-white uppercase shadow-lg shadow-green-600/20 active:scale-95 transition-all hover:bg-green-500 tracking-widest flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4"/> Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIGURAÇÕES VIP & WHATSAPP --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <div className="bg-[#0f0f0f] border border-primary/40 rounded-[40px] w-full max-w-lg p-10 relative shadow-2xl">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">Ajustes do Estúdio</h2>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">Valor de Corte VIP (R$)</label>
                <input type="number" value={vipLimit} onChange={e => setVipLimit(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-primary/50 font-cinzel text-lg" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-primary mb-2 block tracking-widest">Mensagem Padrão de Aniversário</label>
                <textarea value={bdayMsg} onChange={e => setBdayMsg(e.target.value)} className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none focus:border-primary/50 custom-scrollbar" />
                <p className="text-[9px] text-gray-500 mt-2">Use <span className="text-primary font-bold">[NOME]</span> para o sistema preencher automaticamente.</p>
              </div>
            </div>

            <button onClick={saveSettings} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl bg-gradient-to-r from-primary to-primary-dark hover:brightness-110 active:scale-95 transition-all">
              Salvar Ajustes
            </button>
          </div>
        </div>
      )}

      {/* --- NOVO CADASTRO --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <form onSubmit={handleCreateClient} className="bg-[#0f0f0f] border border-primary/40 rounded-[40px] w-full max-w-md p-10 relative shadow-2xl">
            <button type="button" onClick={() => setIsFormOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-3xl font-cinzel text-white mb-8 text-center uppercase tracking-widest">Nova Cliente</h2>
            <div className="space-y-6 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-primary mb-1 block tracking-widest">Nome Completo</label>
                <input required name="nome" placeholder="Nome da cliente..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary/50 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-primary mb-1 block tracking-widest">WhatsApp</label>
                <input required name="telefone" placeholder="(73) 99999-9999" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary/50 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-primary mb-1 block tracking-widest">Nascimento</label>
                <input type="date" name="data_nascimento" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none text-sm" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 bg-gradient-to-r from-primary to-primary-dark hover:brightness-110">
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Cadastrar Cliente"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}