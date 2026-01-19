import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage"; // ✅ use compat também

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ✅ Cache global para não recriar no HMR do Vite
const g = globalThis as any;

// App singleton
export const app =
  g.__fbApp ??
  (g.__fbApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig));

// Firestore singleton
export const db =
  g.__fbDb ?? (g.__fbDb = app.firestore());

// ✅ Aplica settings só 1 vez (evita warning por reexecução)
if (!g.__fbDbSettingsApplied) {
  db.settings({ ignoreUndefinedProperties: true });
  g.__fbDbSettingsApplied = true;
}

// Auth singleton
export const auth =
  g.__fbAuth ?? (g.__fbAuth = app.auth());

auth.languageCode = "pt-BR";

// Storage singleton
export const storage =
  g.__fbStorage ?? (g.__fbStorage = app.storage());

export default app;
