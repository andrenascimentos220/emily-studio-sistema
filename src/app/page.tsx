"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Scissors, X, Loader2, 
  MessageCircle, CheckCircle2, 
  ChevronLeft, ChevronRight, RotateCcw, Search, Check, Edit2, Calendar, Trash2
} from "lucide-react";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [editingData, setEditingData] = useState<any>({ id: null, servico_id: "", time: "", data: "" });
  const [whatsappModal, setWhatsappModal] = useState<{open: boolean, data: any}>({ open: false, data: null });
  const [customMsg, setCustomMsg] = useState("");

  useEffect(() => { fetchInitialData(); }, [selectedDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dataISO = `${year}-${month}-${day}`;

    try {
      const [resClients, resServices, resAgenda] = await Promise.all([
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("servicos").select("*").order("nome"),
        supabase.from("agenda")
          .select(`*, clientes (*), servicos (*)`)
          // Ajuste de fuso horário para o Brasil (-03:00)
          .gte('data_hora', `${dataISO}T00:00:00-03:00`)
          .lte('data_hora', `${dataISO}T23:59:59-03:00`)
          .order('data_hora')
      ]);

      if (resClients.data) setClients(resClients.data);
      if (resServices.data) setServices(resServices.data);
      if (resAgenda.data) {
        setAppointments(resAgenda.data.map(a => ({
          ...a, 
          // Formata para o horário local brasileiro
          time: new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      alert("⚠️ Erro de Leitura no Banco de Dados:\n" + err.message);
    }
    
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedClient || !editingData.servico_id || !editingData.time || !editingData.data) return;
    setIsSubmitting(true);

    const payload = { 
      cliente_id: selectedClient.id, 
      servico_id: editingData.servico_id, 
      // Salva o horário cravado no fuso de Brasília (-03:00)
      data_hora: `${editingData.data}T${editingData.time}:00-03:00`, 
      status: 'confirmado' 
    };

    try {
      let error;
      if (editingData.id) {
        const { error: err } = await supabase.from("agenda").update(payload).eq("id", editingData.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("agenda").insert([payload]);
        error = err;
      }

      // RADAR DE ERROS: Se o Supabase reclamar, a tela te avisa na hora!
      if (error) {
        throw error;
      }

      setIsFormOpen(false);
      resetForm();
      await fetchInitialData();
    } catch (err: any) {
      console.error("Erro Supabase:", err);
      alert("❌ Falha ao Salvar o Agendamento:\n\n" + err.message + "\n\nSe o erro falar de 'Foreign Key', precisamos rodar aquele comando SQL na tabela de Agenda!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setClientSearch("");
    // Pega a data local corretamente, sem pular pro dia seguinte
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dataSugerida = `${year}-${month}-${day}`;
    
    setEditingData({ id: null, servico_id: "", time: "", data: dataSugerida });
  };

  const handleDelete = async (apt: any) => {
    const confirmMsg = apt.status === 'concluido' 
      ? "Este atendimento já foi pago. Ao excluir, o lançamento no financeiro também será removido. Confirmar?"
      : "Deseja excluir este agendamento permanentemente?";

    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);

    try {
      if (apt.status === 'concluido') {
        await supabase.from("financeiro")
          .delete()
          .eq("cliente_id", apt.cliente_id)
          .ilike("descricao", `%${apt.servicos?.nome || ''}%`);
      }

      const { error } = await supabase.from("agenda").delete().eq("id", apt.id);
      if (error) throw error;
      
      await fetchInitialData();
    } catch (err: any) {
      alert("Erro ao excluir agendamento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async (apt: any) => {
    if (apt.status === 'concluido' || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { error: finError } = await supabase.from("financeiro").insert([{
        cliente_id: apt.cliente_id,
        descricao: `Atendimento: ${apt.servicos?.nome || 'Serviço'}`,
        valor: apt.servicos?.preco || 0,
        tipo: 'receita',
        categoria: 'servico',
        data_transacao: new Date().toISOString()
      }]);
      
      if (finError) throw finError;

      const { error: agendaError } = await supabase.from("agenda").update({ status: 'concluido' }).eq("id", apt.id);
      if (agendaError) throw agendaError;

      await fetchInitialData();
    } catch (err: any) {
      alert("Erro ao finalizar atendimento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async (apt: any) => {
    if (apt.status !== 'concluido' || isSubmitting) return;
    if (!confirm("Reverter atendimento para 'Confirmado'? O valor será retirado do Financeiro.")) return;
    setIsSubmitting(true);
    
    try {
      await supabase.from("financeiro").delete().eq("cliente_id", apt.cliente_id).eq("tipo", "receita").ilike("descricao", `%${apt.servicos?.nome || ''}%`);
      await supabase.from("agenda").update({ status: 'confirmado' }).eq("id", apt.id);
      await fetchInitialData();
    } catch (err: any) {
      alert("Erro ao reverter atendimento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (apt: any) => {
    setSelectedClient(apt.clientes);
    setClientSearch(apt.clientes?.nome || "");
    // Ajuste para ler a data local de volta pro formulário
    const d = new Date(apt.data_hora);
    const dataLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    setEditingData({
      id: apt.id,
      servico_id: apt.servico_id,
      time: apt.time,
      data: dataLocal
    });
    setIsFormOpen(true);
  };

  const filteredClients = clients.filter(c => (c.nome || "").toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div className="w-full min-h-screen pt-20 md:pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white overflow-x-hidden">
      
      {/* HEADER PREMIUM */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-white/5 pb-8">
        <div className="text-center md:text-left group">
          <h1 className="text-4xl md:text-6xl font-cinzel tracking-[0.15em] text-white transition-all duration-700">
            Emily Matos <span className="text-primary-light font-extralight italic">Studio</span>
          </h1>
          <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
            <div className="h-[1px] w-12 bg-primary-dark opacity-40"></div>
            <p className="text-[11px] text-primary-dark font-medium uppercase tracking-[0.5em] antialiased">
              Beleza & Bem-Estar
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }} 
          className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 hover:bg-primary-dark active:scale-95"
        >
          <Plus className="w-4 h-4" /> Agendar Atendimento
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        
        {/* CALENDÁRIO LATERAL (MOBILE: TOPO) */}
        <div className="lg:col-span-4 h-fit sticky top-24 lg:top-10 z-20">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[30px] md:rounded-[40px] text-center shadow-2xl">
            <div className="flex items-center justify-between mb-6 md:mb-8">
               <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronLeft className="text-primary w-6 h-6"/></button>
               <div>
                  <p className="text-[9px] text-primary font-bold uppercase mb-1 tracking-tighter">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                  <h3 className="font-cinzel text-lg md:text-xl text-white uppercase">{selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</h3>
               </div>
               <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight className="text-primary w-6 h-6"/></button>
            </div>
            <button onClick={() => setSelectedDate(new Date())} className="w-full py-3 rounded-xl border border-white/5 text-[9px] uppercase font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">Ir para Hoje</button>
          </div>
        </div>

        {/* LISTA DE AGENDAMENTOS */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 bg-black/40 backdrop-blur-md rounded-[30px] border border-dashed border-white/10 text-gray-500 font-cinzel text-[10px] tracking-widest uppercase">
              Vazio para este dia.
            </div>
          ) : appointments.map((apt) => (
            <div key={apt.id} className={`bg-black/40 border ${apt.status === 'concluido' ? 'border-green-500/20' : 'border-white/5'} p-5 md:p-6 rounded-[25px] md:rounded-[35px] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:bg-white/5 group`}>
              
              <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                <div className="text-center min-w-[70px] bg-white/5 p-3 rounded-2xl">
                    <p className="text-xl md:text-2xl font-cinzel text-white leading-none">{apt.time}</p>
                    <p className="text-[7px] text-primary font-bold uppercase mt-1 tracking-tighter">Horário</p>
                </div>
                <div className="text-left">
                  <h4 className="text-md md:text-lg font-cinzel text-white uppercase tracking-wider truncate max-w-[150px] md:max-w-none">{apt.clientes?.nome || "Cliente Removida"}</h4>
                  <p className="text-[10px] md:text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <Scissors className="w-3 h-3 text-primary"/> {apt.servicos?.nome || "Serviço Removido"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                {apt.status === 'concluido' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase text-green-400 bg-green-400/5 px-3 py-2 rounded-full border border-green-400/10 flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> Concluído</span>
                    <button onClick={() => handleUndo(apt)} className="p-2 text-gray-500 hover:text-yellow-500 transition-colors"><RotateCcw className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(apt)} className="p-3 bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={() => {
                        const firstName = (apt.clientes?.nome || "Cliente").split(" ")[0];
                        setCustomMsg(`Olá ${firstName}! ✨ Confirmamos seu horário na Emily Matos hoje às ${apt.time}. Até logo!`);
                        setWhatsappModal({ open: true, data: apt });
                    }} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-all"><MessageCircle className="w-4 h-4"/></button>
                    <button onClick={() => handleFinalize(apt)} className="bg-primary/10 text-primary px-4 md:px-6 py-3 rounded-xl text-[9px] md:text-[10px] font-bold uppercase border border-primary/20 hover:bg-primary hover:text-white transition-all">Finalizar</button>
                  </div>
                )}
                <button onClick={() => handleDelete(apt)} className="p-2 text-gray-700 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL AGENDAMENTO RESPONSIVO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-[#0f0f0f] border border-primary/40 rounded-[35px] w-full max-w-lg p-6 md:p-10 relative my-auto shadow-2xl">
            <button type="button" onClick={() => {setIsFormOpen(false); resetForm();}} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-xl md:text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest">{editingData.id ? 'Reagendar' : 'Novo Horário'}</h2>
            
            <div className="space-y-5">
              <div className="relative">
                <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Cliente</label>
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
                   <input type="text" placeholder="Pesquisar..." value={selectedClient ? selectedClient.nome : clientSearch} onChange={(e) => {setClientSearch(e.target.value); setSelectedClient(null); setShowClientList(true);}} onFocus={() => setShowClientList(true)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-primary/40 text-sm" />
                   {selectedClient && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500"/>}
                </div>
                {showClientList && clientSearch && !selectedClient && (
                  <div className="absolute z-[130] w-full mt-2 bg-[#141414] border border-white/10 rounded-2xl max-h-40 overflow-y-auto shadow-2xl custom-scrollbar">
                    {filteredClients.map(c => <div key={c.id} onClick={() => {setSelectedClient(c); setClientSearch(c.nome); setShowClientList(false);}} className="p-4 hover:bg-primary hover:text-white cursor-pointer text-white text-xs border-b border-white/5">{c.nome}</div>)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Data</label>
                  <input required type="date" value={editingData.data} onChange={(e) => setEditingData({...editingData, data: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Hora</label>
                  <input required type="time" value={editingData.time} onChange={(e) => setEditingData({...editingData, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none text-center font-cinzel text-lg" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Serviço</label>
                <select required value={editingData.servico_id} onChange={(e) => setEditingData({...editingData, servico_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none appearance-none text-sm font-bold uppercase">
                  <option value="">Selecione...</option>
                  {services.map(s => <option key={s.id} value={s.id} className="bg-[#0f0f0f]">{s.nome} - R$ {Number(s.preco || 0).toFixed(2)}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !selectedClient} className="w-full py-5 mt-8 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all bg-gradient-to-r from-primary to-primary-dark">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mx-auto"/> : (editingData.id ? 'Salvar Alteração' : 'Agendar Agora')}
            </button>
          </form>
        </div>
      )}

      {/* WHATSAPP MODAL RESPONSIVO */}
      {whatsappModal.open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0f0f0f] border border-green-500/30 rounded-[35px] w-full max-w-md p-8 relative shadow-2xl">
            <h3 className="font-cinzel text-lg text-white uppercase mb-6 flex items-center gap-3"><MessageCircle className="text-green-500 w-6 h-6"/> Confirmar Envio</h3>
            <textarea value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} className="w-full h-32 bg-black/50 border border-white/5 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none mb-6 focus:border-green-500/40 custom-scrollbar" />
            <div className="flex gap-3">
              <button onClick={() => setWhatsappModal({open: false, data: null})} className="flex-1 py-4 bg-white/5 rounded-xl text-[9px] font-bold text-gray-500 uppercase transition-colors hover:text-white">Voltar</button>
              <button onClick={() => {
                  const safePhone = (whatsappModal.data?.clientes?.telefone || "").replace(/\D/g, '');
                  window.open(`https://wa.me/55${safePhone}?text=${encodeURIComponent(customMsg)}`, '_blank');
                  setWhatsappModal({open: false, data: null});
              }} className="flex-1 py-4 bg-green-600 rounded-xl text-[9px] font-bold text-white uppercase shadow-lg shadow-green-600/20 active:scale-95 transition-all">Enviar WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}