'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { listenAlerts, addAlert, updateAlert, deleteAlert } from '@/lib/firestore';
import { getQuotes, searchSymbol, fmtEur, fmt } from '@/lib/stockApi';

const REFRESH_MS = 60000;

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', name: '', condition: 'above', targetPrice: '' });
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if (!user) return;
    return listenAlerts(user.uid, (data) => {
      setAlerts(data);
      const syms = [...new Set(data.map(a => a.symbol))];
      if (syms.length) getQuotes(syms).then(q => { setQuotes(q); checkAlerts(data, q); });
    });
  }, [user]);

  // Refresh + vérif toutes les 60s
  useEffect(() => {
    const t = setInterval(() => {
      const syms = [...new Set(alerts.map(a => a.symbol))];
      if (syms.length) getQuotes(syms).then(q => { setQuotes(q); checkAlerts(alerts, q); });
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [alerts]);

  const checkAlerts = (als, qs) => {
    als.filter(a => a.active).forEach(a => {
      const price = qs[a.symbol]?.c;
      if (price == null) return;
      const triggered = a.condition === 'above' ? price >= a.targetPrice : price <= a.targetPrice;
      if (triggered && !notifiedRef.current.has(a.id)) {
        notifiedRef.current.add(a.id);
        // Notification navigateur
        const msg = `${a.symbol} : ${fmtEur(price)} (cible ${a.condition === 'above' ? '>' : '<'} ${fmtEur(a.targetPrice)})`;
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🔔 Alerte ${a.symbol}`, { body: msg, icon: '/icons/icon-192.png' });
        } else {
          alert(`🔔 Alerte déclenchée !\n${msg}`);
        }
      }
    });
  };

  const requestNotifPermission = () => Notification.requestPermission();

  useEffect(() => { if ('Notification' in window && Notification.permission === 'default') requestNotifPermission(); }, []);

  // Recherche
  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => searchSymbol(searchQ).then(setSearchResults), 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.symbol || !form.targetPrice) return;
    setSaving(true);
    await addAlert(user.uid, { ...form, targetPrice: parseFloat(form.targetPrice) });
    setForm({ symbol: '', name: '', condition: 'above', targetPrice: '' });
    setSearchQ(''); setSearchResults([]); setShowForm(false);
    setSaving(false);
  };

  return (
    <div className="min-h-screen pb-24 pt-16">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Alertes de cours</h2>
            <p className="text-slate-400 text-sm">Vérification toutes les 60s</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            + Alerte
          </button>
        </div>

        {/* Notification banner */}
        {'Notification' in (typeof window !== 'undefined' ? window : {}) && typeof window !== 'undefined' && Notification.permission === 'default' && (
          <div className="bg-blue-950/50 border border-blue-800 rounded-xl p-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-blue-300">Activez les notifications pour les alertes</p>
            <button onClick={requestNotifPermission} className="text-xs bg-blue-600 px-3 py-1.5 rounded-lg font-medium">Activer</button>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4 space-y-3">
            <div>
              <input placeholder="Rechercher un symbole (ex: Total...)" value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setForm(f => ({ ...f, symbol: '', name: '' })); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              {searchResults.length > 0 && !form.symbol && (
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                  {searchResults.map(s => (
                    <button type="button" key={s.symbol} onClick={() => {
                      setForm(f => ({ ...f, symbol: s.symbol, name: s.description }));
                      setSearchQ(s.symbol); setSearchResults([]);
                      getQuotes([s.symbol]).then(q => setForm(f => ({ ...f, targetPrice: fmt(q[s.symbol]?.c || 0, 2) })));
                    }} className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                      <strong>{s.symbol}</strong> <span className="text-slate-400">{s.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {['above', 'below'].map(c => (
                <button type="button" key={c} onClick={() => setForm(f => ({ ...f, condition: c }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.condition === c ? c === 'above' ? 'bg-green-700 border-green-600 text-white' : 'bg-red-700 border-red-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {c === 'above' ? '↑ Au-dessus de' : '↓ En-dessous de'}
                </button>
              ))}
            </div>

            <input type="number" step="0.01" placeholder="Prix cible (€)" value={form.targetPrice} onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-sm text-slate-400">Annuler</button>
              <button type="submit" disabled={saving || !form.symbol}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold disabled:opacity-50">
                {saving ? '...' : 'Créer'}
              </button>
            </div>
          </form>
        )}

        {/* Liste alertes */}
        {alerts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-3">🔔</div>
            <p>Aucune alerte configurée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => {
              const price = quotes[a.symbol]?.c;
              const triggered = price != null && (a.condition === 'above' ? price >= a.targetPrice : price <= a.targetPrice);
              return (
                <div key={a.id} className={`bg-slate-900 border rounded-2xl p-4 transition-colors ${triggered ? 'border-yellow-600/60 bg-yellow-950/10' : 'border-slate-800'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{a.symbol}</p>
                        {triggered && <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">🔔 Déclenché</span>}
                      </div>
                      <p className="text-slate-400 text-xs">{a.name}</p>
                      <p className="text-sm mt-1">
                        {a.condition === 'above' ? <span className="text-green-400">↑ Au-dessus</span> : <span className="text-red-400">↓ En-dessous</span>}
                        <span className="text-white font-semibold ml-1">{fmtEur(a.targetPrice)}</span>
                      </p>
                      {price != null && <p className="text-xs text-slate-400 mt-0.5">Prix actuel : {fmtEur(price)}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Toggle */}
                      <button onClick={() => updateAlert(user.uid, a.id, { active: !a.active })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${a.active ? 'bg-blue-600' : 'bg-slate-700'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${a.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                      <button onClick={() => deleteAlert(user.uid, a.id)} className="text-red-500/60 hover:text-red-400 text-xs">Supprimer</button>
                    </div>
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
