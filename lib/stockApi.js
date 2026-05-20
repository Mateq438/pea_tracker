const KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;
const BASE = 'https://finnhub.io/api/v1';

// Quote temps réel: { c: prix, d: variation, dp: variation%, h, l, o, pc }
export async function getQuote(symbol) {
  const r = await fetch(`${BASE}/quote?symbol=${symbol}&token=${KEY}`);
  return r.json();
}

// Récupère plusieurs quotes en parallèle → Map { symbol → quote }
export async function getQuotes(symbols) {
  const results = await Promise.all(symbols.map(s => getQuote(s).then(q => [s, q])));
  return Object.fromEntries(results);
}

// Recherche de symboles (actions françaises: ex "Total" → TTE.PA)
export async function searchSymbol(query) {
  const r = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&token=${KEY}`);
  const data = await r.json();
  // Filtre: actions simples uniquement
  return (data.result || []).filter(s => s.type === 'Common Stock').slice(0, 8);
}

// Données historiques (candles) pour les graphiques
// resolution: D=daily, W=weekly, M=monthly
export async function getCandles(symbol, resolution = 'D', days = 30) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86400;
  const r = await fetch(`${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${KEY}`);
  const data = await r.json();
  if (data.s !== 'ok') return [];
  return data.t.map((t, i) => ({
    date: new Date(t * 1000).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    close: data.c[i],
  }));
}

// Format helpers
export const fmt = (n, dec = 2) =>
  n != null ? n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—';

export const fmtEur = (n) =>
  n != null ? n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—';

export const pnlColor = (n) => (n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-slate-400');
export const pnlSign = (n) => (n > 0 ? '+' : '');
