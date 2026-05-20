'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { listenPortfolios, addPortfolio, deletePortfolio } from '@/lib/firestore';
import { getQuotes, fmtEur, pnlColor, pnlSign } from '@/lib/stockApi';

const TYPES = ['PEA', 'CTO', 'PEA-PME', 'Assurance-vie', 'Crypto', 'Autre'];
const TYPE_COLOR = { PEA: 'bg-blue-900/40 text-blue-300 border-blue-800', CTO: 'bg-purple-900/40 text-purple-300 border-purple-800', 'PEA-PME': 'bg-teal-900/40 text-teal-300 border-teal-800', default: 'bg-slate-800 text-slate-300 border-slate-700' };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'PEA' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    return listenPortfolios(user.uid, (data) => {
      setPortfolios(data);
      // Récupère les prix pour toutes les positions
      const symbols = [...new Set(data.flatMap(p => (p.symbols || [])))];
      if (symbols.length) getQuotes(symbols).then(setQuotes);
    });
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await addPortfolio(user.uid, { name: form.name, type: form.type, symbols: [] });
    setForm({ name: '', type: 'PEA' });
    setShowForm(false);
    setSaving(false);
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pb-24 pt-16">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Mes portefeuilles</h2>
            <p className="text-slate-400 text-sm">{portfolios.length} portefeuille{portfolios.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
            <span className="text-base">+</span> Nouveau
          </button>
        </div>

        {/* Formulaire ajout */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4 space-y-3">
            <input autoFocus placeholder="Nom du portefeuille" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${form.type === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{t}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-sm text-slate-400">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-600 text-sm font-semibold disabled:opacity-50">
                {saving ? '...' : 'Créer'}
              </button>
            </div>
          </form>
        )}

        {/* Liste portefeuilles */}
        {portfolios.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-3">📊</div>
            <p className="font-medium">Aucun portefeuille</p>
            <p className="text-sm mt-1">Créez votre premier PEA !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolios.map(p => {
              const tc = TYPE_COLOR[p.type] || TYPE_COLOR.default;
              return (
                <div key={p.id} onClick={() => router.push(`/portfolio/${p.id}`)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-600 active:scale-[.99] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{p.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${tc}`}>{p.type}</span>
                      </div>
                      <p className="text-slate-400 text-sm">{(p.symbols || []).length} ligne{(p.symbols || []).length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{fmtEur(p.totalValue || 0)}</p>
                      {p.totalPnl != null && (
                        <p className={`text-sm font-medium ${pnlColor(p.totalPnl)}`}>
                          {pnlSign(p.totalPnl)}{fmtEur(p.totalPnl)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                    <span className="text-slate-500 text-xs">Voir les positions →</span>
                    <button onClick={e => { e.stopPropagation(); if (confirm(`Supprimer "${p.name}" ?`)) deletePortfolio(user.uid, p.id); }}
                      className="text-red-500/60 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950/30 transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
