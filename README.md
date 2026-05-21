# Trackfolio — Guide d'intégration

## Structure des fichiers à copier

```
app/
  dashboard/
    page.tsx          ← Page d'accueil / portefeuille
    layout.tsx        ← Layout avec BottomNav
  market/
    page.tsx          ← Écran marché avec indices + filtres
  search/
    page.tsx          ← Recherche avec suggestions
  stock/
    [ticker]/
      page.tsx        ← Détail action + graphique + Acheter/Vendre
  globals.css         ← CSS global (remplace le tien)

components/
  charts/
    PriceChart.tsx    ← Graphique Chart.js réutilisable
  modals/
    TradeModal.tsx    ← Modal Acheter / Vendre
  ui/
    BottomNav.tsx     ← Navigation bas d'écran
    StockRow.tsx      ← Ligne action réutilisable

hooks/
  useMarketData.ts    ← Prix temps réel (Finnhub WebSocket + CoinGecko)
  usePortfolio.ts     ← Gestion portefeuille (localStorage)

lib/
  constants.ts        ← Données statiques des actions

types/
  index.ts            ← Types TypeScript
```

---

## Installation

### 1. Copier les fichiers
Copie tous les fichiers ci-dessus dans ton projet Next.js existant, en respectant la structure.

### 2. Installer les dépendances
```bash
npm install chart.js
```

### 3. Clé API Finnhub (cours en temps réel)
```bash
# 1. Va sur https://finnhub.io → Sign up (gratuit)
# 2. Copie ta clé API
# 3. Crée .env.local à la racine :
echo "NEXT_PUBLIC_FINNHUB_KEY=ta_cle_ici" >> .env.local
```

> **Sans clé Finnhub** : l'app fonctionne en mode démo avec des prix simulés réalistes.

### 4. Vérifier Tailwind v4
Assure-toi que `globals.css` commence par `@import "tailwindcss"` (pas `@tailwind base` qui est v3).

---

## Fonctionnalités

| Feature | Status |
|---|---|
| Dashboard portefeuille | ✅ |
| Prix en temps réel (WebSocket) | ✅ Finnhub |
| Crypto temps réel | ✅ CoinGecko 30s |
| Page détail + graphique | ✅ |
| Acheter / Vendre | ✅ Fonctionnel |
| Portefeuille persistant | ✅ localStorage |
| Recherche | ✅ |
| Page marché + filtres | ✅ |
| Mode démo sans clé API | ✅ |
| Thème dark | ✅ |

---

## Ajouter de nouvelles actions

Dans `lib/constants.ts`, ajouter une entrée dans `STOCK_UNIVERSE` :

```ts
{
  ticker: 'GOOG',
  name: 'Alphabet Inc.',
  marketCap: '$2,17T',
  pe: '24,8',
  high52: 193.31,
  low52: 130.67,
  category: 'actions',
  color: '#4285f4',
  about: 'Description...',
}
```

Pour les cryptos, ajouter dans `CRYPTO_IDS` et `CRYPTO_META` :
```ts
// CRYPTO_IDS
SOL: 'solana',

// CRYPTO_META
{ ticker: 'SOL', name: 'Solana', color: '#9945ff', category: 'crypto', about: '...' }
```

---

## Synchroniser le portefeuille avec Firebase

Remplace dans `hooks/usePortfolio.ts` les fonctions `loadPortfolio` / `savePortfolio` :

```ts
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { auth } from '@/lib/firebase'

async function loadPortfolio() {
  const uid = auth.currentUser?.uid
  if (!uid) return DEFAULT_PORTFOLIO
  const snap = await getDoc(doc(db, 'portfolios', uid))
  return snap.exists() ? snap.data() as Portfolio : DEFAULT_PORTFOLIO
}

async function savePortfolio(p: Portfolio) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  await setDoc(doc(db, 'portfolios', uid), p)
}
```
