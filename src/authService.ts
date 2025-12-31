import * as firebase from 'firebase/app';
import { auth } from '../firebaseConfig';

export const authService = {
  // FUNÇÃO JÁ EXISTENTE
  login: async (email: string, password: string) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  },

  // 🚨 FUNÇÃO NOVA: CADASTRO (SIGN UP)
  signup: async (email: string, password: string) => {
    try {
      // Usa a função correta do Firebase para criar um novo usuário
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Erro ao fazer cadastro:", error);
      throw error;
    }
  },

  // FUNÇÃO JÁ EXISTENTE
  logout: async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  }
};