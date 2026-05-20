import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Helpers ────────────────────────────────────────────────────────────────
const pCol = (uid) => collection(db, 'users', uid, 'portfolios');
const posCol = (uid, pid) => collection(db, 'users', uid, 'portfolios', pid, 'positions');
const txCol = (uid, pid) => collection(db, 'users', uid, 'portfolios', pid, 'transactions');
const alCol = (uid) => collection(db, 'users', uid, 'alerts');

// ── Portefeuilles ──────────────────────────────────────────────────────────
export const addPortfolio = (uid, data) =>
  addDoc(pCol(uid), { ...data, createdAt: serverTimestamp() });

export const updatePortfolio = (uid, pid, data) =>
  updateDoc(doc(db, 'users', uid, 'portfolios', pid), data);

export const deletePortfolio = (uid, pid) =>
  deleteDoc(doc(db, 'users', uid, 'portfolios', pid));

export const listenPortfolios = (uid, cb) =>
  onSnapshot(query(pCol(uid), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

// ── Positions ──────────────────────────────────────────────────────────────
// position = { symbol, name, qty, avgPrice }
export const upsertPosition = (uid, pid, symbol, data) =>
  updateDoc(doc(posCol(uid, pid), symbol), data).catch(() =>
    addDoc(posCol(uid, pid), { symbol, ...data }));

export const deletePosition = (uid, pid, posId) =>
  deleteDoc(doc(posCol(uid, pid), posId));

export const listenPositions = (uid, pid, cb) =>
  onSnapshot(posCol(uid, pid), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

// ── Transactions ───────────────────────────────────────────────────────────
// type: 'buy' | 'sell'
export const addTransaction = (uid, pid, data) =>
  addDoc(txCol(uid, pid), { ...data, date: serverTimestamp() });

export const listenTransactions = (uid, pid, cb) =>
  onSnapshot(query(txCol(uid, pid), orderBy('date', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

// ── Alertes ────────────────────────────────────────────────────────────────
// condition: 'above' | 'below'
export const addAlert = (uid, data) =>
  addDoc(alCol(uid), { ...data, active: true, createdAt: serverTimestamp() });

export const updateAlert = (uid, aid, data) =>
  updateDoc(doc(alCol(uid), aid), data);

export const deleteAlert = (uid, aid) =>
  deleteDoc(doc(alCol(uid), aid));

export const listenAlerts = (uid, cb) =>
  onSnapshot(alCol(uid), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
