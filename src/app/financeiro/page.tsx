"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, X, Loader2, ShoppingBag, Scissors, 
  Trash2, ArrowUpCircle, ArrowDownCircle, Award, Edit2, Save
} from "lucide-react";

export default function Financeiro() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    id: null as string | null,
    descricao: "",
    valor: "",
    custo: "",
    tipo: "receita", 
    categoria: "servico",
    data_transacao: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchFinanceData(); }, [dateRange]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const start = `${dateRange.from}T00:00:00.000Z`;
      const end = `${dateRange.to}T23:59:59.999Z`;

      // AJUSTE: Buscando na tabela 'financeiro' (onde a agenda joga os dados) 
      // e usando Left Join para não quebrar nos lançamentos avulsos
      const { data, error } = await supabase
        .from("financeiro")
        .select(`*, clientes!left(nome)`)
        .gte("data_transacao", start)
        .lte("data_transacao", end)
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Erro na busca do banco:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const valorNum = parseFloat(formData.valor) || 0;
    const custoNum = formData.tipo === 'receita' ? (parseFloat(formData.custo) || 0) : 0;

    const payload = {
      descricao: formData.descricao,
      valor: valorNum,
      custo: custoNum,
      tipo: formData.tipo,
      categoria: formData.categoria,
      data_transacao: new Date(formData.data_transacao).toISOString()
    };

    try {
      if (formData.id) {
        await supabase.from("financeiro").update(payload).eq("id", formData.id);
      } else {
        await supabase.from("financeiro").insert([payload]);
      }
      setIsModalOpen(false);
      resetForm();
      await fetchFinanceData();
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este lançamento permanentemente?")) return;
    await supabase.from("financeiro").delete().eq("id", id);
    fetchFinanceData();
  };

  const resetForm = () => {
    setFormData({ id: null, descricao: "", valor: "", custo: "", tipo: "receita", categoria: "servico", data_transacao: new Date().toISOString().split('T')[0] });
  };

  const totalReceitas = transactions.filter(t => t.tipo === "receita").reduce((acc, cur) => acc + (cur.valor || 0), 0);
  const totalCustosInternos = transactions.filter(t => t.tipo === "receita").reduce((acc, cur) => acc + (cur.custo || 0), 0);
  const totalDespesasPuras = transactions.filter(t => t.tipo === "despesa").reduce((acc, cur) => acc + (cur.valor || 0), 0);
  const lucroLíquido = totalReceitas - totalCustosInternos - totalDespesasPuras;

  const statsMap = transactions
    .filter(t => t.tipo === "receita")
    .reduce((acc: any, cur: any) => {
      if (!acc[cur.descricao]) acc[cur.descricao] = { count: 0, total: 0 };
      acc[cur.descricao].count += 1;
      acc[cur.descricao].total += (cur.valor || 0);
      return acc;
    }, {});
  const rankingSorted = Object.entries(statsMap).sort(([, a]: any, [, b]: any) => b.count - a.count);

  return (
    <div className="w-full min-h-screen pt-20 md:pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white overflow-x-hidden">
      
      {/* HEADER PREMIUM */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-white/5 pb-8 mx-auto">
        <div className="text-center md:text-left group">
          <h1 className="text-4xl md:text-6xl font-cinzel tracking-[0.15em] text-white transition-all duration-700">
            Painel <span className="text-primary-light font-extralight italic">Financeiro</span>
          </h1>
          <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
            <div className="h-[1px] w-12 bg-primary-dark opacity-40"></div>
            <p className="text-[11px] text-primary-dark font-medium uppercase tracking-[0.5em] antialiased">
              Gestão & Resultados
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-6 justify-center md:justify-start bg-white/5 p-3 rounded-full border border-white/5 w-fit mx-auto md:mx-0">
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-white text-[10px] outline-none uppercase font-bold" />
            <span className="text-gray-700">|</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-white text-[10px] outline-none uppercase font-bold" />
          </div>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 hover:bg-primary-dark active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        
        {/* LISTAGEM DE TRANSAÇÕES */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-cinzel mb-8">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-3"><ArrowUpCircle className="text-green-500 w-4 h-4"/> Ganhos Brutos</p>
              <h2 className="text-2xl lg:text-3xl font-cinzel text-white">R$ {totalReceitas.toFixed(2)}</h2>
            </div>
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-3"><ArrowDownCircle className="text-red-500 w-4 h-4"/> Gastos Totais</p>
              <h2 className="text-2xl lg:text-3xl font-cinzel text-white">R$ {(totalDespesasPuras + totalCustosInternos).toFixed(2)}</h2>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-black/60 backdrop-blur-xl border border-primary/30 p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl">
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest flex items-center gap-2 mb-3"><Award className="w-4 h-4"/> Lucro Real</p>
              <h2 className="text-2xl lg:text-3xl font-cinzel text-white">R$ {lucroLíquido.toFixed(2)}</h2>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 bg-black/40 backdrop-blur-md rounded-[30px] border border-dashed border-white/10 text-gray-500 font-cinzel text-[10px] tracking-widest uppercase">
              Nenhum registro encontrado.
            </div>
          ) : transactions.map((t) => (
            <div key={t.id} className="bg-black/40 border border-white/5 p-5 md:p-6 rounded-[25px] md:rounded-[35px] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:bg-white/5 group">
              <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                <div className={`text-center min-w-[60px] p-4 rounded-2xl ${t.tipo === 'receita' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {t.categoria === 'produto' ? <ShoppingBag className="w-5 h-5 mx-auto"/> : <Scissors className="w-5 h-5 mx-auto"/>}
                </div>
                <div className="text-left">
                  <h4 className="text-md md:text-lg font-cinzel text-white uppercase tracking-wider truncate max-w-[200px] md:max-w-none">{t.descricao}</h4>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-1">
                    {t.tipo === 'receita' && (t.custo || 0) > 0 && <span className="text-primary mr-2">Custo: R$ {(t.custo || 0).toFixed(2)} |</span>} 
                    {new Date(t.data_transacao).toLocaleDateString('pt-BR')} • {t.clientes?.nome || 'Lançamento Avulso'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                <span className={`font-cinzel font-bold text-xl ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.tipo === 'receita' ? '+' : '-'} R$ {(t.valor || 0).toFixed(2)}
                </span>
                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setFormData({ id: t.id, descricao: t.descricao, valor: (t.valor || 0).toString(), custo: (t.custo || 0).toString(), tipo: t.tipo, categoria: t.categoria, data_transacao: new Date(t.data_transacao).toISOString().split('T')[0] }); setIsModalOpen(true); }} className="p-3 bg-white/5 text-gray-500 rounded-xl hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => handleDelete(t.id)} className="p-3 bg-white/5 text-gray-500 rounded-xl hover:text-red-500 transition-colors ml-1"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAINEL LATERAL (TOP PROCURA) */}
        <div className="lg:col-span-4 h-fit sticky top-24 lg:top-10 z-20">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl">
            <h3 className="font-cinzel text-white text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3"><Award className="text-primary"/> Top Procura</h3>
            <div className="space-y-6">
              {rankingSorted.map(([name, stats]: any, index) => (
                <div key={name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end text-[10px] font-bold">
                    <span className="text-gray-300 uppercase truncate max-w-[140px]">{index+1}. {name}</span>
                    <span className="text-primary">{stats.count}x</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full" style={{ width: `${(stats.count / (transactions.filter(t=>t.tipo==='receita').length || 1))*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL RESPONSIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-[#0f0f0f] border border-primary/40 rounded-[35px] w-full max-w-lg p-6 md:p-10 relative my-auto shadow-2xl">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-xl md:text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest">{formData.id ? 'Ajustar Registro' : 'Novo Lançamento'}</h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 p-1 bg-white/5 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, tipo: 'receita'})} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${formData.tipo === 'receita' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500'}`}>Receita</button>
                <button type="button" onClick={() => setFormData({...formData, tipo: 'despesa'})} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${formData.tipo === 'despesa' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500'}`}>Despesa</button>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Descrição</label>
                <input required type="text" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-primary/40 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Valor (R$)</label>
                  <input required type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none text-sm font-cinzel" />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-primary mb-2 block tracking-widest text-left">Data</label>
                  <input required type="date" value={formData.data_transacao} onChange={(e) => setFormData({...formData, data_transacao: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-primary/40 text-sm" />
                </div>
              </div>

              {formData.tipo === 'receita' && (
                <div className="pt-4 border-t border-white/10">
                  <label className="text-[9px] font-bold uppercase text-gray-500 mb-2 block tracking-widest text-left">Custo de Material (R$)</label>
                  <input type="number" step="0.01" value={formData.custo} onChange={(e) => setFormData({...formData, custo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none text-sm font-cinzel" />
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 mt-8 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mx-auto"/> : <><Save className="w-4 h-4"/> Salvar Lançamento</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}