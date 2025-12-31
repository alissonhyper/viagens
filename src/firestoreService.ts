// NOVO: Importa o tipo 'firestore' diretamente do módulo de compatibilidade
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore'; 

import { db, auth } from '../firebaseConfig'; 

// O tipo de dado que esperamos salvar (simplificado)
export interface Viagem {
  id?: string;
  destino: string;
  data_inicio: string;
  data_fim: string;
  orcamento: number;
  autor_uid: string;
  autor_email: string | null;
  
  // CORREÇÃO: Usamos 'firebase.firestore.FieldValue' que agora deve ser reconhecido
  data_criacao: firebase.firestore.FieldValue; 
}

export const firestoreService = {

  // 1. BUSCAR TODAS AS VIAGENS (COLABORATIVO)
  // Usa o 'onSnapshot' para atualizar em tempo real
  subscribeToViagens: (callback: (viagens: Viagem[]) => void) => {
    
    // Referência à coleção principal
    const viagensRef = db.collection('viagens');

    // Escuta em tempo real: todas as alterações nesta coleção serão enviadas para o callback
    return viagensRef.orderBy('data_criacao', 'desc').onSnapshot(snapshot => {
      const viagens: Viagem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Viagem[]; // Força a tipagem

      callback(viagens);
    }, (error) => {
      console.error("Erro ao buscar viagens:", error);
    });
    // O retorno desta função é o 'unsubscribe', que você usará no React para parar de ouvir.
  },

  // 2. ADICIONAR UMA NOVA VIAGEM
  addViagem: async (viagemData: Omit<Viagem, 'id' | 'autor_uid' | 'autor_email' | 'data_criacao'>) => {
    
    // Pega o UID do usuário logado e o e-mail para rastreamento
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Usuário não autenticado. Não é possível salvar a viagem.");
    }
    
    const novaViagem: Omit<Viagem, 'id'> = {
      ...viagemData,
      autor_uid: currentUser.uid,
      autor_email: currentUser.email,
      data_criacao: (firebase as any).firestore.FieldValue.serverTimestamp(), // Marca a hora no servidor
    };

    const viagensRef = db.collection('viagens');
    
    await viagensRef.add(novaViagem);
  }
  
  // Você pode adicionar funções para 'updateViagem' e 'deleteViagem' aqui.
};