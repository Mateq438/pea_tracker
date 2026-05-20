'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { listenPositions, listenTransactions, addTransaction, deletePosition, updatePortfolio } from '@/lib/firestore';
import { getQuotes, searchSymbol, getCandles, fmtEur, fmt, pnlColor, pnlSign } from '@/lib/stockApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const REFRESH_MS = 30000;

export default function PortfolioPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [candles, setCandles] = useState([]);
  const [tab, setTab] = useState('positions');
  const [modal, setModal] = useState(null); // null | 'buy' | 'sell'
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [txForm, setTxForm] = useState({ qty: '', price: '', symbol: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [chartSymbol, setChartSymbol] = useState(null);

  // Refresh prix toutes les 30s
  const refreshQuotes = useCallback((pos) => {
    const syms = pos.map(p => p.symbol);
    if (syms.length) getQuotes(syms).then(setQuotes);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubPos = listenPositions(user.uid, id, (data) => {
      setPositions(data);
      refreshQuotes(data);
    });
    const unsubTx = listenTransactions(user.uid, id, setTransactions);
    const timer = setInterval(() => refreshQuotes(positions), REFRESH_MS);
    return () => { unsubPos(); unsubTx(); clearInterval(timer); };
  }, [user, id, refreshQuotes]);

  // Calculs P&L
  const enriched = positions.map(p => {
    const q = quotes[p.symbol];
    const current = q?.c ?? 0;
    const value = current * p.qty;
    const cost = p.avgPrice * p.qty;
    const pnl = value - cost;
    const pnlPct = cost ? (pnl / cost) * 100 : 0;
    return { ...p, current, value, cost, pnl, pnlPct };
  });
  const totalValue = enriched.reduce((s, p) => s + p.value, 0);
  const totalCost = enriched.reduce((s, p) => s + p.cost, 0);
  const totalPnl = totalValue - totalCost;

  // Sync total dans Firestore
  useEffect(() => {
    if (!user || !enriched.length) return;
    updatePortfolio(user.uid, id, {
      totalValue,
      totalPnl,
      symbols: enriched.map(p => p.symbol),
    });
  }, [totalValue, totalPnl]);

  // Recherche symbole
  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => searchSymbol(searchQ).then(setSearchResults), 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  // Graphique
  const showChart = async (symbol) => {
    setChartSymbol(symbol);
    const data = await getCandles(symbol);
    setCandles(data);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setSaving(true);
    const qty = parseFloat(txForm.qty);
    const price = parseFloat(txForm.price);
    // Calcul nouveau prix moyen
    const existing = positions.find(p => p.symbol === txForm.symbol);
    const oldQty = existing?.qty || 0;
    const oldAvg = existing?.avgPrice || 0;
    const newQty = oldQty + qty;
    const newAvg = (oldQty * oldAvg + qty * price) / newQty;

    await addTransaction(user.uid, id, { type: 'buy', symbol: txForm.symbol, name: txForm.name, qty, price });

    // Upsert position
    const { doc, setDoc, db } = await import('firebase/firestore');
    const { db: database } = await import('@/lib/firebase');
    const posRef = doc(database, 'users', user.uid, 'portfolios', id, 'positions', txForm.symbol);
    await setDoc(posRef, { symbol: txForm.symbol, name: txForm.name, qty: newQty, avgPrice: newAvg }, { merge: true });

    setModal(null); setSearchQ(''); setSelectedStock(null); setTxForm({ qty: '', price: '', symbol: '', name: '' });
    setSaving(false);
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setSaving(true);
    const qty = parseFloat(txForm.qty);
    const price = parseFloat(txForm.price);
    const existing = positions.find(p => p.symbol === txForm.symbol);
    if (!existing) return;
    const newQty = existing.qty - qty;

    await addTransaction(user.uid, id, { type: 'sell', symbol: txForm.symbol, name: txForm.name || existing.name, qty, price });

    const { doc, setDoc, deleteDoc, db } = await import('firebase/firestore');
    const { db: database } = await import('@/lib/firebase');
    const posRef = doc(database, 'users', user.uid, 'portfolios', id, 'positions', txForm.symbol);
    if (newQty <= 0) await deleteDoc(posRef);
    else await setDoc(posRef, { qty: newQty }, { merge: true });

    setModal(null); setTxForm({ qty: '', price: '', symbol: '', name: '' });
    setSaving(false);
  };

  return (
    <div className="min-h-screen pb-24 pt-16">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Header résumé */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Retour</button>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-slate-400 text-xs">Valeur totale</p>
              <p className="text-2xl font-bold">{fmtEur(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">P&L total</p>
              <p className={`text-lg font-bold ${pnlColor(totalPnl)}`}>{pnlSign(totalPnl)}{fmtEur(totalPnl)}</p>
              <p className={`text-sm ${pnlColor(totalPnl)}`}>
                {pnlSign(totalPnl)}{fmt(totalCost ? (totalPnl / totalCost) * 100 : 0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-xl p-1 mb-4 gap-1">
          {[['positions', '📊 Positions'], ['transactions', '📋 Historique'], ['chart', '📈 Graphique']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`flex-1 py-2 text-xs rounded-lg font-medium transition-all ${tab === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>

        {/* ── Positions ─────────────────────────────────── */}
        {tab === 'positions' && (
          <>
            <button onClick={() => setModal('buy')} className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-semibold mb-4 transition-colors">
              + Ajouter une position / Acheter
            </button>

            {enriched.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-2">📉</div>
                <p>Aucune position</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enriched.map(p => (
                  <div key={p.id || p.symbol} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{p.symbol}</p>
                        <p className="text-slate-400 text-xs">{p.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{p.qty} × {fmtEur(p.avgPrice)} moy.</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{fmtEur(p.current)}</p>
                        <p className="text-sm font-medium text-slate-300">{fmtEur(p.value)}</p>
                        <p className={`text-xs font-medium ${pnlColor(p.pnl)}`}>
                          {pnlSign(p.pnl)}{fmtEur(p.pnl)} ({pnlSign(p.pnlPct)}{fmt(p.pnlPct)}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => showChart(p.symbol)} className="flex-1 py-1.5 text-xs bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">📈 Graphique</button>
                      <button onClick={() => { setTxForm({ symbol: p.symbol, name: p.name, qty: '', price: fmt(p.current, 2) }); setModal('sell'); }}
                        className="flex-1 py-1.5 text-xs bg-red-950/50 text-red-400 rounded-lg hover:bg-red-950 transition-colors">Vendre</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Historique ────────────────────────────────── */}
        {tab === 'transactions' && (
          <div className="space-y-2">
            {transactions.length === 0 ? <p className="text-center text-slate-500 py-12">Aucune transaction</p> : transactions.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {t.type === 'buy' ? 'ACHAT' : 'VENTE'}
                    </span>
                    <span className="text-sm font-semibold">{t.symbol}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t.qty} × {fmtEur(t.price)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{fmtEur(t.qty * t.price)}</p>
                  <p className="text-xs text-slate-500">{t.date?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Graphique ─────────────────────────────────── */}
        {tab === 'chart' && (
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {enriched.map(p => (
                <button key={p.symbol} onClick={() => showChart(p.symbol)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${chartSymbol === p.symbol ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {p.symbol}
                </button>
              ))}
            </div>
            {chartSymbol && candles.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
                <p className="text-sm font-semibold mb-3">{chartSymbol} — 30 jours</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={candles}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-slate-500 py-8 text-sm">Sélectionnez une action</p>}
          </div>
        )}
      </div>

      {/* ── Modal Achat ─────────────────────────────────── */}
      {modal === 'buy' && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-slate-900 rounded-t-3xl w-full max-w-lg mx-auto p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Acheter une action</h3>
              <button onClick={() => { setModal(null); setSearchQ(''); setSelectedStock(null); }} className="text-slate-400 text-xl">✕</button>
            </div>

            {!selectedStock ? (
              <div>
                <input autoFocus placeholder="Rechercher (ex: Total, BNP, LVMH...)" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 mb-3" />
                <p className="text-xs text-slate-500 mb-2">Pour actions françaises (PEA): "Total" → TTE.PA</p>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {searchResults.map(s => (
                    <button key={s.symbol} onClick={() => {
                      setSelectedStock(s);
                      setTxForm(f => ({ ...f, symbol: s.symbol, name: s.description }));
                      getQuotes([s.symbol]).then(q => setTxForm(f => ({ ...f, price: fmt(q[s.symbol]?.c || 0, 2) })));
                    }} className="w-full text-left px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                      <span className="font-semibold text-sm">{s.symbol}</span>
                      <span className="text-slate-400 text-xs ml-2">{s.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBuy} className="space-y-3">
                <div className="bg-slate-800 rounded-xl px-4 py-3">
                  <p className="font-semibold">{selectedStock.symbol}</p>
                  <p className="text-slate-400 text-sm">{selectedStock.description}</p>
                </div>
                <input type="number" step="0.001" min="0.001" placeholder="Quantité" value={txForm.qty} onChange={e => setTxForm(f => ({ ...f, qty: e.target.value }))} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
                <input type="number" step="0.01" min="0.01" placeholder="Prix d'achat (€)" value={txForm.price} onChange={e => setTxForm(f => ({ ...f, price: e.target.value }))} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
                {txForm.qty && txForm.price && (
                  <p className="text-center text-sm text-slate-300">Total : <strong>{fmtEur(parseFloat(txForm.qty) * parseFloat(txForm.price))}</strong></p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedStock(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-sm">← Retour</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-green-700 font-semibold text-sm disabled:opacity-50">
                    {saving ? '...' : 'Confirmer l\'achat'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Vente ─────────────────────────────────── */}
      {modal === 'sell' && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-slate-900 rounded-t-3xl w-full max-w-lg mx-auto p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Vendre — {txForm.symbol}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleSell} className="space-y-3">
              <input type="number" step="0.001" min="0.001" placeholder="Quantité à vendre" value={txForm.qty} onChange={e => setTxForm(f => ({ ...f, qty: e.target.value }))} required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              <input type="number" step="0.01" min="0.01" placeholder="Prix de vente (€)" value={txForm.price} onChange={e => setTxForm(f => ({ ...f, price: e.target.value }))} required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              {txForm.qty && txForm.price && (
                <p className="text-center text-sm text-slate-300">Total : <strong>{fmtEur(parseFloat(txForm.qty) * parseFloat(txForm.price))}</strong></p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-sm">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-red-700 font-semibold text-sm disabled:opacity-50">
                  {saving ? '...' : 'Confirmer la vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
