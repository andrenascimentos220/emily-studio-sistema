"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, ArrowUpRight, ArrowDownRight, Filter, ChevronDown, Trophy, Medal, Star } from "lucide-react";

export default function FinanceiroPage() {
  // --- ESTADOS ---
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]); 
  const [resumo, setResumo] = useState({ bruto: 0, custos: 0, liquido: 0 });
  
  // ESTADOS DO FILTRO DE DATA
  const [tipoFiltro, setTipoFiltro] = useState<'dia' | 'semana' | 'mes' | 'custom'>('mes');
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    aplicarFiltro('mes');
  }, []);

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarDados();
    }
  }, [dataInicio, dataFim]);

  function aplicarFiltro(tipo: 'dia' | 'semana' | 'mes' | 'custom') {
      setTipoFiltro(tipo);
      const hoje = new Date();
      let inicio = "";
      let fim = "";

      const formatarData = (d: Date) => d.toISOString().split('T')[0];

      if (tipo === 'dia') {
          inicio = formatarData(hoje);
          fim = formatarData(hoje);
      } 
      else if (tipo === 'semana') {
          const primeiro = hoje.getDate() - hoje.getDay(); 
          const ultimo = primeiro + 6;
          const dataPrimeiro = new Date(hoje.setDate(primeiro));
          const dataUltimo = new Date(hoje.setDate(ultimo));
          inicio = formatarData(dataPrimeiro);
          fim = formatarData(dataUltimo);
      } 
      else if (tipo === 'mes') {
          const ano = hoje.getFullYear();
          const mes = hoje.getMonth();
          const dataPrimeiro = new Date(ano, mes, 1);
          const dataUltimo = new Date(ano, mes + 1, 0); 
          inicio = formatarData(dataPrimeiro);
          fim = formatarData(dataUltimo);
      }
      
      if (tipo !== 'custom') {
          setDataInicio(inicio);
          setDataFim(fim);
      }
  }

  async function carregarDados() {
    const inicioQuery = `${dataInicio}T00:00:00`;
    const fimQuery = `${dataFim}T23:59:59`;

    const { data: financasData } = await supabase
      .from("financas")
      .select("*")
      .gte("data", inicioQuery)
      .lte("data", fimQuery)
      .order("data", { ascending: false });

    if (financasData) {
      setTransacoes(financasData);
      calcularResumo(financasData);
    }

    const { data: agendamentosData } = await supabase
        .from("agendamentos")
        .select("servico, valor_total")
        .eq("status", "concluido")
        .gte("data_hora", inicioQuery)
        .lte("data_hora", fimQuery);
    
    if (agendamentosData) {
        processarRanking(agendamentosData);
    }
  }

  function calcularResumo(dados: any[]) {
    const bruto = dados.reduce((acc, item) => acc + (item.tipo === 'entrada' ? Number(item.valor) : 0), 0);
    const custos = dados.reduce((acc, item) => acc + Number(item.custo_material), 0);
    const saidasExtras = dados.reduce((acc, item) => acc + (item.tipo === 'saida' ? Number(item.valor) : 0), 0);
    const liquido = bruto - custos - saidasExtras;
    setResumo({ bruto, custos: custos + saidasExtras, liquido });
  }

  function processarRanking(dados: any[]) {
      const mapa = new Map();
      dados.forEach(item => {
          const atual = mapa.get(item.servico) || { qtd: 0, total: 0 };
          mapa.set(item.servico, {
              qtd: atual.qtd + 1,
              total: atual.total + Number(item.valor_total)
          });
      });

      const rankingOrdenado = Array.from(mapa.entries())
          .map(([servico, stats]) => ({ servico, ...stats }))
          .sort((a, b) => b.qtd - a.qtd)
          .slice(0, 5);

      setRanking(rankingOrdenado);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-4xl font-serif tracking-[0.2em] uppercase text-[#F7ACCF] font-bold drop-shadow-sm">Financeiro</h2>
            <p className="text-[10px] tracking-[0.4em] text-[#E0E0E0] font-light mt-1 uppercase">Gestão de Lucros</p>
        </div>
        
        <div className="bg-white p-2 rounded-[2rem] border-2 border-[#D49FAF]/30 shadow-md flex flex-col md:flex-row items-center gap-2">
            <div className="flex bg-[#E0E0E0] rounded-xl p-1">
                <button onClick={() => aplicarFiltro('dia')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${tipoFiltro === 'dia' ? 'bg-[#373F47] text-[#F7ACCF] shadow-sm' : 'text-gray-500 hover:text-[#373F47]'}`}>Hoje</button>
                <button onClick={() => aplicarFiltro('semana')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${tipoFiltro === 'semana' ? 'bg-[#373F47] text-[#F7ACCF] shadow-sm' : 'text-gray-500 hover:text-[#373F47]'}`}>Semana</button>
                <button onClick={() => aplicarFiltro('mes')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${tipoFiltro === 'mes' ? 'bg-[#373F47] text-[#F7ACCF] shadow-sm' : 'text-gray-500 hover:text-[#373F47]'}`}>Mês</button>
                <button onClick={() => aplicarFiltro('custom')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${tipoFiltro === 'custom' ? 'bg-[#373F47] text-[#F7ACCF] shadow-sm' : 'text-gray-500 hover:text-[#373F47]'}`}>Personalizado</button>
            </div>
            <div className="flex items-center gap-2 px-2">
                <input type="date" value={dataInicio} onChange={e => { setTipoFiltro('custom'); setDataInicio(e.target.value); }} className={`bg-transparent outline-none font-bold text-xs uppercase p-2 border rounded-lg ${tipoFiltro === 'custom' ? 'border-[#A16585] text-[#373F47]' : 'border-transparent text-gray-400'}`}/>
                <span className="text-gray-300 font-bold text-xs">ATÉ</span>
                <input type="date" value={dataFim} onChange={e => { setTipoFiltro('custom'); setDataFim(e.target.value); }} className={`bg-transparent outline-none font-bold text-xs uppercase p-2 border rounded-lg ${tipoFiltro === 'custom' ? 'border-[#A16585] text-[#373F47]' : 'border-transparent text-gray-400'}`}/>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border-2 border-transparent hover:border-[#D49FAF]/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-100 transition-colors"><TrendingUp size={24}/></div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Entradas</span>
              </div>
              <h3 className="text-3xl font-black text-[#373F47]">R$ {resumo.bruto.toFixed(2)}</h3>
              <p className="text-xs text-gray-400 mt-1">Neste período</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border-2 border-transparent hover:border-[#D49FAF]/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-100 transition-colors"><TrendingDown size={24}/></div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Custos & Material</span>
              </div>
              <h3 className="text-3xl font-black text-[#373F47]">R$ {resumo.custos.toFixed(2)}</h3>
              <p className="text-xs text-gray-400 mt-1">Despesas dedutíveis</p>
          </div>
          <div className="bg-[#373F47] p-6 rounded-[2.5rem] shadow-xl border-2 border-[#F7ACCF] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F7ACCF] opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-3 bg-[#F7ACCF] text-[#373F47] rounded-2xl animate-pulse"><Wallet size={24}/></div>
                  <span className="text-[10px] uppercase font-bold text-[#F7ACCF] tracking-wider">Lucro Líquido</span>
              </div>
              <h3 className="text-4xl font-black text-white relative z-10">R$ {resumo.liquido.toFixed(2)}</h3>
              <p className="text-xs text-gray-300 mt-1 relative z-10">Disponível em caixa</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-[#D49FAF]/20">
              <h3 className="font-serif text-xl text-[#373F47] mb-6 font-bold flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500"/> Campeões de Venda
              </h3>
              
              <div className="space-y-4">
                  {ranking.length === 0 && <p className="text-center text-gray-400 py-4 italic text-sm">Sem dados suficientes para ranking.</p>}
                  
                  {ranking.map((item, index) => {
                      let Icone = Star;
                      let corBg = "bg-gray-50";
                      let corTexto = "text-gray-500";
                      
                      if(index === 0) { Icone = Trophy; corBg = "bg-yellow-100"; corTexto = "text-yellow-600"; }
                      else if(index === 1) { Icone = Medal; corBg = "bg-gray-200"; corTexto = "text-gray-600"; }
                      else if(index === 2) { Icone = Medal; corBg = "bg-orange-100"; corTexto = "text-orange-600"; }

                      return (
                        <div key={item.servico} className="flex items-center justify-between p-3 hover:bg-[#F7ACCF]/10 rounded-2xl transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${corBg} ${corTexto}`}>
                                    {index < 3 ? <Icone size={18}/> : <span className="text-xs">{index + 1}º</span>}
                                </div>
                                <div>
                                    <p className="font-bold text-[#373F47] text-sm">{item.servico}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">{item.qtd} atendimentos</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-black text-[#A16585] text-sm">R$ {item.total.toFixed(0)}</span>
                            </div>
                        </div>
                      )
                  })}
              </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-[#D49FAF]/20">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-[#373F47] font-bold flex items-center gap-2">
                    <DollarSign size={20} className="text-[#A16585]"/> Extrato
                </h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {transacoes.length === 0 && <p className="text-center text-gray-400 py-4 italic text-sm">Nenhuma movimentação.</p>}
                {transacoes.map(t => (
                    <div key={t.id} className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-2xl transition-colors border-b border-gray-100 last:border-0">
                        <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-xl mt-1 ${t.tipo === 'entrada' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {t.tipo === 'entrada' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                            </div>
                            <div className="flex-1">
                                {/* AQUI: Removido line-clamp-1 para mostrar nome completo */}
                                <p className="font-bold text-[#373F47] text-xs leading-tight">{t.descricao}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <div className="text-right pl-2">
                            <p className={`font-black text-sm whitespace-nowrap ${t.tipo === 'entrada' ? 'text-[#373F47]' : 'text-red-500'}`}>
                                {t.tipo === 'entrada' ? '+' : '-'} R$ {Number(t.valor).toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
          </div>

      </div>
    </div>
  );
}