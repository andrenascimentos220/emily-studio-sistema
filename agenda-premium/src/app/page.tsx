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
  const [modalMensagem, setModalMensagem] = useState<any>(null); 
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

  const gerarMensagem = (tipo: 'confirma' | 'atraso' | 'posvenda') => {
      if(!modalMensagem) return;
      const nome = modalMensagem.cliente_nome.split(' ')[0];
      const horario = modalMensagem.data_hora.split('T')[1].substring(0, 5);
      
      let texto = "";
      const dataAg = new Date(modalMensagem.data_hora.split('T')[0] + "T00:00:00");
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);

      let quando = "";
      if (dataAg.getTime() === hoje.getTime()) { quando = "hoje"; } 
      else if (dataAg.getTime() === amanha.getTime()) { quando = "amanhã"; } 
      else { quando = `dia ${dataAg.getDate()}/${dataAg.getMonth() + 1}`; }

      switch(tipo) {
          case 'confirma':
              texto = `Olá *${nome}*! Passando para confirmar seu horário de *${modalMensagem.servico}* ${quando} às *${horario}*. Posso confirmar?`;
              break;
          case 'atraso':
              texto = `Oi *${nome}*! 🌸 Tive um pequeno imprevisto no atendimento anterior. Você se importa se começarmos *15 minutinhos* mais tarde (${horario})? Desculpe e obrigada pela compreensão! 🙏`;
              break;
          case 'posvenda':
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
    <div className="w-full max-w-md mx-auto p-4 space-y-6 pb-24 overflow-x-hidden">
      {/* CABEÇALHO RESPONSIVO */}
      <header className="flex flex-col items-center text-center pt-4">
          <h2 className="text-2xl md:text-4xl font-serif tracking-[0.1em] uppercase text-[#F7ACCF] font-bold">Emily Matos</h2>
          <p className="text-[10px] tracking-[0.5em] text-gray-400 font-light mt-1 uppercase">Studio</p>
      </header>

      {/* BARRA DE DATA E BOTÕES AJUSTADA */}
      <div className="bg-white p-4 rounded-3xl shadow-md border border-[#D49FAF]/20 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-3 text-[#A16585]">
            <CalendarIcon size={20} />
            <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} className="font-bold text-[#373F47] outline-none bg-transparent" />
        </div>
        <button onClick={() => setMostrarModal(true)} className="w-full bg-[#373F47] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Plus size={18}/> Novo Agendamento
        </button>
      </div>

      {/* LISTAGEM DE AGENDAMENTOS RESPONSIVA */}
      <div className="space-y-4">
        {agendamentos.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-light italic">Nenhum agendamento para este dia.</div>
        )}

        {agendamentos.map(ag => (
          <div key={ag.id} className={`p-4 rounded-3xl bg-white border shadow-sm flex flex-col gap-4 ${ag.status === 'concluido' ? 'border-gray-100 opacity-75' : 'border-pink-100'}`}>
            
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 text-[#373F47] px-3 py-2 rounded-xl font-black text-sm min-w-[65px] text-center">
                  {ag.data_hora.split('T')[1].substring(0, 5)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-1">
                   <h3 className="font-bold text-gray-800 truncate">{ag.cliente_nome}</h3>
                   {ag.is_aniversariante && <Cake size={14} className="text-pink-400 animate-bounce" />}
                </div>
                <p className="text-[#A16585] text-[10px] uppercase font-bold truncate">{ag.servico}</p>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO LADO A LADO NO MOBILE */}
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">
                  <button onClick={() => setModalMensagem(ag)} className="flex-1 max-w-[50px] aspect-square flex items-center justify-center text-white bg-[#373F47] rounded-xl active:bg-green-500 transition-all">
                      <MessageCircle size={20}/>
                  </button>

                  {ag.status !== 'concluido' ? (
                    <>
                      <button onClick={() => {
                        let v = ag.valor_sugerido || 0;
                        if(ag.is_aniversariante && configAniversario.ativo) {
                            v = v - (v * (configAniversario.valor / 100));
                        }
                        setFinalizandoAg({...ag, valor_total: v, custo_material: ag.custo_sugerido || 0, porcentagem_comissao: 100});
                      }} className="flex-1 py-3 bg-pink-100 text-pink-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:bg-pink-200">
                          <CheckCircle2 size={16}/> Finalizar
                      </button>
                      <button onClick={() => setOpcoesAg(ag)} className="flex-1 max-w-[50px] aspect-square flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                          <X size={20}/>
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 py-3 bg-gray-50 text-pink-400 rounded-xl flex items-center justify-center gap-2 border border-gray-100">
                        <Check size={16}/> <span className="text-xs font-bold uppercase">Pago</span>
                    </div>
                  )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL MENSAGENS RESPONSIVO */}
      {modalMensagem && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
           <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl w-full max-w-[320px] relative overflow-hidden">
              <div className="w-full h-2 bg-green-400 absolute top-0 left-0" />
              <button onClick={() => setModalMensagem(null)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
              
              <div className="text-center my-4">
                  <h3 className="font-bold text-gray-800 uppercase text-sm">WhatsApp: {modalMensagem.cliente_nome.split(' ')[0]}</h3>
              </div>

              <div className="flex flex-col gap-3">
                  {modalMensagem.status !== 'concluido' ? (
                    <>
                        <button onClick={() => gerarMensagem('confirma')} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left flex items-center gap-3">
                            <CalendarIcon className="text-pink-500" size={20}/>
                            <div><p className="text-xs font-bold">Lembrete</p><p className="text-[10px] text-gray-400">Confirmar horário</p></div>
                        </button>
                        <button onClick={() => gerarMensagem('atraso')} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left flex items-center gap-3">
                            <Clock className="text-yellow-500" size={20}/>
                            <div><p className="text-xs font-bold">Atraso</p><p className="text-[10px] text-gray-400">Avisar imprevisto</p></div>
                        </button>
                    </>
                  ) : (
                    <button onClick={() => gerarMensagem('posvenda')} className="w-full p-5 rounded-2xl bg-purple-50 border border-purple-100 text-left flex items-center gap-3">
                        <Sparkles className="text-purple-500" size={20}/>
                        <div><p className="text-xs font-bold">Pós-Venda</p><p className="text-[10px] text-gray-400">Feedback da cliente</p></div>
                    </button>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* MODAL NOVO AGENDAMENTO RESPONSIVO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4 z-[100]">
          <div className="bg-white p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-slide-up">
            <h2 className="text-lg font-bold mb-6 text-center text-pink-500 uppercase tracking-widest">Agendar</h2>
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
                }} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-sm" required />
                {sugestoesClientes.length > 0 && (
                  <div className="absolute z-[110] w-full bg-white border border-pink-100 mt-1 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                    {sugestoesClientes.map(s => (
                      <button key={s.id} type="button" onClick={() => { setCliente(s.nome); setTelefone(s.telefone); setClienteSelecionada(s); setSugestoesClientes([]); }} className="w-full text-left px-4 py-4 hover:bg-pink-50 text-sm border-b border-gray-50 font-bold">{s.nome}</button>
                    ))}
                  </div>
                )}
              </div>
              <input placeholder="WhatsApp (DDD)" type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-sm" required />
              
              <div className="relative">
                <div className="flex items-center bg-gray-100 rounded-2xl pr-4" onClick={() => setMostrarListaServicos(!mostrarListaServicos)}>
                  <input placeholder="Procedimento" value={servico} readOnly className="w-full p-4 bg-transparent outline-none font-bold text-sm cursor-pointer" required />
                  <ChevronDown size={18} className="text-pink-400" />
                </div>
                {mostrarListaServicos && (
                  <div className="absolute z-[110] w-full bg-white border border-pink-100 mt-1 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                    {servicosBase.map(s => (
                      <button key={s.id} type="button" onClick={() => { setServico(s.nome); setPrecoSugerido(s.preco_base); setCustoSugerido(s.custo_material_base); setMostrarListaServicos(false); }} className="w-full text-left px-4 py-4 hover:bg-pink-50 text-xs border-b border-gray-50 font-bold">
                          {s.nome} - R$ {s.preco_base}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input type="time" onChange={e => setHora(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold" required />
              
              <div className="flex flex-col gap-2 pt-4">
                <button type="submit" disabled={isEnviando} className="w-full py-4 bg-pink-400 text-white rounded-2xl font-black shadow-lg">
                    {isEnviando ? "SALVANDO..." : "CONFIRMAR"}
                </button>
                <button type="button" onClick={() => setMostrarModal(false)} className="w-full py-3 text-gray-400 text-xs font-bold uppercase">Voltar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONCLUIR FINANCEIRO RESPONSIVO */}
      {finalizandoAg && (
        <div className="fixed inset-0 bg-[#373F47]/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl w-full max-w-sm border-t-[8px] border-pink-400">
            <h2 className="text-lg font-bold text-center mb-6 text-gray-800 uppercase">Receber Pagamento</h2>
            <form onSubmit={concluirFinanceiro} className="space-y-4">
              <div className="text-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Valor do Serviço</label>
                <input type="number" step="0.01" value={finalizandoAg.valor_total} onChange={e => setFinalizandoAg({...finalizandoAg, valor_total: e.target.value})} className="w-full p-4 bg-gray-50 text-gray-800 rounded-2xl outline-none font-bold text-3xl text-center border-2 border-pink-50" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Materiais</label>
                    <p className="font-bold text-sm text-gray-500">R$ {finalizandoAg.custo_material}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Comissão %</label>
                    <input type="number" value={finalizandoAg.porcentagem_comissao} onChange={e => setFinalizandoAg({...finalizandoAg, porcentagem_comissao: e.target.value})} className="w-full bg-transparent text-center font-black text-pink-500 outline-none" />
                </div>
              </div>
              
              <div className="bg-pink-50 p-6 rounded-2xl text-center">
                <p className="text-[10px] text-pink-400 uppercase font-bold mb-1">Líquido Emily</p>
                <p className="text-3xl font-bold text-pink-600">R$ {(( (parseFloat(finalizandoAg.valor_total) || 0) - (parseFloat(finalizandoAg.custo_material) || 0) ) * ((parseFloat(finalizandoAg.porcentagem_comissao) || 100) / 100)).toFixed(2)}</p>
              </div>

              <button type="submit" className="w-full py-4 bg-[#373F47] text-white rounded-2xl font-bold shadow-lg">CONCLUIR</button>
              <button type="button" onClick={() => setFinalizandoAg(null)} className="w-full text-gray-400 text-xs font-bold uppercase py-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OPÇÕES RESPONSIVO */}
      {opcoesAg && (
        <div className="fixed inset-0 bg-[#373F47]/80 backdrop-blur-sm flex items-end justify-center p-4 z-[100]">
          <div className="bg-white p-6 rounded-t-[2.5rem] w-full max-w-sm text-center">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="space-y-3">
              <button onClick={() => setRemarcandoAg({...opcoesAg})} className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold border border-gray-100">Reagendar Horário</button>
              <button onClick={async () => { if(confirm("Excluir definitivamente?")) { await supabase.from("agendamentos").update({ status: 'cancelado' }).eq('id', opcoesAg.id); setOpcoesAg(null); buscarAgendamentos(); } }} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-100">Excluir Agendamento</button>
              <button onClick={() => setOpcoesAg(null)} className="w-full py-4 text-gray-400 font-bold text-xs uppercase pt-4">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}