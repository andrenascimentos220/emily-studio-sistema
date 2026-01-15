"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, CheckCircle2, Calendar as CalendarIcon, Check, Cake, Clock, Sparkles, MessageCircle, ChevronDown, Gift } from "lucide-react";

export default function AgendaPage() {
  // --- ESTADOS PRINCIPAIS ---
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [configAniversario, setConfigAniversario] = useState({ ativo: false, valor: 0 });

  // --- MODAIS ---
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalMensagem, setModalMensagem] = useState<any>(null); // CENTRAL DE MENSAGENS
  const [finalizandoAg, setFinalizandoAg] = useState<any>(null);
  const [opcoesAg, setOpcoesAg] = useState<any>(null);
  const [remarcandoAg, setRemarcandoAg] = useState<any>(null);

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

  // --- CENTRAL DE MENSAGENS COM OS NOVOS TEXTOS ---
  const gerarMensagem = (tipo: 'confirma' | 'atraso' | 'posvenda') => {
      if(!modalMensagem) return;
      const nome = modalMensagem.cliente_nome.split(' ')[0];
      const horario = modalMensagem.data_hora.split('T')[1].substring(0, 5);
      
      let texto = "";

      // LÓGICA DE DATA INTELIGENTE (Hoje / Amanhã / Data)
      const dataAg = new Date(modalMensagem.data_hora.split('T')[0] + "T00:00:00");
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);

      let quando = "";
      if (dataAg.getTime() === hoje.getTime()) {
          quando = "hoje";
      } else if (dataAg.getTime() === amanha.getTime()) {
          quando = "amanhã";
      } else {
          quando = `dia ${dataAg.getDate()}/${dataAg.getMonth() + 1}`;
      }

      switch(tipo) {
          case 'confirma':
              // TEXTO 4
              texto = `Olá *${nome}*! Passando para confirmar seu horário de *${modalMensagem.servico}* ${quando} às *${horario}*. Posso confirmar?`;
              break;
              
          case 'atraso':
              texto = `Oi *${nome}*! 🌸 Tive um pequeno imprevisto no atendimento anterior. Você se importa se começarmos *15 minutinhos* mais tarde (${horario})? Desculpe e obrigada pela compreensão! 🙏`;
              break;
              
          case 'posvenda':
              // TEXTO 1
              texto = `Olá, ${nome}, tudo bem?😊\nPassando para saber como você se sentiu com o procedimento e se gostou do resultado.\nSe quiser me contar sua experiência aqui no studio, vou amar receber seu feedback. ✨`;
              break;
      }
      window.open(`https://wa.me/55${modalMensagem.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
      setModalMensagem(null);
  };

  async function concluirFinanceiro(e: React.FormEvent) {
    e.preventDefault();
    const total = parseFloat(finalizandoAg.valor_total) || 0;
    const material = parseFloat(finalizandoAg.custo_material) || 0;
    const porc = parseFloat(finalizandoAg.porcentagem_comissao) || 100;
    const valorComissao = (total - material) * (porc / 100);

    await supabase.from("agendamentos").update({ status: 'concluido', valor_total: total, custo_material: material, porcentagem_comissao: porc, valor_comissao: valorComissao }).eq('id', finalizandoAg.id);
    await supabase.from("financas").insert([{ descricao: `Atendimento: ${finalizandoAg.cliente_nome}`, valor: total, custo_material: material, comissao: valorComissao, tipo: 'entrada', data: new Date().toISOString() }]);

    setFinalizandoAg(null);
    buscarAgendamentos();
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto pb-24">
      {/* CABEÇALHO */}
      <header className="flex flex-col items-center text-center">
          <h2 className="text-4xl font-serif tracking-[0.2em] uppercase text-[#F7ACCF] drop-shadow-sm font-bold">Emily Matos</h2>
          <p className="text-[10px] tracking-[0.8em] text-[#E0E0E0] font-light mt-2 uppercase">Studio</p>
      </header>

      {/* BARRA DE DATA E BOTÕES */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border-2 border-[#D49FAF]/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-[#A16585]">
            <CalendarIcon />
            <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} className="font-bold text-[#373F47] outline-none bg-transparent uppercase" />
        </div>
        <button onClick={() => setMostrarModal(true)} className="w-full md:w-auto bg-[#373F47] text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:bg-[#F7ACCF] hover:text-[#373F47]">
            <Plus size={16}/> Novo Agendamento
        </button>
      </div>

      {/* LISTAGEM DE AGENDAMENTOS */}
      <div className="space-y-4">
        {agendamentos.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-light italic">Nenhum agendamento para este dia.</div>
        )}

        {agendamentos.map(ag => (
          <div key={ag.id} className={`p-6 rounded-[2rem] bg-white border-2 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md transition-all hover:shadow-xl ${ag.status === 'concluido' ? 'border-[#A16585]/20 opacity-90' : 'border-[#D49FAF]/40'}`}>
            
            <div className="flex gap-6 items-center w-full">
              <div className="bg-[#E0E0E0] text-[#373F47] px-5 py-3 rounded-2xl font-black text-sm min-w-[80px] text-center">
                  {ag.data_hora.split('T')[1].substring(0, 5)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-lg text-[#373F47]">{ag.cliente_nome}</h3>
                   {ag.is_aniversariante && (
                       <div className="bg-[#F7ACCF]/20 text-[#A16585] p-1 rounded-full animate-pulse" title="Aniversariante!">
                           <Cake size={14} />
                       </div>
                   )}
                </div>
                <p className="text-[#A16585] text-[10px] uppercase font-black tracking-wide">{ag.servico}</p>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-2 w-full md:w-auto justify-end">
                  
                  {/* MENSAGEM */}
                  <button onClick={() => setModalMensagem(ag)} className="p-3 text-[#E0E0E0] hover:text-green-500 bg-[#373F47] rounded-full transition-all" title="Central de Mensagens">
                      <MessageCircle size={20}/>
                  </button>

                  {ag.status !== 'concluido' ? (
                    <>
                      {/* FINALIZAR */}
                      <button onClick={() => {
                        let v = ag.valor_sugerido || 0;
                        if(ag.is_aniversariante && configAniversario.ativo) {
                            v = v - (v * (configAniversario.valor / 100));
                        }
                        setFinalizandoAg({...ag, valor_total: v, custo_material: ag.custo_sugerido || 0, porcentagem_comissao: 100});
                      }} className="p-3 text-[#E0E0E0] hover:text-[#F7ACCF] bg-[#373F47] rounded-full transition-all" title="Finalizar e Receber">
                          <CheckCircle2 size={20}/>
                      </button>
                      
                      {/* OPÇÕES */}
                      <button onClick={() => setOpcoesAg(ag)} className="p-3 text-[#E0E0E0] hover:text-[#A16585] bg-[#373F47] rounded-full transition-all">
                          <X size={20}/>
                      </button>
                    </>
                  ) : (
                    <div className="p-3 text-[#F7ACCF] bg-[#373F47] rounded-full flex items-center gap-2 px-4 cursor-default">
                        <Check size={16}/> <span className="text-xs font-bold">Concluído</span>
                    </div>
                  )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CENTRAL DE MENSAGENS */}
      {modalMensagem && (
        <div className="fixed inset-0 bg-[#373F47]/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
           <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-t-[12px] border-green-400 relative">
              <button onClick={() => setModalMensagem(null)} className="absolute top-4 right-6 text-gray-300 hover:text-gray-600"><X/></button>
              
              <div className="text-center mb-6">
                  <div className="inline-block p-4 bg-green-100 rounded-full text-green-600 mb-2">
                      <MessageCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#373F47] uppercase">WhatsApp: {modalMensagem.cliente_nome.split(' ')[0]}</h3>
                  <p className="text-xs text-gray-400">
                    {modalMensagem.status === 'concluido' ? 'Pós-Venda' : 'Operacional'}
                  </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  
                  {modalMensagem.status !== 'concluido' ? (
                    <>
                        {/* CONFIRMAÇÃO COM LÓGICA DE HOJE/AMANHÃ */}
                        <button onClick={() => gerarMensagem('confirma')} className="p-4 rounded-2xl bg-gray-50 hover:bg-[#F7ACCF]/20 border border-gray-100 hover:border-[#F7ACCF] transition-all text-left group">
                            <CalendarIcon className="mb-2 text-[#373F47] group-hover:text-[#A16585]" size={20}/>
                            <p className="text-sm font-bold text-[#373F47]">Lembrete</p>
                            <p className="text-[10px] text-gray-400">Confirmar horário</p>
                        </button>

                        <button onClick={() => gerarMensagem('atraso')} className="p-4 rounded-2xl bg-gray-50 hover:bg-yellow-50 border border-gray-100 hover:border-yellow-300 transition-all text-left group">
                            <Clock className="mb-2 text-[#373F47] group-hover:text-yellow-600" size={20}/>
                            <p className="text-sm font-bold text-[#373F47]">Atraso</p>
                            <p className="text-[10px] text-gray-400">Avisar imprevisto</p>
                        </button>
                    </>
                  ) : (
                    /* FEEDBACK / POS VENDA - TEXTO 1 */
                    <button onClick={() => gerarMensagem('posvenda')} className="p-4 rounded-2xl bg-purple-50 border border-purple-200 shadow-md ring-2 ring-purple-100 transition-all text-left group col-span-2">
                        <Sparkles className="mb-2 text-purple-600" size={20}/>
                        <p className="text-sm font-bold text-[#373F47]">Pós-Venda / Feedback</p>
                        <p className="text-[10px] text-gray-400">Mensagem de experiência</p>
                    </button>
                  )}

              </div>
           </div>
        </div>
      )}

      {/* MODAL NOVO AGENDAMENTO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-b-8 border-[#F7ACCF]">
            <h2 className="text-xl font-serif uppercase tracking-widest mb-6 text-center text-[#A16585] font-bold">Agendar Cliente</h2>
            <form onSubmit={async (e) => { 
                e.preventDefault(); if(isEnviando) return; setIsEnviando(true);
                const isAniv = clienteSelecionada ? ehAniversariante(clienteSelecionada.data_nascimento) : false;
                await supabase.from("agendamentos").insert([{
                  cliente_nome: cliente, telefone, servico, data_hora: `${dataSelecionada}T${hora}:00`, 
                  status: 'confirmado', valor_sugerido: precoSugerido, custo_sugerido: custoSugerido,
                  is_aniversariante: isAniv
                }]); 
                setIsEnviando(false); setMostrarModal(false); buscarAgendamentos(); 
            }} className="space-y-4">
              <div className="relative">
                <input placeholder="Nome da Cliente" value={cliente} onChange={(e) => {
                    setCliente(e.target.value);
                    const filtrados = clientesBase.filter(c => c.nome.toLowerCase().includes(e.target.value.toLowerCase()));
                    setSugestoesClientes(e.target.value.length > 1 ? filtrados : []);
                }} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold placeholder:text-gray-400" required />
                {sugestoesClientes.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-[#D49FAF] mt-1 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {sugestoesClientes.map(s => (
                      <button key={s.id} type="button" onClick={() => { setCliente(s.nome); setTelefone(s.telefone); setClienteSelecionada(s); setSugestoesClientes([]); }} className="w-full text-left px-4 py-3 hover:bg-[#F7ACCF]/20 text-[#373F47] text-sm border-b border-[#E0E0E0] last:border-none font-bold">{s.nome}</button>
                    ))}
                  </div>
                )}
              </div>
              <input placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold placeholder:text-gray-400" required />
              <div className="relative">
                <div className="flex items-center bg-[#E0E0E0] rounded-2xl pr-4 cursor-pointer" onClick={() => setMostrarListaServicos(!mostrarListaServicos)}>
                  <input placeholder="Escolher Procedimento" value={servico} readOnly className="w-full p-4 bg-transparent outline-none cursor-pointer font-bold text-[#373F47] placeholder:text-gray-400" required />
                  <ChevronDown className={`text-[#A16585] transition-transform ${mostrarListaServicos ? 'rotate-180' : ''}`} />
                </div>
                {mostrarListaServicos && (
                  <div className="absolute z-50 w-full bg-white border border-[#D49FAF] mt-1 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {servicosBase.map(s => (
                      <button key={s.id} type="button" onClick={() => { setServico(s.nome); setPrecoSugerido(s.preco_base); setCustoSugerido(s.custo_material_base); setMostrarListaServicos(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F7ACCF]/20 text-[#373F47] text-sm border-b border-[#E0E0E0] last:border-none font-bold">
                          {s.tipo === 'combo' && <span className="text-[10px] bg-[#373F47] text-[#F7ACCF] px-1 rounded mr-2">COMBO</span>}
                          {s.nome} - R$ {s.preco_base}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="time" onChange={e => setHora(e.target.value)} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold" required />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-xs hover:text-[#373F47]">Voltar</button>
                <button type="submit" disabled={isEnviando} className="flex-2 py-4 px-8 bg-[#F7ACCF] text-[#373F47] rounded-2xl font-black shadow-md hover:brightness-105">{isEnviando ? "..." : "CONFIRMAR"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONCLUIR FINANCEIRO */}
      {finalizandoAg && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-t-[12px] border-[#F7ACCF]">
            <h2 className="text-xl font-serif text-center uppercase mb-4 text-[#A16585] font-bold">Concluir</h2>
            {finalizandoAg.is_aniversariante && configAniversario.ativo && (
                <div className="bg-[#F7ACCF] text-[#373F47] p-4 rounded-2xl mb-4 text-center text-xs font-black animate-pulse flex items-center justify-center gap-2">
                    <Gift size={16}/> Desconto de Aniversário ({configAniversario.valor}%) Aplicado!
                </div>
            )}
            <form onSubmit={concluirFinanceiro} className="space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-4">Valor Total</label><input type="number" step="0.01" value={finalizandoAg.valor_total} onChange={e => setFinalizandoAg({...finalizandoAg, valor_total: e.target.value})} className="w-full p-5 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold text-2xl text-center" required /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-4">Custo Mat.</label><input type="number" step="0.01" value={finalizandoAg.custo_material} onChange={e => setFinalizandoAg({...finalizandoAg, custo_material: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-gray-400 rounded-2xl outline-none" readOnly /></div>
                <div className="w-24"><label className="text-[10px] font-bold text-gray-400 uppercase ml-4">% Emily</label><input type="number" value={finalizandoAg.porcentagem_comissao} onChange={e => setFinalizandoAg({...finalizandoAg, porcentagem_comissao: e.target.value})} className="w-full p-4 bg-[#E0E0E0] rounded-2xl outline-none font-bold text-[#F7ACCF]" /></div>
              </div>
              <div className="bg-[#D49FAF]/20 p-8 rounded-[2rem] text-center border border-[#D49FAF]/30"><p className="text-4xl font-serif text-[#373F47]">R$ {(( (parseFloat(finalizandoAg.valor_total) || 0) - (parseFloat(finalizandoAg.custo_material) || 0) ) * ((parseFloat(finalizandoAg.porcentagem_comissao) || 100) / 100)).toFixed(2)}</p></div>
              <button type="submit" className="w-full py-5 bg-[#373F47] text-white rounded-[2rem] font-bold shadow-xl hover:bg-black transition-all">Finalizar</button>
              <button type="button" onClick={() => setFinalizandoAg(null)} className="w-full text-gray-400 font-bold text-xs uppercase mt-2 hover:text-[#373F47]">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OPÇÕES */}
      {opcoesAg && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-xs w-full text-center border-t-8 border-[#F7ACCF]">
            <h3 className="font-serif text-xl text-[#A16585] mb-6 uppercase tracking-widest font-bold">Opções</h3>
            <div className="space-y-4">
              <button onClick={() => setRemarcandoAg({...opcoesAg})} className="w-full py-4 bg-[#373F47] text-white rounded-2xl font-bold hover:bg-[#A16585] transition-colors">Reagendar</button>
              <button onClick={async () => { if(confirm("Excluir agendamento?")) { await supabase.from("agendamentos").update({ status: 'cancelado' }).eq('id', opcoesAg.id); setOpcoesAg(null); buscarAgendamentos(); } }} className="w-full py-4 bg-[#E0E0E0] text-[#A16585] rounded-2xl font-bold hover:bg-rose-100">Excluir</button>
              <button onClick={() => setOpcoesAg(null)} className="text-gray-400 font-bold text-xs uppercase mt-4">Sair</button>
            </div>
          </div>
        </div>
      )}

      {remarcandoAg && (
        <div className="fixed inset-0 bg-[#373F47]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-b-8 border-[#F7ACCF]">
            <h2 className="text-xl font-serif uppercase text-center text-[#A16585] mb-6 font-bold">Alterar Horário</h2>
            <form onSubmit={async (e) => {
               e.preventDefault();
               await supabase.from("agendamentos").update({ data_hora: remarcandoAg.data_hora }).eq('id', remarcandoAg.id);
               setRemarcandoAg(null); setOpcoesAg(null); buscarAgendamentos();
            }} className="space-y-4">
              <input type="datetime-local" value={remarcandoAg.data_hora.substring(0, 16)} onChange={e => setRemarcandoAg({...remarcandoAg, data_hora: e.target.value})} className="w-full p-4 bg-[#E0E0E0] text-[#373F47] rounded-2xl outline-none font-bold" />
              <button type="submit" className="w-full py-4 bg-[#F7ACCF] text-[#373F47] rounded-2xl font-black">Salvar Alteração</button>
              <button type="button" onClick={() => setRemarcandoAg(null)} className="w-full text-gray-400 font-bold text-xs uppercase">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}