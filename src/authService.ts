import { auth } from '../firebaseConfig';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  },

  // NOVO: RESET DE SENHA (Esqueci minha senha)
  resetPassword: async (email: string) => {
  try {
    const cleanEmail = String(email).replace(/\s+/g, '').trim();
    await auth.sendPasswordResetEmail(cleanEmail);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error);
    throw error;
  }
},


  // (Opcional) Você pode manter ou remover.
  // Como você escolheu a Opção 1 (sem cadastro na tela), essa função não será usada no UI.
  signup: async (email: string, password: string) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  },
};
