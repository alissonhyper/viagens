// NOVO: Importa o tipo 'firestore' diretamente do módulo de compatibilidade

import firebase from 'firebase/compat/app';
import 'firebase/firestore'; 
import { db, auth } from '../firebaseConfig'; 
import { AppState } from '../types'; // <-- Importe sua AppState aqui!


type FieldValueType = any; // Usamos 'any' se o tipo complexo não for acessível
type TimestampType = any; // Usamos 'any' se o tipo complexo não for acessível

// Define a interface Viagem completa, incluindo o ID
export interface Viagem { 
  id?: string;

  // --- DADOS PRINCIPAIS ---
  destino: string;
  data_inicio: string;
  data_fim: string;
  orcamento: number;

  autor_uid: string;
  autor_email: string | null;
  data_criacao: any;

  state: AppState;
  feedbacks?: any[];

  // --- BANDEJA / PROGRAMAÇÃO ---
  regiao: string;            // ex: "MATA VERDE"
  cidade: string;            // ex: "MATA VERDE", "SAPATA"
  status: 'PENDENTE' | 'REALIZADA' | string;

  trayOrder?: number;        // ORDEM MANUAL DA BANDEJA
}

// Define o payload para atualização (sem metadados)
export interface ViagemUpdatePayload { 
    destino?: string;
    data_inicio?: string;
    data_fim?: string;
    orcamento?: number;
    state?: any; 
    feedbacks?: any[];
    // --- BANDEJA / PROGRAMAÇÃO ---
    regiao?: string;
    cidade?: string;
    status?: string;       // ou 'PENDENTE' | 'REALIZADA' | string
    trayOrder?: number;
    // Adicione aqui qualquer outra propriedade que você possa atualizar
}

export const firestoreService = { 

  // 1. BUSCAR TODAS AS VIAGENS (COLABORATIVO)
  // Usa o 'onSnapshot' para atualizar em tempo real
  subscribeToViagens: 
    (callback: (viagens: Viagem[]) => void, 
    errorCallback: (error: firebase.firestore.FirestoreError) => void // <-- NOVO ARGUMENTO TIPADO
  ) => {
    
    // Referência à coleção principal
    const viagensRef = db.collection('viagens');

    // Escuta em tempo real: todas as alterações nesta coleção serão enviadas para o callback
    return viagensRef.orderBy('data_criacao', 'desc').onSnapshot(snapshot => {
      const viagens: Viagem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Viagem[]; // Força a tipagem

      callback(viagens);
    }, errorCallback);
    },

// 2. ADICIONAR UMA NOVA VIAGEM
// Usa ViagemUpdatePayload, que é a Viagem completa menos os metadados
addViagem: async (viagemData: ViagemUpdatePayload) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("Usuário não autenticado. Não é possível salvar a viagem.");
    }

    // 1. ✅ CORREÇÃO CRÍTICA: Desestrutura 'viagemData' para remover 'id' e 'id_viagem'
    // O TypeScript reclama porque 'id' não deveria estar em ViagemUpdatePayload, 
    // mas forçamos a remoção usando 'as any'.
    const { id, id_viagem, ...dataToSave } = viagemData as any;
    
    // 2. Monta o objeto final para o Firestore APENAS com os dados limpos
    const novaViagem = {
        // ...dataToSave é o payload de entrada sem 'id' e 'id_viagem'
        ...dataToSave,
        autor_uid: currentUser.uid,
        autor_email: currentUser.email,
        // Usamos (firebase as any) apenas para fins de compilação/ambiente
        data_criacao: (firebase as any).firestore.FieldValue.serverTimestamp(),
    };
    
    const viagensRef = db.collection('viagens');
    
    // 3. Adiciona e retorna a referência
    const docRef = await viagensRef.add(novaViagem);
    return docRef;
},
  
    // 3. ATUALIZAR UMA VIAGEM EXISTENTE
    // Usamos o novo tipo 'ViagemUpdatePayload' para resolver o erro.
updateViagem: async (id: string, updates: ViagemUpdatePayload) => {
        const viagensRef = db.collection('viagens').doc(id);
        await viagensRef.update(updates);
    },

    // 4. DELETAR UMA VIAGEM (Para o botão da lixeira)
deleteViagem: async (id: string) => {
    const viagensRef = db.collection('viagens').doc(id);
    await viagensRef.delete();
},

// 5. ATUALIZAR ORDEM DA BANDEJA (DRAG & DROP)
atualizarOrdemViagensCompat: async (viagens: { id: string }[]) => {
  const batch = db.batch();

  viagens.forEach((viagem, index) => {
    const ref = db.collection('viagens').doc(viagem.id);
    batch.update(ref, { trayOrder: index });
  });

  await batch.commit();
}}

