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

    // --- CHECKOUT (CHEGADA) ---
  arrivalTime?: string | null; // "HH:mm" (ex.: "18:10")
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

        // --- CHECKOUT (CHEGADA) ---
    arrivalTime?: string | null; // "HH:mm"

    // Adicione aqui qualquer outra propriedade que você possa atualizar
}

function findUndefinedPaths(obj: any, path = 'root'): string[] {
  const out: string[] = [];

  if (obj === undefined) return [path];
  if (obj === null) return out;

  if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...findUndefinedPaths(v, `${path}[${i}]`)));
    return out;
  }

  if (typeof obj === 'object') {
    // só entra em objetos puros
    const proto = Object.getPrototypeOf(obj);
    const isPlain = proto === Object.prototype || proto === null;
    if (!isPlain) return out;

    Object.keys(obj).forEach((k) => {
      out.push(...findUndefinedPaths(obj[k], `${path}.${k}`));
    });
  }

  return out;
}

const isPlainObject = (v: any) => {
  if (!v || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

const removeUndefinedDeep = (value: any): any => {
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value.map(removeUndefinedDeep).filter((v) => v !== undefined);
  }

  // Só limpa objetos "puros"
  if (isPlainObject(value)) {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      const cleaned = removeUndefinedDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }

  // Mantém FieldValue/Timestamp/Date/DocumentReference etc.
  return value;
};



export const firestoreService = { 

// 1. BUSCAR TODAS AS VIAGENS (COLABORATIVO)
// Usa o 'onSnapshot' para atualizar em tempo real
subscribeToViagens: (
  callback: (viagens: Viagem[]) => void,
  errorCallback: (error: firebase.firestore.FirestoreError) => void,
  opts?: { days?: number } // ✅ NOVO: opções (período)
) => {
  const viagensRef = db.collection('viagens');

  // helper: Date -> "yyyy-mm-dd" (mesmo formato do state.date)
  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  let query: firebase.firestore.Query = viagensRef;

  // ✅ Se veio days e não é "Tudo", aplica filtro por período no Firestore
  if (opts?.days && opts.days > 0 && opts.days !== 9999) {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - opts.days);

    const cutoffStr = toYmd(cutoff);

    // Range query (>=) exige orderBy no mesmo campo do filtro
    query = query.where("state.date", ">=", cutoffStr).orderBy("state.date", "desc");
  } else {
    // "Tudo" (ou sem opts): mantém ordenação por data
    query = query.orderBy("state.date", "desc");
  }

  return query.onSnapshot(snapshot => {
    const viagens: Viagem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Viagem[];

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

    // (A) Detecta e mostra onde está vindo undefined
const novaViagemClean = removeUndefinedDeep(novaViagem);

const undef = findUndefinedPaths(novaViagemClean);
if (undef.length) console.warn('addViagem: ainda tem undefined depois da limpeza:', undef);

const docRef = await viagensRef.add(novaViagemClean);
return docRef;
},
  
    // 3. ATUALIZAR UMA VIAGEM EXISTENTE
    // Usamos o novo tipo 'ViagemUpdatePayload' para resolver o erro.
updateViagem: async (id: string, updates: ViagemUpdatePayload) => {
  const viagensRef = db.collection('viagens').doc(id);

  const updatesClean = removeUndefinedDeep(updates);

  const undef = findUndefinedPaths(updatesClean);
  if (undef.length) console.warn('updateViagem: ainda tem undefined:', undef);

  await viagensRef.update(updatesClean);
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