"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Cinzel } from 'next/font/google'; 
import { Plus, X, CheckCircle2, Calendar as CalendarIcon, Check, Cake, Clock, Sparkles, MessageCircle, ChevronDown, Gift, Trash2, AlertTriangle } from "lucide-react";

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export default function AgendaPage() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [configAniversario, setConfigAniversario] = useState({ ativo: false, valor: 0 });

  // --- MODAIS E ESTADOS ---
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalMensagem, setModalMensagem] = useState<any>(null);
  const [finalizandoAg, setFinalizandoAg] = useState<any>(null);
  const [opcoesAg, setOpcoesAg] = useState<any>(null);
  const [remarcandoAg, setRemarcandoAg] = useState<any>(null);
  const [confirmacao, setConfirmacao] = useState<{ativo: boolean, titulo: string, acao: () => void} | null>(null);

  // --- DADOS AUXILIARES ---
  const [clientesBase, setClientesBase] = useState<any[]>([]);
  const [servicosBase, setServicosBase] = useState<any[]>([]);
  const [sugestoesClientes, setSugestoesClientes] = useState<any[]>([]);
  const [mostrarListaServicos, setMostrarListaServicos] = useState(false);

  // --- FORMULÁRIO ---
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [hora, setHora] = useState("");
  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [custoSugerido, setCustoSugerido] = useState(0);
  const [clienteSelecionada, setClienteSelecionada] = useState<any>(null);
  const [isEnviando, setIsEnviando] = useState(false);

  useEffect(() => { 
    buscarAgendamentos();
    carregarDadosBase();
    carregarConfiguracoes();
  }, [dataSelecionada]);

  async function carregarDadosBase() {
    const { data: c } = await supabase.from("clientes").select("*").order("nome");
    const { data: s } = await supabase.from("servicos").select("*").order("nome");
    setClientesBase(c || []);
    setServicosBase(s || []);
  }

  async function carregarConfiguracoes() {
    const { data } = await supabase.from("configuracoes").select("*").eq("chave", "aniversario").single();
    if(data) setConfigAniversario(data.valor);
  }

  async function buscarAgendamentos() {
    const { data } = await supabase.from("agendamentos").select("*").neq("status", "cancelado")
      .filter("data_hora", "gte", `${dataSelecionada}T00:00:00`)
      .filter("data_hora", "lte", `${dataSelecionada}T23:59:59`);
    setAgendamentos((data || []).sort((a, b) => a.data_hora.localeCompare(b.data_hora)));
  }

  const ehAniversariante = (dataNasc: string) => {
    if (!dataNasc) return false;
    const mesAtual = new Date().getMonth() + 1;
    return (parseInt(dataNasc.split("-")[1]) === mesAtual);
  };

  const gerarMensagem = (tipo: 'confirma' | 'atraso' | 'posvenda') => {
      if(!modalMensagem) return;
      const nome = modalMensagem.cliente_nome.split(' ')[0];
      const horario = modalMensagem.data_hora.split('T')[1].substring(0, 5);
      let texto = "";
      const dataAg = new Date(modalMensagem.data_hora.split('T')[0] + "T00:00:00");
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);

      let quando = "";
      if (dataAg.getTime() === hoje.getTime()) quando = "hoje";
      else if (dataAg.getTime() === amanha.getTime()) quando = "amanhã";
      else quando = `dia ${dataAg.getDate()}/${dataAg.getMonth() + 1}`;

      switch(tipo) {
          case 'confirma': texto = `Olá *${nome}*! Passando para confirmar seu horário de *${modalMensagem.servico}* ${quando} às *${horario}*. Posso confirmar?`; break;
          case 'atraso': texto = `Oi *${nome}*! 🌸 Tive um pequeno imprevisto no atendimento anterior. Você se importa se começarmos *15 minutinhos* mais tarde (${horario})? Desculpe e obrigada pela compreensão! 🙏`; break;
          case 'posvenda': texto = `Olá, ${nome}, tudo bem?😊\nPassando para saber como você se sentiu com o procedimento e se gostou do resultado.\nSe quiser me contar sua experiência aqui no studio, vou amar receber seu feedback. ✨`; break;
      }
      window.open(`https://wa.me/55${modalMensagem.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
      setModalMensagem(null);
  };

  async function concluirFinanceiro(e: React.FormEvent) {
    e.preventDefault();
    const total = parseFloat(String(finalizandoAg.valor_total).replace(',', '.')) || 0;
    const material = parseFloat(String(finalizandoAg.custo_material).replace(',', '.')) || 0;
    const porc = parseFloat(String(finalizandoAg.porcentagem_comissao).replace(',', '.')) || 100;
    const valorComissao = (total - material) * (porc / 100);

    await supabase.from("agendamentos").update({ status: 'concluido', valor_total: total, custo_material: material, porcentagem_comissao: porc, valor_comissao: valorComissao }).eq('id', finalizandoAg.id);
    await supabase.from("financas").insert([{ descricao: `Atendimento: ${finalizandoAg.cliente_nome}`, valor: total, custo_material: material, comissao: valorComissao, tipo: 'entrada', data: new Date().toISOString() }]);

    setFinalizandoAg(null);
    buscarAgendamentos();
  }

  const confirmarExclusaoAgendamento = () => {
      setConfirmacao({
          ativo: true,
          titulo: "Cancelar este agendamento?",
          acao: async () => {
              await supabase.from("agendamentos").update({ status: 'cancelado' }).eq('id', opcoesAg.id);
              setOpcoesAg(null);
              buscarAgendamentos();
              setConfirmacao(null);
          }
      });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto pb-32">
      <header className="flex flex-col items-center text-center pt-4 pb-2">
         <h1 className={`${cinzel.className} text-3xl md:text-4xl text-[#E0E0E0] drop-shadow-lg tracking-wide`}>EMILY MATOS</h1>
         <div className="flex items-center gap-3 mt-2">
            <div className="h-[1px] w-8 bg-[#D49FAF]/50"></div>
            <p className="text-[10px] tracking-[0.4em] text-[#D49FAF] font-bold uppercase">Beauty Studio</p>
            <div className="h-[1px] w-8 bg-[#D49FAF]/50"></div>
         </div>
      </header>

      {/* BARRA DE DATA FLUTUANTE CORRIGIDA (Flex-Row Fix) */}
      <div className="sticky top-4 z-40 bg-white/10 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/20 shadow-xl flex flex-row items-center gap-2 pl-4">
        <div className="flex items-center gap-3 text-white flex-1 h-10 min-w-0">
            <CalendarIcon size={20} className="text-[#D49FAF] shrink-0" />
            <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} className="font-bold text-white outline-none bg-transparent uppercase text-sm tracking-widest cursor-pointer w-full h-full min-w-0" />
        </div>
        <button onClick={() => setMostrarModal(true)} className="bg-[#E0E0E0] text-[#373F47] px-5 h-10 rounded-[1.5rem] font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:bg-[#F7ACCF] hover:text-[#373F47] active:scale-95 shrink-0 whitespace-nowrap">
            <Plus size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Novo</span>
        </button>
      </div>

      <div className="space-y-4">
        {agendamentos.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                <div className="p-6 rounded-full bg-white/5 border border-white/10"><CalendarIcon size={32} className="text-[#D49FAF]" /></div>
                <p className="text-[#E0E0E0] font-light text-sm tracking-widest uppercase">Agenda Livre</p>
            </div>
        )}

        {agendamentos.map(ag => (
          <div key={ag.id} className={`relative p-5 rounded-[2rem] bg-[#E0E0E0] flex flex-col gap-4 shadow-lg transition-all border-l-4 ${ag.status === 'concluido' ? 'border-green-400 opacity-80 grayscale-[0.5]' : 'border-[#A16585]'}`}>
            <div className="flex justify-between items-start">
               <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center justify-center bg-[#373F47] text-[#D49FAF] h-14 w-14 rounded-2xl shadow-inner">
                      <span className="text-sm font-black leading-none">{ag.data_hora.split('T')[1].substring(0, 2)}</span>
                      <span className="text-[10px] font-bold leading-none opacity-70">:{ag.data_hora.split('T')[1].substring(3, 5)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-[#373F47] leading-tight">{ag.cliente_nome}</h3>
                        {ag.is_aniversariante && <Gift size={14} className="text-[#A16585] animate-bounce"/>}
                    </div>
                    <p className="text-[#A16585] text-[10px] uppercase font-black tracking-widest mt-1 bg-white/50 px-2 py-0.5 rounded w-fit">{ag.servico}</p>
                  </div>
               </div>
               {ag.status === 'concluido' && <CheckCircle2 className="text-green-600" size={24} />}
            </div>
            {ag.status !== 'concluido' && (
                <div className="flex gap-2 justify-end border-t border-[#373F47]/10 pt-3 mt-1">
                    <button onClick={() => setModalMensagem(ag)} className="flex-1 py-2 rounded-xl bg-white text-[#373F47] text-[10px] font-bold uppercase tracking-wide hover:bg-green-50 flex items-center justify-center gap-2 shadow-sm">
                        <MessageCircle size={14} className="text-green-600"/> Contato
                    </button>
                    <button onClick={() => setOpcoesAg(ag)} className="px-4 py-2 rounded-xl bg-white text-[#373F47] hover:bg-red-50 text-[10px] font-bold uppercase shadow-sm">Opções</button>
                    <button onClick={() => {
                        let v = ag.valor_sugerido || 0;
                        if(ag.is_aniversariante && configAniversario.ativo) v = v - (v * (configAniversario.valor / 100));
                        setFinalizandoAg({...ag, valor_total: v, custo_material: ag.custo_sugerido || 0, porcentagem_comissao: 100});
                      }} className="px-6 py-2 rounded-xl bg-[#373F47] text-[#F7ACCF] text-[10px] font-bold uppercase tracking-wide hover:brightness-110 shadow-md flex items-center gap-2">
                          <Check size={14}/> Finalizar
                    </button>
                </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL CENTRAL DE MENSAGENS (Z-Index 9999 - Nuclear) */}
      {modalMensagem && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-center justify-center p-6 z-[9999]">
           <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative animate-in zoom-in-95">
              <button onClick={() => setModalMensagem(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={18}/></button>
              <div className="text-center mb-6 mt-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-3 shadow-sm"><MessageCircle size={32} /></div>
                  <h3 className="text-lg font-bold text-[#373F47] uppercase tracking-wide">WhatsApp</h3>
                  <p className="text-xs text-gray-400 font-medium">Falar com {modalMensagem.cliente_nome.split(' ')[0]}</p>
              </div>
              <div className="grid gap-3">
                  {modalMensagem.status !== 'concluido' ? (
                    <>
                        <button onClick={() => gerarMensagem('confirma')} className="p-4 rounded-2xl bg-gray-50 hover:bg-[#F7ACCF]/10 border border-gray-100 hover:border-[#F7ACCF] transition-all flex items-center gap-4 text-left group">
                            <div className="bg-white p-2 rounded-xl shadow-sm text-[#373F47]"><CalendarIcon size={20}/></div>
                            <div><p className="text-sm font-bold text-[#373F47]">Confirmar</p><p className="text-[10px] text-gray-400">Enviar lembrete do horário</p></div>
                        </button>
                        <button onClick={() => gerarMensagem('atraso')} className="p-4 rounded-2xl bg-gray-50 hover:bg-yellow-50 border border-gray-100 hover:border-yellow-300 transition-all flex items-center gap-4 text-left group">
                            <div className="bg-white p-2 rounded-xl shadow-sm text-yellow-600"><Clock size={20}/></div>
                            <div><p className="text-sm font-bold text-[#373F47]">Atraso</p><p className="text-[10px] text-gray-400">Avisar imprevisto</p></div>
                        </button>
                    </>
                  ) : (
                    <button onClick={() => gerarMensagem('posvenda')} className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-center gap-4 text-left group">
                        <div className="bg-white p-2 rounded-xl shadow-sm text-purple-600"><Sparkles size={20}/></div>
                        <div><p className="text-sm font-bold text-[#373F47]">Pós-Venda</p><p className="text-[10px] text-gray-400">Coletar feedback da cliente</p></div>
                    </button>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* MODAL NOVO AGENDAMENTO (Z-Index 9999 - Nuclear) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-[9999]">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full md:max-w-sm max-h-[90vh] flex flex-col border-t-8 border-[#F7ACCF] animate-in slide-in-from-bottom-10">
            {/* Header Fixo */}
            <div className="p-6 pb-2 text-center">
                <h2 className={`${cinzel.className} text-xl text-[#373F47] font-bold`}>NOVO CLIENTE</h2>
            </div>
            
            {/* Corpo Rolável */}
            <div className="overflow-y-auto p-6 pt-2 space-y-4">
               <form id="form-novo-agendamento" onSubmit={async (e) => { 
                    e.preventDefault(); if(isEnviando) return; setIsEnviando(true);
                    const isAniv = clienteSelecionada ? ehAniversariante(clienteSelecionada.data_nascimento) : false;
                    await supabase.from("agendamentos").insert([{
                      cliente_nome: cliente, telefone, servico, data_hora: `${dataSelecionada}T${hora}:00`, 
                      status: 'confirmado', valor_sugerido: precoSugerido, custo_sugerido: custoSugerido,
                      is_aniversariante: isAniv
                    }]); 
                    setIsEnviando(false); setMostrarModal(false); buscarAgendamentos(); 
                }} className="space-y-4">
                  
                  <div className="relative group">
                    <input placeholder="Nome da Cliente" value={cliente} onChange={(e) => {
                        setCliente(e.target.value);
                        const filtrados = clientesBase.filter(c => c.nome.toLowerCase().includes(e.target.value.toLowerCase()));
                        setSugestoesClientes(e.target.value.length > 1 ? filtrados : []);
                    }} className="w-full p-4 bg-[#F5F5F5] text-[#373F47] rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#F7ACCF] transition-all" required />
                    {sugestoesClientes.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-100 mt-2 rounded-2xl shadow-xl max-h-40 overflow-y-auto p-1">
                        {sugestoesClientes.map(s => (
                          <button key={s.id} type="button" onClick={() => { setCliente(s.nome); setTelefone(s.telefone); setClienteSelecionada(s); setSugestoesClientes([]); }} className="w-full text-left px-4 py-3 hover:bg-[#F7ACCF]/10 rounded-xl text-[#373F47] text-xs font-bold transition-colors">{s.nome}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input placeholder="WhatsApp" type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-4 bg-[#F5F5F5] text-[#373F47] rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#F7ACCF] transition-all" required />
                  
                  <div className="relative">
                    <div className="flex items-center bg-[#F5F5F5] rounded-2xl pr-4 cursor-pointer focus-within:ring-2 focus-within:ring-[#F7ACCF] transition-all" onClick={() => setMostrarListaServicos(!mostrarListaServicos)}>
                      <input placeholder="Selecionar Serviço" value={servico} readOnly className="w-full p-4 bg-transparent outline-none cursor-pointer font-bold text-[#373F47] text-sm" required />
                      <ChevronDown size={18} className={`text-[#A16585] transition-transform ${mostrarListaServicos ? 'rotate-180' : ''}`} />
                    </div>
                    {mostrarListaServicos && (
                      <div className="absolute z-50 w-full bg-white border border-gray-100 mt-2 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1">
                        {servicosBase.map(s => (
                          <button key={s.id} type="button" onClick={() => { setServico(s.nome); setPrecoSugerido(s.preco_base); setCustoSugerido(s.custo_material_base); setMostrarListaServicos(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F7ACCF]/10 rounded-xl text-[#373F47] text-xs border-b border-gray-50 last:border-none font-bold flex items-center justify-between group">
                              <span>{s.nome}</span><span className="text-[#A16585] group-hover:text-[#373F47]">R$ {s.preco_base}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input type="time" onChange={e => setHora(e.target.value)} className="w-full p-4 bg-[#F5F5F5] text-[#373F47] rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#F7ACCF] transition-all" required />
                  
                  {/* Espaço extra para o teclado não cobrir */}
                  <div className="h-20 md:h-0"></div>
               </form>
            </div>

            {/* Footer Fixo */}
            <div className="p-6 pt-2 bg-white rounded-b-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex gap-3">
                 <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-[10px] tracking-wider hover:text-[#373F47]">Cancelar</button>
                 <button type="submit" form="form-novo-agendamento" disabled={isEnviando} className="flex-[2] py-4 bg-[#373F47] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all">{isEnviando ? "..." : "Confirmar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONCLUIR FINANCEIRO (Z-Index 9999 - Nuclear) */}
      {finalizandoAg && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-[9999]">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl w-full md:max-w-sm border-t-[8px] border-green-400 animate-in slide-in-from-bottom-10">
            <h2 className={`${cinzel.className} text-xl text-center mb-2 text-[#373F47] font-bold`}>RECEBER</h2>
            <p className="text-center text-xs text-gray-400 mb-6 uppercase tracking-wider">{finalizandoAg.cliente_nome}</p>

            {finalizandoAg.is_aniversariante && configAniversario.ativo && (
                <div className="bg-[#F7ACCF] text-[#373F47] p-3 rounded-xl mb-4 text-center text-[10px] font-black animate-pulse flex items-center justify-center gap-2 shadow-sm">
                    <Gift size={14}/> Desconto de Aniversário ({configAniversario.valor}%)
                </div>
            )}
            <form onSubmit={concluirFinanceiro} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-4">Valor Total (R$)</label>
                 <input type="number" inputMode="decimal" step="0.01" value={finalizandoAg.valor_total} onChange={e => setFinalizandoAg({...finalizandoAg, valor_total: e.target.value})} className="w-full p-4 bg-[#F5F5F5] text-[#373F47] rounded-2xl outline-none font-bold text-2xl text-center focus:ring-2 focus:ring-green-200" required />
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Custo</label>
                    <input type="number" inputMode="decimal" step="0.01" value={finalizandoAg.custo_material} onChange={e => setFinalizandoAg({...finalizandoAg, custo_material: e.target.value})} className="w-full p-3 bg-[#F5F5F5] text-gray-400 rounded-xl outline-none text-sm font-bold text-center" />
                </div>
                <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Comissão %</label>
                    <input type="number" inputMode="decimal" value={finalizandoAg.porcentagem_comissao} onChange={e => setFinalizandoAg({...finalizandoAg, porcentagem_comissao: e.target.value})} className="w-full p-3 bg-[#F5F5F5] rounded-xl outline-none font-bold text-[#A16585] text-sm text-center" />
                </div>
              </div>

              <div className="bg-[#373F47] p-4 rounded-2xl text-center shadow-lg mt-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Lucro Líquido</p>
                  <p className="text-2xl font-serif text-[#F7ACCF]">R$ {(( (parseFloat(String(finalizandoAg.valor_total).replace(',','.')) || 0) - (parseFloat(String(finalizandoAg.custo_material).replace(',','.')) || 0) ) * ((parseFloat(String(finalizandoAg.porcentagem_comissao).replace(',','.')) || 100) / 100)).toFixed(2)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setFinalizandoAg(null)} className="flex-1 py-3 text-gray-400 font-bold uppercase text-[10px] hover:text-[#373F47]">Cancelar</button>
                 <button type="submit" className="flex-[2] py-3 bg-green-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-green-600">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OPÇÕES (Z-Index 9999 - Nuclear) */}
      {opcoesAg && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-[9999]">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl w-full md:max-w-xs text-center animate-in slide-in-from-bottom-10">
            <h3 className={`${cinzel.className} text-lg text-[#373F47] mb-6 font-bold`}>GERENCIAR</h3>
            <div className="space-y-3">
              <button onClick={() => setRemarcandoAg({...opcoesAg})} className="w-full py-4 bg-[#F5F5F5] text-[#373F47] rounded-2xl font-bold text-sm hover:bg-[#F7ACCF] hover:text-white transition-colors">Reagendar Horário</button>
              <button onClick={confirmarExclusaoAgendamento} className="w-full py-4 bg-[#F5F5F5] text-red-400 rounded-2xl font-bold text-sm hover:bg-red-50">Cancelar Agendamento</button>
              <button onClick={() => setOpcoesAg(null)} className="text-gray-300 font-bold text-[10px] uppercase mt-4 block hover:text-gray-500 py-2">Voltar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO HORÁRIO (Z-Index 9999 - Nuclear) */}
      {remarcandoAg && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-[9999]">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl w-full md:max-w-xs text-center animate-in slide-in-from-bottom-10">
            <h2 className={`${cinzel.className} text-lg text-[#373F47] mb-6 font-bold`}>NOVO HORÁRIO</h2>
            <form onSubmit={async (e) => {
               e.preventDefault();
               await supabase.from("agendamentos").update({ data_hora: remarcandoAg.data_hora }).eq('id', remarcandoAg.id);
               setRemarcandoAg(null); setOpcoesAg(null); buscarAgendamentos();
            }} className="space-y-4">
              <input type="datetime-local" value={remarcandoAg.data_hora.substring(0, 16)} onChange={e => setRemarcandoAg({...remarcandoAg, data_hora: e.target.value})} className="w-full p-4 bg-[#F5F5F5] text-[#373F47] rounded-2xl outline-none font-bold text-sm" />
              <div className="flex gap-2">
                  <button type="button" onClick={() => setRemarcandoAg(null)} className="flex-1 py-3 text-gray-400 font-bold text-xs uppercase">Cancelar</button>
                  <button type="submit" className="flex-[2] py-3 bg-[#373F47] text-[#F7ACCF] rounded-xl font-bold text-xs uppercase shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO (Z-Index 10000 - Máximo Absoluto) */}
      {confirmacao && (
        <div className="fixed inset-0 bg-[#373F47]/90 backdrop-blur-sm flex items-center justify-center p-6 z-[10000]">
             <div className="bg-white p-6 rounded-[2.5rem] max-w-xs w-full text-center animate-in zoom-in-95 shadow-2xl border-b-8 border-red-400">
                 <div className="flex justify-center mb-4 text-red-400"><AlertTriangle size={48} /></div>
                 <h3 className={`${cinzel.className} text-xl text-[#373F47] font-bold mb-2`}>Tem Certeza?</h3>
                 <p className="text-sm text-gray-500 mb-6">{confirmacao.titulo}</p>
                 <div className="flex gap-3">
                     <button onClick={() => setConfirmacao(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs uppercase">Não</button>
                     <button onClick={confirmacao.acao} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase shadow-lg">Sim, Excluir</button>
                 </div>
             </div>
        </div>
      )}

    </div>
  );
}