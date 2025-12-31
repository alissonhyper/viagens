import firebase from 'firebase/compat/app'; // Força o uso do módulo de compatibilidade
// E adicione estas para garantir o reconhecimento dos serviços:
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/storage'; 

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;

// Lógica robusta de inicialização para evitar o erro 'length'
if (!(firebase as any).apps || !(firebase as any).apps.length) { 
  app = firebase.initializeApp(firebaseConfig);
} else {
  // CORREÇÃO: Força o objeto 'firebase' a ser 'any' aqui para resolver o erro 'Property app does not exist'
  app = (firebase as any).app();  
}

// CORREÇÃO: Força a variável 'app' a ser 'any' para aceitar .firestore() e .auth()
app = app as any;

// Initialize Firestore (Banco de Dados)
export const db = firebase.firestore();

// Initialize Autenticação
export const auth = firebase.auth();

// Exportar o app para outros serviços
export default app;