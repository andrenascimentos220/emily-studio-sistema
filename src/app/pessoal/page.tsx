"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  PiggyBank, ShoppingCart, Plus, Edit, Trash2, X, Target, 
  Sparkles, Pencil, TrendingUp, Loader2, ArrowDownCircle, Banknote, User
} from "lucide-react";

export default function ControlePessoal() {
  const [loading, setLoading] = useState(true);
  const [proLabore, setProLabore] = useState(0); 
  const [caixinhas, setCaixinhas] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  
  const [isProLaboreModalOpen, setIsProLaboreModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isCaixinhaModalOpen, setIsCaixinhaModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roseGoldDark = "#C27B5D";
  const roseGoldLight = "#F2D2BD";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: caixas } = await supabase.from("caixinhas").select("*").order("created_at");
    const { data: gastos } = await supabase.from("despesas_pessoais").select("*").order("data", { ascending: false });
    
    const savedProLabore = localStorage.getItem("proLabore");
    if (savedProLabore) setProLabore(Number(savedProLabore));

    if (caixas) setCaixinhas(caixas);
    if (gastos) setDespesas(gastos);
    loadingDatabaseCheck();
  };

  const loadingDatabaseCheck = () => {
    setLoading(false);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  // Cálculos fundamentais do painel
  const totalGasto = despesas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const totalGuardado = caixinhas.reduce((acc, curr) => acc + (Number(curr.guardado) || 0), 0);
  
  // Função Adicionada: Cálculo fixo de 10% do Dízimo sobre o Pró-Labore
  const valorDizimo = proLabore * 0.10;
  
  // Saldo Livre atualizado para abater também o dízimo da Emily
  const saldoDisponivel = proLabore - totalGasto - valorDizimo;

  const saveProLabore = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("proLabore", proLabore.toString());
    setIsProLaboreModalOpen(false);
  };

  const handleSaveDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      descricao: editingData.descricao,
      valor: parseFloat(editingData.valor),
      categoria: editingData.categoria,
      data: editingData.data
    };

    if (editingData.id) {
      await supabase.from("despesas_pessoais").update(payload).eq("id", editingData.id);
    } else {
      await supabase.from("despesas_pessoais").insert([payload]);
    }
    await fetchData();
    setIsDespesaModalOpen(false);
    setIsSubmitting(false);
  };

  const handleSaveCaixinha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const valorParaGuardar = parseFloat(editingData.guardado) || 0;
      const payloadCaixinha = {
        nome: editingData.nome,
        objetivo: parseFloat(editingData.objetivo),
        guardado: valorParaGuardar,
        icone: editingData.icone || 'PiggyBank'
      };

      if (editingData.id) {
        await supabase.from("caixinhas").update(payloadCaixinha).eq("id", editingData.id);
      } else {
        await supabase.from("caixinhas").insert([payloadCaixinha]);
      }

      if (valorParaGuardar > 0) {
        await supabase.from("despesas_pessoais").insert([{
          descricao: `Depósito: ${editingData.nome}`,
          valor: valorParaGuardar,
          categoria: "Metas",
          data: new Date().toISOString().split('T')[0]
        }]);
      }

      await fetchData();
      setIsCaixinhaModalOpen(false);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="w-full h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#C27B5D] w-12 h-12" /></div>;

  return (
    <div className="w-full min-h-screen pt-20 md:pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white overflow-x-hidden">
      
      {/* CABEÇALHO IDÊNTICO */}
      <div className="w-full max-w-6xl flex justify-between items-start mb-10 border-b border-white/5 pb-8 mx-auto">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-cinzel text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, ${roseGoldLight})` }}>
            Capital Pessoal
          </h1>
          <p className="text-[10px] tracking-[0.3em] mt-2 text-gray-400">Pró-Labore & Metas Emily Matos</p>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 mx-auto">
        
        {/* COLUNA ESQUERDA: RESUMOS E DESPESAS */}
        <div className="lg:col-span-2 flex flex-col gap-8">
            {/* GRID DOS CARDS ATUALIZADO PARA 4 COLUNAS (INCLUINDO DÍZIMO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 border border-white/10 p-5 rounded-[32px] cursor-pointer hover:border-[#C27B5D]/50 transition-all" onClick={() => setIsProLaboreModalOpen(true)}>
                    <div className="flex justify-between items-center mb-3"><Banknote className="w-4 h-4 text-[#C27B5D]" /><Pencil className="w-3 h-3 text-gray-600" /></div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Meu Pró-Labore</p>
                    <h2 className="text-xl font-cinzel text-white mt-1">{formatCurrency(proLabore)}</h2>
                </div>

                <div className="bg-black/40 border border-white/10 p-5 rounded-[32px]">
                    <ArrowDownCircle className="w-4 h-4 text-red-500/50 mb-3" />
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Despesas Emily</p>
                    <h2 className="text-xl font-cinzel text-red-400 mt-1">-{formatCurrency(totalGasto)}</h2>
                </div>

                {/* VISUAL DA NOVA FUNÇÃO: CARD DO DÍZIMO AUTOMÁTICO 10% */}
                <div className="bg-black/40 border border-yellow-500/20 p-5 rounded-[32px]">
                    <Sparkles className="w-4 h-4 text-yellow-500/60 mb-3" />
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Dízimo (10%)</p>
                    <h2 className="text-xl font-cinzel text-yellow-400 mt-1">{formatCurrency(valorDizimo)}</h2>
                </div>

                <div className="bg-[#C27B5D]/10 border border-[#C27B5D]/20 p-5 rounded-[32px]">
                    <TrendingUp className="w-4 h-4 text-[#F2D2BD] mb-3" />
                    <p className="text-[9px] font-bold text-[#F2D2BD] uppercase tracking-widest">Saldo Livre</p>
                    <h2 className="text-xl font-cinzel text-white mt-1">{formatCurrency(saldoDisponivel)}</h2>
                </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-[40px] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-cinzel text-white flex items-center gap-3"><User className="w-5 h-5 text-[#C27B5D]" /> Meus Gastos Pessoais</h3>
                    <button onClick={() => { setEditingData({ categoria: "Pessoal Emily", descricao: "", valor: "", data: new Date().toISOString().split('T')[0] }); setIsDespesaModalOpen(true); }} className="bg-white/5 text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase border border-white/10 flex items-center gap-2 hover:bg-[#C27B5D] transition-all"><Plus className="w-4 h-4" /> Lançar Gasto</button>
                </div>
                <div className="space-y-4">
                    {despesas.map(despesa => (
                        <div key={despesa.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-[24px] p-5 group transition-all text-left">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/10">
                                  {despesa.categoria === 'Metas' ? <Target className="w-4 h-4 text-green-400"/> : <ShoppingCart className="w-4 h-4 text-[#C27B5D]"/>}
                                </div>
                                <div><h4 className="text-sm font-bold text-gray-200">{despesa.descricao}</h4><p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">{despesa.categoria} • {new Date(despesa.data).toLocaleDateString('pt-BR')}</p></div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="font-cinzel text-red-400">-{formatCurrency(despesa.valor)}</span>
                                <button onClick={async () => { if(confirm("Apagar despesa?")) { await supabase.from("despesas_pessoais").delete().eq("id", despesa.id); fetchData(); } }} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* COLUNA DIREITA: CAIXINHAS */}
        <div className="flex flex-col gap-6 text-left">
            <div className="bg-gradient-to-br from-[#C27B5D] to-[#8a533d] rounded-[40px] p-8 shadow-xl relative overflow-hidden">
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] mb-2">Total Guardado</h3>
                <p className="text-4xl font-cinzel text-white">{formatCurrency(totalGuardado)}</p>
                <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
            </div>
            <div className="flex justify-between items-center px-4 mt-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Meus Sonhos</h3>
                <button onClick={() => { setEditingData({ nome: "", objetivo: "", guardado: "", icone: "PiggyBank" }); setIsCaixinhaModalOpen(true); }} className="text-[#C27B5D] hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
                {caixinhas.map(caixa => {
                    const progresso = Math.min((caixa.guardado / caixa.objetivo) * 100, 100).toFixed(0);
                    return (
                        <div key={caixa.id} className="bg-black/40 border border-white/5 rounded-[32px] p-6 group hover:border-[#C27B5D]/30 transition-all text-left">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[#C27B5D]"><PiggyBank className="w-4 h-4"/></div>
                                    <h4 className="text-sm font-bold text-white uppercase">{caixa.nome}</h4>
                                </div>
                                <button onClick={() => { setEditingData(caixa); setIsCaixinhaModalOpen(true); }} className="text-gray-600 hover:text-white"><Edit className="w-3 h-3" /></button>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#C27B5D] to-[#F2D2BD] transition-all duration-1000" style={{ width: `${progresso}%` }} /></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-white">{formatCurrency(caixa.guardado)}</span><span className="text-[9px] font-bold text-[#F2D2BD] bg-[#C27B5D]/20 px-2 py-1 rounded-lg">{progresso}%</span></div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* MODAL 1: PRÓ-LABORE */}
      {isProLaboreModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <form onSubmit={saveProLabore} className="bg-[#0f0f0f] border border-[#C27B5D]/30 rounded-[40px] w-full max-w-sm p-10 relative shadow-2xl">
            <button type="button" onClick={() => setIsProLaboreModalOpen(false)} className="absolute top-8 right-8 text-gray-500"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">Meu Pró-Labore</h2>
            <input type="number" step="0.01" value={proLabore} onChange={(e) => setProLabore(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-4 text-center text-3xl text-white outline-none focus:border-[#C27B5D] font-cinzel" autoFocus />
            <button type="submit" className="w-full bg-[#C27B5D] text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest mt-6">Confirmar</button>
          </form>
        </div>
      )}

      {/* MODAL 2: GASTOS */}
      {isDespesaModalOpen && editingData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <form onSubmit={handleSaveDespesa} className="bg-[#0f0f0f] border border-[#C27B5D]/30 rounded-[40px] w-full max-w-md p-10 relative">
            <button type="button" onClick={() => setIsDespesaModalOpen(false)} className="absolute top-8 right-8 text-gray-500"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">Lançar Despesa</h2>
            <div className="space-y-6">
              <input required value={editingData.descricao} onChange={e => setEditingData({...editingData, descricao: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none" placeholder="O QUE COMPROU?" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.01" value={editingData.valor} onChange={e => setEditingData({...editingData, valor: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none font-cinzel" placeholder="VALOR" />
                <input required type="date" value={editingData.data} onChange={e => setEditingData({...editingData, data: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none text-xs" />
              </div>
              <select value={editingData.categoria} onChange={e => setEditingData({...editingData, categoria: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none text-xs uppercase font-bold tracking-widest">
                <option value="Pessoal Emily">Pessoal Emily</option>
                <option value="Saúde/Beleza">Saúde & Beleza</option>
                <option value="Lazer">Lazer / Viagens</option>
                <option value="Casa">Casa / Geral</option>
                <option value="Metas">Investimento Metas</option>
              </select>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#C27B5D] py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest">{isSubmitting ? "Gravando..." : "Salvar Despesa"}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: METAS */}
      {isCaixinhaModalOpen && editingData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <form onSubmit={handleSaveCaixinha} className="bg-[#0f0f0f] border border-[#C27B5D]/30 rounded-[40px] w-full max-w-md p-10 relative">
            <button type="button" onClick={() => setIsCaixinhaModalOpen(false)} className="absolute top-8 right-8 text-gray-500"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">Meu Sonho</h2>
            <div className="space-y-6">
              <input required value={editingData.nome} onChange={e => setEditingData({...editingData, nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none" placeholder="O QUE VAMOS REALIZAR?" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-2 mb-1 block">Alvo (€)</label>
                  <input required type="number" step="0.01" value={editingData.objetivo} onChange={e => setEditingData({...editingData, objetivo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#F2D2BD] uppercase ml-2 mb-1 block">Guardar Agora (€)</label>
                  <input required type="number" step="0.01" value={editingData.guardado} onChange={e => setEditingData({...editingData, guardado: e.target.value})} className="w-full bg-white/5 border border-[#C27B5D]/50 rounded-2xl py-4 px-5 text-[#F2D2BD] font-bold outline-none" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#C27B5D] py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest">{isSubmitting ? "Gravando..." : "Guardar & Abater Saldo"}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}