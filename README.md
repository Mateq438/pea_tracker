# 📈 PEA Tracker — Guide de démarrage

## Stack
- **Frontend** : Next.js 14 (App Router) + Tailwind CSS
- **Auth + BDD** : Firebase (Firestore + Authentication)
- **Cours boursiers** : Finnhub API (gratuit)
- **Hosting** : Vercel (gratuit)
- **Android** : PWA installable (Add to Home Screen)

---

## 1. Prérequis

- Node.js ≥ 18
- Compte Firebase (gratuit) → https://console.firebase.google.com
- Compte Finnhub (gratuit) → https://finnhub.io
- Compte Vercel (gratuit) → https://vercel.com

---

## 2. Firebase — Configuration

### 2a. Créer le projet
1. https://console.firebase.google.com → Nouveau projet
2. Désactiver Google Analytics (optionnel)

### 2b. Activer Authentication
- Build → Authentication → Get started
- Sign-in method → **Email/Password** → Activer

### 2c. Activer Firestore
- Build → Firestore Database → Create database
- **Production mode** (les rules dans ce projet sécurisent l'accès)
- Région : `eur3` (Europe)

### 2d. Appliquer les règles de sécurité
- Firestore → Rules → Copier le contenu de `firestore.rules` → Publish

### 2e. Récupérer les clés Firebase
- Paramètres du projet (⚙️) → General → Your apps → Add app → Web
- Copier les valeurs dans `.env.local`

---

## 3. Finnhub — Clé API

1. https://finnhub.io → Register (gratuit)
2. Dashboard → API Keys → copier la clé
3. Coller dans `.env.local` : `NEXT_PUBLIC_FINNHUB_KEY=...`

**Limite gratuite** : 60 appels/min (largement suffisant)

**Symboles français (PEA)** :
| Action | Symbole Finnhub |
|--------|----------------|
| TotalEnergies | TTE.PA |
| LVMH | MC.PA |
| Airbus | AIR.PA |
| BNP Paribas | BNP.PA |
| Sanofi | SAN.PA |
| Stellantis | STLAM.MI |

---

## 4. Installation locale

```bash
# Copier les variables d'environnement
cp .env.local.example .env.local
# Remplir les valeurs dans .env.local

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
# → http://localhost:3000
```

---

## 5. Icônes PWA (obligatoire pour Android)

Créez deux icônes :
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)

Outil gratuit : https://realfavicongenerator.net

---

## 6. Déploiement Vercel

```bash
# Option A : via CLI
npm i -g vercel
vercel --prod

# Option B : via GitHub
# 1. Push le projet sur GitHub
# 2. vercel.com → Import → sélectionner le repo
# 3. Ajouter les variables d'env dans Vercel Dashboard → Settings → Environment Variables
```

**Variables à ajouter dans Vercel** :
- `NEXT_PUBLIC_FB_API_KEY`
- `NEXT_PUBLIC_FB_AUTH_DOMAIN`
- `NEXT_PUBLIC_FB_PROJECT_ID`
- `NEXT_PUBLIC_FB_STORAGE_BUCKET`
- `NEXT_PUBLIC_FB_SENDER_ID`
- `NEXT_PUBLIC_FB_APP_ID`
- `NEXT_PUBLIC_FINNHUB_KEY`

---

## 7. Installation Android (PWA)

1. Ouvrir l'URL Vercel dans **Chrome Android**
2. Menu ⋮ → **Ajouter à l'écran d'accueil**
3. L'app s'installe comme une vraie appli native

---

## 8. Structure du projet

```
pea-tracker/
├── app/
│   ├── page.js              # Login / Inscription
│   ├── dashboard/page.js    # Accueil — liste des portefeuilles
│   ├── portfolio/[id]/page.js  # Positions + transactions + graphique
│   └── alerts/page.js       # Alertes de cours
├── components/
│   └── Navbar.js            # Navigation haut + bas
├── lib/
│   ├── firebase.js          # Init Firebase
│   ├── AuthContext.js       # Hook useAuth()
│   ├── firestore.js         # CRUD Firestore
│   └── stockApi.js          # Finnhub API + formatters
└── public/
    ├── manifest.json        # Config PWA
    └── sw.js                # Service Worker offline
```

---

## 9. Fonctionnalités incluses

- ✅ Inscription / Connexion email + mot de passe
- ✅ Plusieurs portefeuilles (PEA, CTO, PEA-PME...)
- ✅ Recherche d'actions (françaises + internationales)
- ✅ Achat / Vente avec calcul prix moyen
- ✅ Prix en temps réel (refresh 30s)
- ✅ P&L par position et global
- ✅ Historique des transactions
- ✅ Graphique 30 jours par action
- ✅ Alertes de cours (avec notification navigateur)
- ✅ PWA installable Android
- ✅ Mode offline (cache service worker)
- ✅ Données 100% séparées par compte

---

## 10. Prochaines améliorations

- [ ] Notifications push FCM (alertes même app fermée)
- [ ] Dividendes
- [ ] Import CSV courtier (Fortuneo, Boursorama...)
- [ ] Widget home screen Android
- [ ] Multi-devise (USD/GBP)
