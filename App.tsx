import React, { useState, useEffect, useContext } from 'react';
import { 
  TECHNICIANS, 
  ASSISTANTS, 
  SERVICES_OPTIONS, 
  ONU_MODELS, 
  ONT_MODELS, 
  ROUTER_MODELS, 
  LUNCH_OPTIONS,
  INITIAL_STATE,
  REGIONS,
  TRAY_STATUS_OPTIONS,
  TRAY_EQUIPMENT_OPTIONS
} from './constants';
import { AppState, EncerramentoFeedback, FeedbackStatus, TrayItem } from './types';
import { useAuth } from "./src/AuthContext";
import LoginScreen from "./src/LoginScreen";
import { authService } from "./src/authService";
import { formatarData, getDiaSemana, listaComE, pad } from "./utils"; // Ajuste para todas as importações que buscam arquivos dentro de 'src'

// import DashboardScreen from './src/screens/DashboardScreen'; //

// IMPORTAR O SERVIÇO DE DADOS COLABORATIVO
import { firestoreService, ViagemUpdatePayload, Viagem } from './src/firestoreService';
import { trayService } from './src/trayService';
import { auth } from './firebaseConfig';
import { AdminUsersScreen } from './src/screens/AdminUsersScreen';




// Lista de atendentes autorizados para o fechamento
const ATTENDANTS = ['', 'Alisson', 'Welvister', 'Uriel', 'Pedro', 'João', 'Willians', 'Keven', 'Amile', 'Rayssa'];

const ITEMS_PER_PAGE = 10;

const TRAY_COLS = [
  { key: 'DATA', className: 'w-[150px]' },
  { key: 'NOME / RAZÃO SOCIAL', className: 'w-[360px]' },
  { key: 'STATUS', className: 'w-[190px]' },
  { key: 'EQUIPAMENTO', className: 'w-[200px]' },
  { key: 'OBSERVAÇÃO', className: 'w-[240px]' },
  { key: 'ATENDENTE', className: 'w-[170px]' },
  { key: 'AÇÕES', className: 'w-[96px]' },
] as const;

// --- COMPONENTE MODAL DE RELATÓRIO ---
const gerarTextoRelatorio = (viagem: Viagem): string => {
  const { state, feedbacks } = viagem;
  const fbList = feedbacks || [];

  const diaSemana = getDiaSemana(state.date);
  const dataFormatada = formatarData(state.date);
  const cidadesHabilitadas = state.cities.filter(c => c.enabled && c.name);
  const nomesCidades = cidadesHabilitadas.map(c => c.name);
  const teamMembers = [state.technician, state.assistant].filter(Boolean);

  let text = `FECHAMENTO DA VIAGEM - ${diaSemana} (${dataFormatada})\n`;
  text += `----------------------------------------------------------------------------\n`;
  text += `🔧 EQUIPE: ${listaComE(teamMembers) || "NÃO INFORMADA"}\n`;
  text += `📍 DESIGNAÇÃO: ${listaComE(nomesCidades) || "A DEFINIR"} – ${listaComE([...state.services]) || "A DEFINIR"}\n`;
  text += `🕗 INÍCIO: ${state.startTime}\n\n`;

  cidadesHabilitadas.forEach((city) => {
      text += `----------------------------------------------------------------------------\n`;
      
      // Contagem de Realizados
      const filledClients = city.clients.filter(cl => cl.name && cl.name.trim() !== "");
      const total = filledClients.length;
      let realizados = 0;
      filledClients.forEach((cl, clIdx) => {
           const key = `${city.name}-${clIdx}`;
           const f = fbList.find(i => i.clientId === key);
           if (f?.status === 'REALIZADO') realizados++;
      });

      text += `CIDADE: ${city.name.toUpperCase()} | REALIZADOS ${realizados}/${total}\n`;
      text += `----------------------------------------------------------------------------\n`;
      text += `ATENDIMENTOS AGENDADOS:\n`;

      filledClients.forEach((cl, clIdx) => {
  const key = `${city.name}-${clIdx}`;
  const fb = fbList.find(f => f.clientId === key);
  
  const statusLabel =
    fb?.status === 'REALIZADO' ? 'REALIZADO' :
    fb?.status === 'NAO_REALIZADO' ? 'NÃO REALIZADO' :
    fb?.status === 'AUSENTE' ? 'AUSENTE' : 
    'PENDENTE';

  const obs = cl.status && cl.status.trim()
    ? ` - ${cl.status.trim().toUpperCase()}`
    : "";

  text += `${clIdx + 1}. ${cl.name.trim().toUpperCase()}${obs} (${statusLabel})\n`;

  if (fb?.status === 'REALIZADO') {
    text += `*O.S NA MESA DE: ${fb?.attendantName || "NÃO INFORMADO"}\n`; // REALIZADO
  } else {
    text += `*O.S RETORNOU A BANDEJA\n`; // AUSENTE ou NAO_REALIZADO
  }
  });
   text += `\n`; 
  });

  return text.trim();
};

interface ModalRelatorioProps {
  viagem: Viagem;
  onClose: () => void;
}

const ModalRelatorio: React.FC<ModalRelatorioProps> = ({ viagem, onClose }) => {
  const texto = gerarTextoRelatorio(viagem);
  
  const copiar = () => {
    navigator.clipboard.writeText(texto).then(() => alert("Relatório copiado para a área de transferência!"));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] border border-gray-700">
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900 rounded-t-xl">
           <h3 className="text-white font-bold text-xl flex items-center gap-2">
             <i className="fas fa-file-invoice text-indigo-400"></i> RELATÓRIO TÉCNICO
           </h3>
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
             <i className="fas fa-times text-xl"></i>
           </button>
        </div>
        <div className="p-6 overflow-auto flex-1 bg-[#1a1b26]">
           <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed selection:bg-indigo-500 selection:text-white">{texto}</pre>
        </div>
        <div className="p-5 border-t border-gray-800 bg-gray-900 rounded-b-xl flex gap-4">
           <button onClick={copiar} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2">
             <i className="fas fa-copy"></i> Copiar Texto
           </button>
           <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-lg font-black uppercase tracking-wider transition-all shadow-lg">
             Fechar
           </button>
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  // --- AUTENTICAÇÃO ---
  const { currentUser, loading, can } = useAuth();

  // --- FUNÇÃO AUXILIAR DE ESTADO INICIAL ---
  // Garante que ao resetar ou iniciar, pegamos a data de hoje e hora 07:00
  const getFreshState = (): AppState => {
    // Deep clone para evitar mutação da referência constante
    const cleanState = JSON.parse(JSON.stringify(INITIAL_STATE));
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    cleanState.date = `${year}-${month}-${day}`;
    cleanState.startTime = "07:00";
    
    // Garante que a primeira cidade comece habilitada para melhor UX
    if (cleanState.cities.length > 0) {
      cleanState.cities[0].enabled = true;
    }
    
    return cleanState;
  };

  // REORDENAÇÃO DAS ABAS: Bandeja é a padrão agora
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'tray' | 'admin'>('tray');
 
  const [state, setState] = useState<AppState>(getFreshState());
  // Histórico de viagens
  const [history, setHistory] = useState<Viagem[]>([]);  

  
// HISTÓRICO EM TEMPO REAL (VIAGENS)
useEffect(() => {
  if (!currentUser) return;

  const unsubscribe = firestoreService.subscribeToViagens(
    (viagens) => {
      setHistory(viagens);
      console.log("SNAPSHOT -> viagens:", viagens.length);
    },
    (err) => console.error("Erro subscribeToViagens:", err)
  );

  return () => unsubscribe();
}, [currentUser]);

// BANDEJA EM TEMPO REAL (COLEÇÃO "bandeja")
useEffect(() => {
  if (!currentUser) return;

  const unsub = trayService.subscribe(
    (items) => {
      setTrayItems(items);
      console.log("SNAPSHOT -> bandeja:", items.length);
    },
    (err) => console.error("Erro trayService.subscribe:", err)
  );

  return () => unsub();
}, [currentUser]);



  // --- TRAY STATE (BANDEJA) ---
  const [trayItems, setTrayItems] = useState<TrayItem[]>([]);
  // Estado para controlar a região ativa na bandeja
  const [activeTrayRegion, setActiveTrayRegion] = useState<string | null>(null);
  // Estado para controlar a cidade ativa na bandeja
  const [activeTrayCity, setActiveTrayCity] = useState<string | null>(null);
  // Estado para armazenar o ID do item sendo arrastado
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);



  

  // Itens visíveis da bandeja (filtrados e ordenados)
  const norm = (s?: string | null) => (s ?? "").trim().toUpperCase();

  const computedTrayItems: TrayItem[] = trayItems
  .filter(t =>
    norm(t.region) === norm(activeTrayRegion) &&
    norm(t.city) === norm(activeTrayCity) &&
    norm(t.status) !== "REALIZADA"
  )
  .sort((a, b) => (a.trayOrder ?? 9999) - (b.trayOrder ?? 9999));

  // Estado para destacar a linha alvo durante o drag over
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  // Estado para controlar se estamos editando uma viagem existente
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Estado para visualização do Relatório (Modal)
  const [relatorioViagem, setRelatorioViagem] = useState<Viagem | null>(null);

  // Estados para Filtros e Paginação do Histórico
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'finalized'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para o Modo Escuro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // 1. Tenta buscar o valor salvo no localStorage usando a chave CORRETA
    const savedTheme = localStorage.getItem('prog_viagem_theme');
    
    // 2. Retorna true SE o valor for exatamente 'dark'.
    //    Se for 'light' ou null/undefined (primeiro acesso), retorna false.
    return savedTheme === 'dark';
  });

  // Buffer local para evitar cursor saltando e perda de espaços/quebras de linha
  const [localText, setLocalText] = useState<Record<string, string>>({});

  const [servicesOpen, setServicesOpen] = useState(false);
  const [cityAccordions, setCityAccordions] = useState<boolean[]>([true, false, false, false]); // Start with first open
  const [output, setOutput] = useState("");
  const [encerramentoOutput, setEncerramentoOutput] = useState("");
  const [feedback, setFeedback] = useState<EncerramentoFeedback[]>([]);
  const [isEncerramentoVisible, setIsEncerramentoVisible] = useState(false);

// ----------------------------------------------------
// 1. useEffect de CARREGAMENTO INICIAL (Executa APENAS UMA VEZ)
// ----------------------------------------------------
useEffect(() => {
    // Carregar dados iniciais (Draft e History)
    const savedDraft = localStorage.getItem('prog_viagem_draft');
    if (savedDraft) {
        try { setState(JSON.parse(savedDraft)); } catch (e) { console.error(e); }
    }
    const savedHistory = localStorage.getItem('prog_viagem_history');
    if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    
    // Carregar Bandeja
    const savedTray = localStorage.getItem('prog_viagem_tray');
    if (savedTray) {
        try { setTrayItems(JSON.parse(savedTray)); } catch (e) { console.error(e); }
    }

    // Carregar tema
    const savedTheme = localStorage.getItem('prog_viagem_theme');
    if (savedTheme) {
        // Inicializa o estado isDarkMode com o valor salvo
        setIsDarkMode(savedTheme === 'dark'); 
    }
    
// Sem dependências ([]), executa somente na montagem
}, []); 


// ----------------------------------------------------
// 2. useEffect de PERSISTÊNCIA (Executa toda vez que isDarkMode mudar)
// ----------------------------------------------------
useEffect(() => {
    // 1. Salva o estado atual do tema no localStorage
    const themeToSave = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('prog_viagem_theme', themeToSave);

    // 2. Adiciona ou remove a classe 'dark' no elemento <html> (para o Tailwind CSS)
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
// Executa toda vez que isDarkMode for alterado
}, [isDarkMode]);

  // Salvar rascunho automaticamente
  useEffect(() => {
    localStorage.setItem('prog_viagem_draft', JSON.stringify(state));
  }, [state]);

  // Salvar histórico
  useEffect(() => {
    localStorage.setItem('prog_viagem_history', JSON.stringify(history));
  }, [history]);

  // Salvar bandeja
  useEffect(() => {
    localStorage.setItem('prog_viagem_tray', JSON.stringify(trayItems));
  }, [trayItems]);

  // Salvar preferência de tema
  useEffect(() => {
    localStorage.setItem('prog_viagem_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Resetar página quando mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

// App.tsx (Bloco useEffect corrigido)

// Carregar dados de Viagens do Firestore em tempo real
useEffect(() => {
    if (currentUser) {
        
        // 1. Função de callback para SUCESSO
        const handleNewViagens = (viagens: Viagem[]) => {
            // O setHistory já está tipado como Viagem[], então o TypeScript aceita
            setHistory(viagens); 
        };

        // 2. Função de callback para ERRO
        const handleError = (error: any) => {
            console.error("Erro ao carregar histórico do Firestore:", error);
        };

        // 🛑 CORREÇÃO: Chamada e armazenamento da função unsubscribe
        const unsubscribe = firestoreService.subscribeToViagens(
            handleNewViagens, 
            handleError
        ); 

        return () => unsubscribe();
    }
}, [currentUser]); // Depende do currentUser estar disponível

  // --- VERIFICAÇÃO DE LOGIN ---
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Carregando...</div>;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  // --- CLASSES DE ESTILO DINÂMICAS ---
  const themeBg = isDarkMode ? 'bg-[#1A202C] text-gray-100' : 'bg-gray-100 text-gray-900';
  // Removi bordas do themeCard para não conflitar com as bordas coloridas laterais
  const themeCard = isDarkMode ? 'bg-[#2D3748] text-gray-100 shadow-lg' : 'bg-white text-gray-900 shadow-md';
  const themeInput = isDarkMode 
    ? 'bg-[#4A5568] border-gray-600 text-white focus:ring-blue-400 placeholder-gray-400' 
    : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-blue-100';
  const themeSubCard = isDarkMode ? 'bg-[#1A202C] border-gray-600' : 'bg-gray-50 border-gray-100';
  const themeLabel = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  // --- FUNÇÕES DE ESTADO ---

  const handleLogout = async () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      await authService.logout();
    }
  };

  const resetForm = () => {
    if (confirm("Deseja iniciar uma nova programação? Todos os dados não salvos do formulário atual serão perdidos.")) {
      setState(getFreshState()); // Usa a função auxiliar para garantir data de hoje e hora 07:00
      setLocalText({});
      setEditingTripId(null);
      setOutput("");
      setEncerramentoOutput("");
      setFeedback([]);
      setIsEncerramentoVisible(false);
      setActiveTab('form');
      setServicesOpen(false);
      setCityAccordions([true, false, false, false]); // Reset accordions
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateState = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const updateMaterials = (updates: Partial<AppState['materials']>) => {
    setState(prev => ({
      ...prev,
      materials: { ...prev.materials, ...updates }
    }));
  };

  const handleNoteUpdate = (val: string) => {
    setLocalText(prev => ({ ...prev, 'materials-note': val }));
    updateMaterials({ note: val });
  };

  const addMaterialField = (type: 'onus' | 'onts' | 'routers') => {
    setState(prev => ({
      ...prev,
      materials: {
        ...prev.materials,
        [type]: [...prev.materials[type], { model: "", qty: 0 }]
      }
    }));
  };

  const removeMaterialField = (type: 'onus' | 'onts' | 'routers', index: number) => {
    setState(prev => {
      const newList = [...prev.materials[type]];
      if (newList.length <= 1) {
        newList[0] = { model: "", qty: 0 };
      } else {
        newList.splice(index, 1);
      }
      return {
        ...prev,
        materials: { ...prev.materials, [type]: newList }
      };
    });
  };

  const updateNestedMaterial = (type: 'onus' | 'onts' | 'routers', index: number, updates: { model?: string, qty?: number }) => {
    setState(prev => {
      const newList = [...prev.materials[type]];
      newList[index] = { ...newList[index], ...updates };
      return {
        ...prev,
        materials: { ...prev.materials, [type]: newList }
      };
    });
  };

  // --- TRAY FUNCTIONS ---
  const addTrayItem = () => {
    if (!activeTrayRegion || !activeTrayCity) {
      alert("Selecione uma região e uma cidade primeiro.");
      return;
    }
    const newItem: TrayItem = {
      id: Math.random().toString(36).substr(2, 9),
      region: activeTrayRegion,
      city: activeTrayCity,
      date: new Date().toISOString().split('T')[0],
      clientName: "",
      status: "",
      equipment: "",
      observation: "",
      attendant: ""
    };
    setTrayItems([...trayItems, newItem]);
};

  const updateTrayItem = (id: string, field: keyof TrayItem, value: string) => {
    setTrayItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
};

  const deleteTrayItem = async (id: string) => {
  if (!window.confirm("Remover este item da bandeja?")) return;

  try {
    // remove da UI imediatamente
    setTrayItems(prev => prev.filter(t => t.id !== id));

    // remove do Firestore
    await trayService.remove(id);
  } catch (err) {
    console.error("deleteTrayItem ERRO:", err);
    alert("Falha ao remover. Veja o console.");
  }
};

  const updateTrayField = async <K extends keyof TrayItem>(
  id: string,
  field: K,
  value: TrayItem[K]
) => {
  // UI imediata
  setTrayItems(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));

  // Persistência
  try {
    await trayService.update(id, { [field]: value } as Partial<TrayItem>);
  } catch (err) {
    console.error("updateTrayField ERRO:", err);
  }
};


  // Função para adicionar uma nova linha na bandeja com estado mínimo
  const addTrayRow = async () => {
  try {
    if (!activeTrayRegion || !activeTrayCity) return;

    const nextOrder = computedTrayItems.length;

    const payload: Omit<TrayItem, "id"> = {
      region: activeTrayRegion,
      city: activeTrayCity,
      date: new Date().toISOString().split("T")[0],
      clientName: "",
      status: "PENDENTE",
      equipment: "",
      observation: "",
      attendant: "",
      trayOrder: nextOrder,
    };

    const docRef = await trayService.add(payload);
    console.log("addTrayRow OK, doc id:", docRef?.id);
  } catch (err) {
    console.error("addTrayRow ERRO:", err);
  }  
};

  // --- DRAG AND DROP FUNCTIONS ---
  // Função de drag start corrigida
  const handleDragStart = (
  e: React.DragEvent<HTMLDivElement>,
  id: string
  ) => {
    // Armazena o ID do item sendo arrastado
    setDraggedItemId(id);
    setDragOverId(null);
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", id);
};

// Função de drag end corrigida
const handleDragEnd = (_e: React.DragEvent<HTMLDivElement>) => {
  setDraggedItemId(null);
  setDragOverId(null);
  setDropPosition(null);
};
  
  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  if (dragOverId !== id) setDragOverId(id);

  const rect = e.currentTarget.getBoundingClientRect();
  const isAbove = (e.clientY - rect.top) < rect.height / 2;
  setDropPosition(isAbove ? 'above' : 'below');
};

  const handleDragEnterRow = (id: string) => {
  setDragOverId(id);
};

  const handleDragLeaveRow = (
  e: React.DragEvent<HTMLTableRowElement>,
  id: string
) => {
  // evita “piscar” quando o mouse passa por elementos dentro da mesma linha
  const related = e.relatedTarget as Node | null;
  if (related && e.currentTarget.contains(related)) return;

  setDragOverId(prev => (prev === id ? null : prev));
};


const handleDrop = async (
  e: React.DragEvent<HTMLTableRowElement>,
  targetId: string
) => {
  e.preventDefault();
  if (!draggedItemId || draggedItemId === targetId) return;

  // limpa UI do hover/linha
  setDragOverId(null);
  setDropPosition(null);

  // itens visíveis da cidade/região atual (já ordenados pelo trayOrder)
  const visible: TrayItem[] = computedTrayItems;

  const moved = visible.find(v => v.id === draggedItemId);
  if (!moved) return;

  // remove o item arrastado
  const remaining = visible.filter(v => v.id !== draggedItemId);

  // encontra o alvo na lista sem o item arrastado
  const targetIndex = remaining.findIndex(v => v.id === targetId);
  if (targetIndex === -1) return;

  // decide posição final (acima/abaixo). Se dropPosition vier null, cai no "acima".
  const insertIndex =
    dropPosition === 'below' ? targetIndex + 1 : targetIndex;

  // cria nova ordem
  const reordered = [...remaining];
  reordered.splice(insertIndex, 0, moved);

  // aplica trayOrder sequencial
  const reorderedWithOrder = reordered.map((v, index) => ({
    ...v,
    trayOrder: index,
  }));

  // 1) atualiza UI imediatamente (somente itens da cidade/região ativa)
  const orderMap = new Map(reorderedWithOrder.map(v => [v.id, v.trayOrder]));

  setTrayItems(prev =>
    prev.map(t => {
      const isSameScope =
        t.region === activeTrayRegion &&
        t.city === activeTrayCity &&
        (t.status ?? '').toUpperCase() !== 'REALIZADA';

      if (!isSameScope) return t;

      const newOrder = orderMap.get(t.id);
      return newOrder === undefined ? t : { ...t, trayOrder: newOrder };
    })
  );

  // 2) persiste no Firestore (isso é o que garante NÃO SUMIR no refresh)
  try {
  await trayService.updateOrder(
  reorderedWithOrder.map(v => ({ id: v.id, trayOrder: v.trayOrder ?? 0 }))
  );
  } catch (err) {
  console.error("Erro ao salvar ordem da bandeja:", err);
  } finally {
  setDraggedItemId(null);
}

  
  // 3) garante que o estado completo da bandeja seja atualizado corretamente
 /* setTrayItems(prev => {
    const isSameGroup = (t: TrayItem) =>
      t.region === activeTrayRegion &&
      t.city === activeTrayCity &&
      t.status !== 'REALIZADA';

    const others = prev.filter((t: TrayItem) => !isSameGroup(t));
    return [...others, ...reorderedWithOrder];
  }); */

  setDragOverId(null);
};

  
  const getRegionCount = (regionName: string) => {
    // Conta itens que pertencem a qualquer cidade desta região
    // As cidades são definidas em REGIONS[regionName]
    const cities = REGIONS[regionName] || [];
    return trayItems.filter(t => cities.includes(t.city)).length;
  };

  const getCityCount = (cityName: string) => trayItems.filter(t => t.city === cityName).length;

  const updateCity = (index: number, updates: Partial<AppState['cities'][0]>) => {
    setState(prev => {
      const newCities = [...prev.cities];
      
      // Se o update contiver nome (ex: digitou no input) ou enabled e já tem nome
      let finalName = updates.name !== undefined ? updates.name : newCities[index].name;
      let newClients = newCities[index].clients;

      // 1. Limpeza Automática: Se o nome estiver vazio, limpa os clientes.
      if (updates.name !== undefined && updates.name.trim() === "") {
          newClients = Array.from({ length: 30 }, () => ({ name: "", status: "" }));
      }
      // 2. Validação Estrita e Preenchimento: Se houver nome, busca na bandeja.
      else if ((updates.enabled === true || (updates.name && newCities[index].enabled)) && finalName) {
         // Filtrar itens da bandeja para esta cidade (CASE INSENSITIVE)
         const stagedItems = trayItems.filter(t => t.city.toLowerCase() === finalName!.trim().toLowerCase());
         
         // Se houver correspondência EXATA (case-insensitive), preenche.
         // Se não houver, limpa os clientes (não mostra dados parciais ou antigos).
         newClients = Array.from({ length: 30 }, () => ({ name: "", status: "" }));
         
         if (stagedItems.length > 0) {
             stagedItems.forEach((item, i) => {
                 if (i < 30) {
                     newClients[i] = {
                         name: item.clientName.toUpperCase(),
                         status: item.status.toUpperCase()
                     };
                 }
             });
         }
         updates.clients = newClients;
      } else if (updates.name !== undefined && !finalName) {
          // Fallback para garantir limpeza se undefined
          newClients = Array.from({ length: 30 }, () => ({ name: "", status: "" }));
          updates.clients = newClients;
      }

      newCities[index] = { ...newCities[index], ...updates };
      return { ...prev, cities: newCities };
    });
  };

  // Função para remover/desativar uma cidade
  const removeCity = (index: number) => {
    if (confirm(`Deseja remover a Cidade ${index + 1}? Os dados serão limpos.`)) {
      setState(prev => {
        const newCities = [...prev.cities];
        // Resetar os dados da cidade
        newCities[index] = {
          enabled: false,
          name: "",
          clients: Array.from({ length: 30 }, () => ({ name: "", status: "" }))
        };
        return { ...prev, cities: newCities };
      });
      // Limpar buffer de texto local também
      setLocalText(prev => {
        const next = { ...prev };
        delete next[`${index}-name`];
        delete next[`${index}-status`];
        return next;
      });
    }
  };

  const handleBulkUpdate = (index: number, type: 'name' | 'status', rawValue: string) => {
    const key = `${index}-${type}`;
    setLocalText(prev => ({ ...prev, [key]: rawValue }));

    const lines = rawValue.split('\n');
    setState(prev => {
      const newCities = [...prev.cities];
      const newClients = Array.from({ length: 30 }, (_, i) => ({
        ...newCities[index].clients[i],
        [type]: lines[i] !== undefined ? lines[i] : "" 
      }));
      newCities[index] = { ...newCities[index], clients: newClients };
      return { ...prev, cities: newCities };
    });
  };

  const getTextAreaValue = (index: number, type: 'name' | 'status') => {
    const key = `${index}-${type}`;
    if (localText[key] !== undefined) return localText[key];

    const clients = state.cities[index].clients;
    const lines = clients.map(c => c[type]);
    
    let lastFilled = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i] && lines[i].trim() !== "") {
        lastFilled = i;
        break;
      }
    }
    return lastFilled === -1 ? "" : lines.slice(0, lastFilled + 1).join('\n');
  };

  const handleServiceToggle = (service: string) => {
    const newServices = state.services.includes(service)
      ? state.services.filter(s => s !== service)
      : [...state.services, service];
    updateState('services', newServices);
  };

// --- LÓGICA DE VIAGEM (SALVAR, CARREGAR, EDITAR) - AGORA COM FIRESTORE ---

    // 1. A função salvarViagem fará a comunicação com o Firestore
const salvarViagem = async (customFeedback?: EncerramentoFeedback[]) => {
    // ... (checa currentUser, define feedbacksToSave) ...

    const feedbacksToSave = customFeedback !== undefined ? customFeedback : (feedback.length > 0 ? feedback : undefined);

    // 🛑 NOVO BLOCO DE LIMPEZA
    // 1. Cria uma cópia do objeto de estado para não alterar o estado original.
    const stateCopy = JSON.parse(JSON.stringify(state)); 

    // 2. Remove as propriedades que o Firestore não aceita/precisa para ADICIONAR.
    // Se a propriedade existir no objeto (mesmo com valor undefined), ela é removida.
    if (stateCopy.id !== undefined) delete stateCopy.id;
    if (stateCopy.id_viagem !== undefined) delete stateCopy.id_viagem;
    // Fim do NOVO BLOCO DE LIMPEZA

    // 1. Prepara o Payload de dados (o que será enviado para o Firestore)
    const payload: ViagemUpdatePayload = {
    // Envie o 'state' original aqui, sem fazer JSON.parse/stringify ainda
    state: state, 

    feedbacks: feedbacksToSave || [],               

    destino: state.cities.find(c => c.enabled)?.name || 'Programação sem Destino',
    data_inicio: state.date, 
    data_fim: state.date,     
    orcamento: 0, 
};
    
    // 2. Decide se é Adicionar ou Atualizar
    try {
        if (editingTripId) {
            // ATUALIZAR EXISTENTE
            await firestoreService.updateViagem(editingTripId, payload);
            return editingTripId;
        } else {
            // CRIAR NOVA
            // O firestoreService adiciona os campos autor_uid, autor_email e data_criacao
            const newDocRef = await firestoreService.addViagem(payload); 
            
            // O Dashboard (onSnapshot) se atualiza automaticamente, mas precisamos atualizar o estado local 'editingTripId'
            setEditingTripId(newDocRef.id); 
            return newDocRef.id;
        }
    } catch (error) {
        console.error("Erro ao salvar/atualizar no Firestore:", error);
        throw new Error("Falha ao salvar a viagem no servidor. Verifique sua conexão.");
    }
};

const handleManualSave = async () => {
    try {
        await salvarViagem();
        alert(editingTripId ? "Alterações salvas com sucesso!" : "Nova viagem salva no Histórico Colaborativo!");
    } catch (error) {
        // O erro já foi logado e alertado dentro de salvarViagem
    }
};

const excluirViagem = async (id: string) => {
    if (!currentUser) {
        alert("Você precisa estar logado para excluir viagens.");
        return;
    }
    if (confirm("Deseja realmente excluir esta viagem do histórico (permanente e colaborativo)?")) {
        try {
            await firestoreService.deleteViagem(id);
            alert("Viagem excluída com sucesso do histórico.");
            
            // O onSnapshot no Dashboard já irá remover do histórico. Apenas o estado local precisa de ajuste:
            if (editingTripId === id) {
                resetForm();
            }
        } catch (error) {
            console.error("Erro ao excluir viagem:", error);
            alert("Falha ao excluir a viagem. Verifique se você tem permissão.");
        }
    }
};

// --- FUNÇÕES DE CARREGAMENTO (MANTIDAS) ---
// Estas funções continuam usando o estado local (setState, setEditingTripId, etc.) e estão corretas.

const carregarViagem = (viagem: Viagem) => { 
    // OBS: O tipo 'SavedTrip' deve ser 'Viagem' agora, pois ele vem do firestoreService
// 1. Preenche todos os campos do formulário
    setState(viagem.state); 
    // 2. Define o ID que está sendo editado (para o botão Salvar virar Atualizar)
    setEditingTripId(viagem.id ?? null);
    // 3. Muda a visualização para o formulário
    setActiveTab('form');
};

const carregarParaEncerramento = (viagem: Viagem) => {
    // 1. Preenche o formulário/estado com os dados da viagem finalizada
    setState(viagem.state); 
    
    // 2. Define o ID da viagem. Isso é útil se houver algum botão de 'Reabrir Viagem'
    // Apenas abre a aba viagem, "não estamos editando aqui, apenas observando"
    setEditingTripId(null); 
    
    // 3. MUDA PARA A ABA DE ENCERRAMENTO/RELATÓRIO
    // Baseado na sua imagem, a aba de encerramento parece ter o nome 'Relatorio' ou 'Encerramento'.
    // Vamos usar 'encerramento' como um nome lógico, mas confirme se o seu componente tem essa aba.
    setActiveTab('form');
};

// --- CONCLUSÃO AUTOMÁTICA DE VIAGEM (AGORA ATUALIZA O FIRESTORE) ---

const concluirViagemHistorico = async (viagem: Viagem) => {
    if (!currentUser) {
        alert("Você precisa estar logado para concluir viagens.");
        return;
    }
    
    if (confirm("Deseja concluir esta viagem automaticamente? Isso marcará todos os atendimentos como REALIZADOS no histórico colaborativo.")) {
        
        // 1. Cria o feedback de conclusão (o mesmo código original)
        const newFeedback: EncerramentoFeedback[] = []; 
        viagem.state.cities.forEach(city => {
            if (city.enabled && city.name) {
                city.clients.forEach((cl, clIdx) => {
                    if (cl.name && cl.name.trim() !== "") {
                        newFeedback.push({
                            clientId: `${city.name}-${clIdx}`,
                            cityName: city.name, 
                            status: 'REALIZADO',
                            attendantName: ""
                        });
                    }
                });
            }
        });

        // 2. Prepara o Payload de ATUALIZAÇÃO MÍNIMO
        const updatePayload: ViagemUpdatePayload = {
            feedbacks: newFeedback
        };

        // 3. ATUALIZA O FIRESTORE
        try {
            await firestoreService.updateViagem(viagem.id!, updatePayload); 
            
            // LIMPEZA AUTOMÁTICA DA BANDEJA
            // Remove itens da bandeja que correspondem a clientes realizados nesta viagem
            const clientsToRemove = newFeedback
                .filter(fb => fb.status === 'REALIZADO')
                .map(fb => {
                    // clientId format: "CityName-Index"
                    const parts = fb.clientId.split('-');
                    const city = parts[0];
                    const idx = parseInt(parts[1]);
                    // Encontrar o nome do cliente no estado original da viagem (ou atualizado)
                    const clientObj = viagem.state.cities.find(c => c.name === city)?.clients[idx];
                    return { city, name: clientObj?.name };
                })
                .filter(c => c.name); // Ensure name exists

            if (clientsToRemove.length > 0) {
                setTrayItems(prev => prev.filter(item => {
                    // Mantém o item SE ele NÃO estiver na lista de removidos
                    const isProcessed = clientsToRemove.some(
                        removed => removed.city.toLowerCase() === item.city.toLowerCase() && 
                           removed.name?.trim().toLowerCase() === item.clientName.trim().toLowerCase()
            );
            return !isProcessed;
        }));
    }

            alert("Viagem concluída, histórico atualizado e itens processados removidos da Bandeja!");
            
            // Não precisa de setHistory(prev => ...) porque o Dashboard faz isso.
        } catch (error) {
            console.error("Erro ao concluir viagem:", error);
            alert("Falha ao concluir a viagem no servidor.");
        }
    }
};

  // --- LÓGICA DE FILTRAGEM E PAGINAÇÃO ---

  const getFilteredHistory = () => {
    return history.filter(viagem => {
      // 1. Filtro por Status
      const isFinalized = viagem.feedbacks && viagem.feedbacks.length > 0;
      if (statusFilter === 'open' && isFinalized) return false;
      if (statusFilter === 'finalized' && !isFinalized) return false;

      // 2. Filtro de Busca (Search)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        
        const dataFormatada = formatarData(viagem.state.date).toLowerCase();
        const tecnico = (viagem.state.technician || "").toLowerCase();
        const assistente = (viagem.state.assistant || "").toLowerCase();
        
        // Verifica cidades
        const cidades = viagem.state.cities
          .filter(c => c.enabled && c.name)
          .map(c => c.name.toLowerCase())
          .join(" ");

        const match = 
          dataFormatada.includes(term) ||
          tecnico.includes(term) ||
          assistente.includes(term) ||
          cidades.includes(term);

        if (!match) return false;
      }

      return true;
    });
  };

  const filteredHistory = getFilteredHistory();
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const currentHistoryPage = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // --- GERAÇÃO DE TEXTO E RELATÓRIOS ---

  const gerarTexto = () => {
    const diaSemana = getDiaSemana(state.date);
    const dataFormatada = formatarData(state.date);
    const cidadesHabilitadas = state.cities.filter(c => c.enabled && c.name);
    const nomesCidades = cidadesHabilitadas.map(c => c.name);

    let text = `PROGRAMAÇÃO DA VIAGEM - ${diaSemana} (${dataFormatada})\n`;
    text += `----------------------------------------------------------------------------\n`;
    const teamMembers = [state.technician, state.assistant].filter(Boolean);
    text += `🔧 EQUIPE: ${listaComE(teamMembers) || "NÃO INFORMADA"}\n`;
    text += `📍 DESIGNAÇÃO: ${listaComE(nomesCidades) || "A DEFINIR"} – ${listaComE([...state.services]) || "A DEFINIR"}\n`;
    text += `🕗 INÍCIO: ${state.startTime}\n\n`;

    text += `----------------------------------------------------------------------------\n`;
    text += `MATERIAIS LEVADOS:\n`;

    const addMaterialLine = (qty: number, model: string) => {
      if (model && qty > 0) text += `${pad(qty)} ${model}\n`;
    };

    state.materials.onus.forEach(item => addMaterialLine(item.qty, item.model));
    state.materials.onts.forEach(item => addMaterialLine(item.qty, item.model));
    state.materials.routers.forEach(item => addMaterialLine(item.qty, item.model));

    if (state.materials.connectorApc > 0) text += `${pad(state.materials.connectorApc)} CONECTOR APC\n`;
    if (state.materials.connectorUpc > 0) text += `${pad(state.materials.connectorUpc)} CONECTOR UPC\n`;
    if (state.materials.lunch) text += `${state.materials.lunch.toUpperCase()}\n`;
    if (state.materials.key) text += `01 CHAVE DA LOJA\n`;
    if (state.materials.fuelNote) text += `01 NOTA DE ABASTECIMENTO\n`;
    if (state.materials.note && state.materials.note.trim()) text += `OBS: ${state.materials.note.trim()}\n`;
    text += `\n`;

    cidadesHabilitadas.forEach((city, idx) => {
      text += `----------------------------------------------------------------------------\n`;
      text += `${idx + 1}ª CIDADE: ${city.name.toUpperCase()}\n`;
      text += `----------------------------------------------------------------------------\n`;
      text += `ATENDIMENTOS AGENDADOS:\n`;
      const filledClients = city.clients.filter(cl => cl.name && cl.name.trim() !== "");
      filledClients.forEach((cl, clIdx) => {
        text += `${clIdx + 1}. ${cl.name.trim().toUpperCase()}${cl.status && cl.status.trim() ? ` - ${cl.status.trim().toUpperCase()}` : ""}\n`;
      });
      text += `\n`;
    });
    setOutput(text.trim());
  };

  const iniciarEncerramento = () => {
    if (feedback.length > 0) {
      setIsEncerramentoVisible(true);
      return;
    }


  const newFeedback: EncerramentoFeedback[] = [];
  // Percorre cidades e clientes para gerar feedback inicial
  state.cities.forEach(city => {
    if (city.enabled && city.name) {
      city.clients.forEach((cl, clIdx) => { 
        const clientName = (cl.name ?? "").trim();
        if (clientName !== "") {
          // ✅ pega atendente da bandeja para este cliente/cidade
          const trayMatch = trayItems.find(t =>
            (t.city ?? "").trim().toLowerCase() === city.name.trim().toLowerCase() &&
            (t.clientName ?? "").trim().toLowerCase() === clientName.toLowerCase()
            );
          // Adiciona o feedback como REALIZADO
          
          newFeedback.push({
            clientId: `${city.name}-${clIdx}`,
            cityName: city.name,
            status: "REALIZADO",
            attendantName: trayMatch?.attendant ?? "",
            trayItemId: trayMatch?.id,
          });
        }
      });
    }
  });

  setFeedback(newFeedback);
  setIsEncerramentoVisible(true);
};

  const finalizarEGerarRelatorio = async () => {
    // 1. Gera o Texto
    const diaSemana = getDiaSemana(state.date);
    const dataFormatada = formatarData(state.date);
    const cidadesHabilitadas = state.cities.filter(c => c.enabled && c.name);
    const nomesCidades = cidadesHabilitadas.map(c => c.name);
    // Monta o texto
    let text = `FECHAMENTO DA VIAGEM - ${diaSemana} (${dataFormatada})\n`;
    text += `----------------------------------------------------------------------------\n`;
    const teamMembers = [state.technician, state.assistant].filter(Boolean);
    text += `🔧 EQUIPE: ${listaComE(teamMembers) || "NÃO INFORMADA"}\n`;
    text += `📍 DESIGNAÇÃO: ${listaComE(nomesCidades) || "A DEFINIR"} – ${listaComE([...state.services]) || "A DEFINIR"}\n`;
    text += `🕗 INÍCIO: ${state.startTime}\n\n`;

    cidadesHabilitadas.forEach((city) => {
      text += `----------------------------------------------------------------------------\n`;
      
      // Contagem de Realizados
      const filledClients = city.clients.filter(cl => cl.name && cl.name.trim() !== "");
      const total = filledClients.length;
      let realizados = 0;
      // Conta quantos foram REALIZADOS
      filledClients.forEach((cl, clIdx) => {
        const fb = feedback.find(f => f.clientId === `${city.name}-${clIdx}`);
        if (fb?.status === 'REALIZADO') realizados++;
      });
      // Adiciona ao texto
      text += `CIDADE: ${city.name.toUpperCase()} | REALIZADOS ${realizados}/${total}\n`;
      text += `----------------------------------------------------------------------------\n`;
      text += `ATENDIMENTOS AGENDADOS:\n`;
      // Lista clientes com status
      filledClients.forEach((cl, clIdx) => {
        const fb = feedback.find(f => f.clientId === `${city.name}-${clIdx}`);
          const statusLabel =
  fb?.status === 'REALIZADO' ? 'REALIZADO' :
  fb?.status === 'NAO_REALIZADO' ? 'NÃO REALIZADO' :
  fb?.status === 'AUSENTE' ? 'AUSENTE' :
  'PENDENTE';
        text += `${clIdx + 1}. ${cl.name.trim().toUpperCase()}${cl.status && cl.status.trim() ? ` - ${cl.status.trim().toUpperCase()}` : ""} (${statusLabel})\n`;
        if (fb?.status === 'REALIZADO') { 
          text += `*O.S NA MESA DE: ${fb.attendantName || ""}\n`; // REALIZADO
        } else { 
          text += `*O.S RETORNOU A BANDEJA\n`; // AUSENTE ou NAO_REALIZADO
        }
      });
      text += `\n`; 
    });
    
    // 2. Salva no Histórico como Finalizada (com feedbacks)
    // Isso é assíncrono, mas o update de estado abaixo é síncrono.
    // Para limpar a bandeja corretamente, precisamos saber quais clientes foram finalizados.
    // Usamos a lista local 'feedback' para calcular o cleanup.
    
    await salvarViagem(feedback);


   // ✅ Persistir na BANDEJA: remove REALIZADOS e garante status nos que retornam
  try {
    const ops = feedback.map(async (fb) => {
      if (!fb.trayItemId) return;

      // pega o client do state para recuperar o status textual (SEM INTERNET, etc.)
      const [cityName, idxStr] = fb.clientId.split("-");
      const idx = Number(idxStr);
      const cl = state.cities.find(c => c.name === cityName)?.clients[idx];
      const statusTexto = (cl?.status ?? "").trim();

      if (fb.status === "REALIZADO") {
        await trayService.remove(fb.trayItemId);
      } else {
        // AUSENTE / NAO_REALIZADO -> permanece na bandeja
        // garante que o status não volte vazio
        await trayService.update(fb.trayItemId, {
          status: statusTexto || "PENDENTE",
        });
      }
    });

    await Promise.all(ops);
  } catch (e) {
    console.error("Erro ao sincronizar bandeja pós-encerramento:", e);
  }

    
    // 3. Reseta o formulário (Estado Limpo), mas mostra o resultado
    setState(INITIAL_STATE);
    setLocalText({});
    setEditingTripId(null); // Sai do modo de edição
    setFeedback([]); // Limpa feedbacks locais pois salvamos no histórico
    
    // Restaura a visualização apenas do output
    setEncerramentoOutput(text.trim());
    setIsEncerramentoVisible(true); // Mantém a modal visível para ver o texto
    
    alert("Viagem finalizada, salva no histórico, itens processados removidos da Bandeja e formulário resetado!");
  };

  const copiarTexto = (text: string) => {
    navigator.clipboard.writeText(text).then(() => alert("Texto copiado!"));
  };

  const imprimirProgramacao = (text: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão - Programação de Viagem</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.4; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${text}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Encontra o índice da próxima cidade desabilitada
  const nextCityIndex = state.cities.findIndex(c => !c.enabled);

  return (
    <div className={`w-full min-h-screen pb-20 no-print font-sans transition-colors duration-300 ${themeBg}`}>
      {relatorioViagem && (
        <ModalRelatorio 
          viagem={relatorioViagem} 
          onClose={() => setRelatorioViagem(null)} 
        />
      )}

      <div className={`mx-auto p-4 space-y-6 ${activeTab === 'tray' ? 'w-full max-w-[1600px]' : 'max-w-4xl'}`}>
        <header 
          onClick={resetForm}
          className="text-center py-6 bg-blue-700 text-white rounded-xl shadow-lg border-b-4 border-blue-900 cursor-pointer hover:bg-blue-800 transition-colors group relative"
          title="Clique para iniciar uma Nova Programação (Limpar tudo)"
        >
          {/* Botão de Logout no canto superior esquerdo */}
          <div 
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="absolute top-4 left-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-2 z-10"
          >
            <i className="fas fa-sign-out-alt"></i> SAIR
          </div>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-blue-800 text-xs font-bold px-2 py-1 rounded">
            NOVA PROGRAMAÇÃO <i className="fas fa-redo ml-1"></i>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white">Programação de Viagem</h1>
          <p className="text-blue-200 text-sm mt-1 font-medium">abertura e fechamento de programações</p>
          {editingTripId && (
            <div className="mt-2 inline-block bg-amber-400 text-blue-900 px-3 py-1 rounded-full text-xs font-black uppercase animate-pulse">
              <i className="fas fa-edit mr-1"></i> Editando Viagem
            </div>
          )}
        </header>

        <nav className={`flex p-1 rounded-lg shadow-inner border ${isDarkMode ? 'bg-[#2D3748] border-gray-600' : 'bg-white border-gray-200'}`}>
          {/* Botão Bandeja - MOVED TO FIRST */}
          {/* Bandeja sempre */}
  <button 
    onClick={() => setActiveTab('tray')}
    className={`py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 mx-1 ${
      activeTab === 'tray'
        ? 'bg-amber-500 text-white shadow-lg flex-[2]'
        : `flex-1 ${isDarkMode ? 'text-gray-400 hover:bg-[#4A5568]' : 'text-gray-500 hover:bg-gray-50'}`
    }`}
    title="Bandeja de Viagens"
  >
    <i className="fas fa-inbox"></i> Bandeja
  </button>
           {/* Nova Programação só para ALL */}
  {can('all') && (
    <button 
      onClick={() => setActiveTab('form')}
      className={`py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${
        activeTab === 'form'
          ? 'bg-blue-600 text-white shadow-lg flex-[2]'
          : `flex-1 ${isDarkMode ? 'text-gray-400 hover:bg-[#4A5568]' : 'text-gray-500 hover:bg-gray-50'}`
      }`}
    >
      <i className="fas fa-edit"></i> {editingTripId ? 'Editando' : 'Nova Programação'}
    </button>
  )}

           {/* Histórico só para HISTORY (ou ALL, se seu can() já tratar) */}
  {can('history') && (
    <button
      onClick={() => setActiveTab('history')}
      className={`py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${
        activeTab === 'history'
          ? 'bg-blue-600 text-white shadow-lg flex-[2]'
          : `flex-1 ${isDarkMode ? 'text-gray-400 hover:bg-[#4A5568]' : 'text-gray-500 hover:bg-gray-50'}`
      }`}
    >
      <i className="fas fa-history"></i> Histórico
    </button>
  )}
        </nav>

   {/* Admin só para ADMIN - MEU BOTÃO SUPERIOR DIREITO DO ADMIN */}

        {can('admin') && (
  <button
    onClick={() => setActiveTab('admin')}
    title="Administração"
    aria-label="Administração"
    className={`
      fixed right-4 top-[-8px] z-50
      h-9 w-9
      rounded-l-xl rounded-r-none
      flex items-center justify-center
      border shadow-lg
      backdrop-blur-md
      transition-all duration-200
      ${activeTab === 'admin'
        ? `
          bg-blue-600/85 text-white
          border-blue-300/40
          shadow-blue-500/20
        `
        : (isDarkMode
            ? `
              bg-white/5 text-white/80
              border-white/10
              hover:bg-white/10 hover:text-white
              shadow-black/30
            `
            : `
              bg-black/5 text-gray-800
              border-black/10
              hover:bg-black/8
              shadow-black/10
            `
          )
      }
      hover:scale-[1.03]
      active:scale-[0.98]

      hover:ring-2 hover:ring-white/10
      hover:ring-black/10
    `}
  >
    <i className="fas fa-user-cog text-[16px]"></i>
  </button>
)}

        {activeTab === 'form' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Dados Gerais - AZUL */}
            <section className={`p-5 rounded-xl shadow-md border-l-4 border-blue-600 space-y-4 ${themeCard}`}>
              <h2 className={`font-bold flex items-center text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}><i className="fas fa-info-circle mr-3 text-blue-500"></i> DADOS DA EQUIPE</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${themeLabel}`}>Data da Viagem</label>
                  <input type="date" value={state.date} onChange={e => updateState('date', e.target.value)} className={`block w-full rounded-lg p-3 border font-medium outline-none focus:ring-2 ${themeInput}`}/>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${themeLabel}`}>Horário de Saída</label>
                  <input type="time" value={state.startTime} onChange={e => updateState('startTime', e.target.value)} className={`block w-full rounded-lg p-3 border font-medium outline-none focus:ring-2 ${themeInput}`}/>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${themeLabel}`}>Técnico Responsável</label>
                  <select value={state.technician} onChange={e => updateState('technician', e.target.value)} className={`block w-full rounded-lg p-3 border font-medium outline-none focus:ring-2 ${themeInput}`}>
                    {TECHNICIANS.map(t => <option key={t} value={t}>{t || "Selecione..."}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${themeLabel}`}>Auxiliar / Acompanhante</label>
                  <select value={state.assistant} onChange={e => updateState('assistant', e.target.value)} className={`block w-full rounded-lg p-3 border font-medium outline-none focus:ring-2 ${themeInput}`}>
                    {ASSISTANTS.map(a => <option key={a} value={a}>{a || "Selecione..."}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Serviços - VERDE (EMERALD) */}
            <section className={`rounded-xl shadow-md overflow-hidden border-l-4 border-emerald-500 ${isDarkMode ? 'bg-[#2D3748]' : 'bg-white'}`}>
              <button onClick={() => setServicesOpen(!servicesOpen)} className={`w-full text-left p-5 flex justify-between items-center transition-all ${isDarkMode ? 'hover:bg-[#4A5568]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <span className={`font-bold flex items-center text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}><i className="fas fa-tools mr-3 text-emerald-500"></i> Serviços agendados ({state.services.length})</span>
                <i className={`fas fa-chevron-${servicesOpen ? 'up' : 'down'} text-gray-400`}></i>
              </button>
              {servicesOpen && (
                <div className={`p-5 grid grid-cols-2 md:grid-cols-4 gap-3 ${isDarkMode ? 'bg-[#2D3748]' : 'bg-white'}`}>
                  {SERVICES_OPTIONS.map(service => {
                    const isSelected = state.services.includes(service);
                    let containerClass = "flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ";
                    if (isSelected) {
                        containerClass += isDarkMode ? "bg-emerald-800 border-emerald-600" : "bg-emerald-50 border-emerald-200";
                    } else {
                        containerClass += isDarkMode ? "bg-[#4A5568] border-gray-600" : "bg-white border-gray-100";
                    }

                    let textClass = "text-sm font-bold ";
                    if (isSelected) {
                        textClass += isDarkMode ? "text-white" : "text-emerald-800";
                    } else {
                        textClass += isDarkMode ? "text-gray-200" : "text-gray-700";
                    }

                    return (
                      <label key={service} className={containerClass}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleServiceToggle(service)} className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5"/>
                        <span className={textClass}>{service}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Lista de Materiais - LARANJA */}
            <section className={`p-5 rounded-xl shadow-md border-l-4 border-orange-500 space-y-6 ${themeCard}`}>
              <h2 className={`font-bold flex items-center text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}><i className="fas fa-box-open mr-3 text-orange-500"></i> LISTA DE MATERIAIS</h2>
              
              <div className="space-y-5">
                {([['onus', 'ONU', ONU_MODELS], ['onts', 'ONT', ONT_MODELS], ['routers', 'ROTEADOR', ROUTER_MODELS]] as const).map(([type, label, models]) => (
                  <div key={type} className={`p-4 rounded-xl border ${themeSubCard}`}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}(S)</label>
                      <button onClick={() => addMaterialField(type)} className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-xs">
                        <i className="fas fa-plus-circle"></i> ADICIONAR
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {state.materials[type].map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm w-full sm:w-auto ${isDarkMode ? 'bg-[#4A5568] border-gray-600' : 'bg-white border-gray-200'}`}>
                          <MaterialSelector 
                            options={models} 
                            value={item.model} 
                            qty={item.qty} 
                            onModelChange={(val) => updateNestedMaterial(type, idx, { model: val })}
                            onQtyChange={(val) => updateNestedMaterial(type, idx, { qty: val })}
                            isDarkMode={isDarkMode}
                          />
                          <button onClick={() => removeMaterialField(type, idx)} className="text-red-400 hover:text-red-600 p-1"><i className="fas fa-times-circle"></i></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <NumericStepper 
                    label="CONECTOR APC" 
                    value={state.materials.connectorApc} 
                    onChange={v => updateMaterials({ connectorApc: v })}
                    isDarkMode={isDarkMode}
                  />
                  <NumericStepper 
                    label="CONECTOR UPC" 
                    value={state.materials.connectorUpc} 
                    onChange={v => updateMaterials({ connectorUpc: v })}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className={`p-3 rounded-lg border flex flex-col justify-center ${themeSubCard}`}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">ALMOÇO</label>
                  <select value={state.materials.lunch} onChange={e => updateMaterials({ lunch: e.target.value })} className={`w-full bg-transparent font-bold focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {LUNCH_OPTIONS.map(opt => <option key={opt} value={opt} className={isDarkMode ? 'bg-[#4A5568] text-white' : ''}>{opt || "Selecione..."}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-6 items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={state.materials.key} onChange={e => updateMaterials({ key: e.target.checked })} className="rounded text-orange-600 h-5 w-5"/>
                  <span className={`text-xs font-bold uppercase group-hover:text-orange-600 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Chave da Loja</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={state.materials.fuelNote} onChange={e => updateMaterials({ fuelNote: e.target.checked })} className="rounded text-orange-600 h-5 w-5"/>
                  <span className={`text-xs font-bold uppercase group-hover:text-orange-600 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nota Abastecimento</span>
                </label>
              </div>
              
              <textarea 
                value={localText['materials-note'] !== undefined ? localText['materials-note'] : state.materials.note} 
                onChange={e => handleNoteUpdate(e.target.value)} 
                placeholder="Observações adicionais sobre materiais..." 
                spellCheck={false}
                style={{ whiteSpace: 'pre-wrap' }}
                className={`w-full rounded-lg p-3 text-sm font-medium h-24 outline-none focus:ring-2 focus:ring-orange-100 ${themeInput}`}
              />
            </section>

            {/* Cidades - AZUL */}
            <section className="space-y-4">
              {state.cities.map((city, idx) => {
                // Renderização Condicional: Só mostra se estiver habilitada
                if (!city.enabled) return null;

                return (
                  <div key={idx} className={`rounded-xl shadow-md border-l-4 border-blue-500 overflow-hidden ${themeCard}`}>
                    <div className={`p-4 flex items-center gap-4 ${themeSubCard}`}>
                      {/* Substituído Checkbox por nada ou indicador fixo para cidade 1 */}
                      <div className="flex-1">
                        <input type="text" placeholder={`Cidade ${idx + 1}`} value={city.name} onChange={e => updateCity(idx, { name: e.target.value })} className={`w-full bg-transparent border-b-2 font-black text-lg focus:outline-none border-indigo-200 focus:border-indigo-600 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}/>
                      </div>
                      
                      <button onClick={() => { const n = [...cityAccordions]; n[idx] = !n[idx]; setCityAccordions(n); }} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                        <i className={`fas fa-chevron-${cityAccordions[idx] ? 'up' : 'down'}`}></i>
                      </button>

                      {/* Botão de Excluir Cidade (Exceto a primeira) */}
                      {idx > 0 && (
                        <button onClick={() => removeCity(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors" title="Remover Cidade">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    {cityAccordions[idx] && (
                      <div className={`p-5 space-y-4 animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#2D3748]' : 'bg-white'}`}>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Lista de Atendimentos (Cole ou Digite abaixo)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Nomes dos Clientes (Enter para nova linha)</label>
                            <textarea 
                              value={getTextAreaValue(idx, 'name')} 
                              onChange={e => handleBulkUpdate(idx, 'name', e.target.value)} 
                              spellCheck={false}
                              wrap="soft"
                              style={{ whiteSpace: 'pre-wrap' }}
                              className={`w-full h-48 p-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-100 outline-none resize-none ${themeInput}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Status dos Clientes (Enter para nova linha)</label>
                            <textarea 
                              value={getTextAreaValue(idx, 'status')} 
                              onChange={e => handleBulkUpdate(idx, 'status', e.target.value)} 
                              spellCheck={false}
                              wrap="soft"
                              style={{ whiteSpace: 'pre-wrap' }}
                              className={`w-full h-48 p-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-100 outline-none resize-none ${themeInput}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Botão Adicionar Próxima Cidade */}
              {nextCityIndex !== -1 && (
                <button 
                  onClick={() => {
                    updateCity(nextCityIndex, { enabled: true });
                    // Opcional: Abrir o accordion da nova cidade automaticamente
                    const n = [...cityAccordions];
                    n[nextCityIndex] = true;
                    setCityAccordions(n);
                  }}
                  className={`w-full py-4 border-2 border-dashed rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-[#2D3748]' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <i className="fas fa-plus-circle"></i> Adicionar Cidade {nextCityIndex + 1}
                </button>
              )}
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={gerarTexto} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-wider text-lg">
                <i className="fas fa-file-invoice mr-2"></i> Gerar Programação
              </button>
              <button onClick={handleManualSave} className="bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-wider text-lg">
                <i className="fas fa-save mr-2"></i> {editingTripId ? 'Atualizar Viagem' : 'Salvar na Lista'}
              </button>
            </div>

            {output && (
              <div className="space-y-3 animate-in slide-in-from-bottom-4">
                <textarea readOnly value={output} className="w-full h-80 p-5 font-mono text-sm bg-gray-900 text-green-400 rounded-xl shadow-2xl border-4 border-gray-800"/>
                <div className="flex gap-3">
                  <button onClick={() => copiarTexto(output)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold uppercase transition-all shadow-md"><i className="fas fa-copy mr-2"></i> Copiar</button>
                  <button onClick={() => imprimirProgramacao(output)} className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-bold uppercase transition-all shadow-md"><i className="fas fa-print mr-2"></i> Imprimir</button>
                </div>
              </div>
            )}

            <div className="pt-10">
              <button onClick={iniciarEncerramento} className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-5 rounded-xl shadow-xl transition-all uppercase tracking-widest text-lg border-b-4 border-indigo-900">
                <i className="fas fa-flag-checkered mr-2"></i> Iniciar Encerramento
              </button>

              {isEncerramentoVisible && (
                <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-8">
                  <div className="flex items-center gap-3 border-b-4 border-indigo-100 pb-2">
                     <h2 className="text-2xl font-black text-indigo-900 uppercase">Fechamento Técnico</h2>
                  </div>
                  
                  <div className="space-y-8">
                    {state.cities.filter(c => c.enabled && c.name).map((city) => (
                      <div key={city.name} className="space-y-4">
                        <h3 className="font-black text-indigo-600 text-xl flex items-center gap-2"><i className="fas fa-map-marker-alt"></i> {city.name.toUpperCase()}</h3>
                        <div className="grid gap-3">
                          {city.clients.filter(cl => cl.name && cl.name.trim() !== "").map((cl, clIdx) => {
                            const clientKey = `${city.name}-${clIdx}`;
                            const fbItem = feedback.find(f => f.clientId === clientKey);
                            return (
                              <div key={clientKey} className={`p-5 rounded-xl shadow-sm border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-indigo-200 ${isDarkMode ? 'bg-[#2D3748] border-gray-600' : 'bg-white border-gray-100'}`}>
                                <div className="flex flex-col">
                                  <span className={`font-black text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{cl.name.trim().toUpperCase()}</span>
                                  <span className="text-gray-400 text-xs font-bold uppercase">{cl.status.trim()}</span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className={`flex p-1 rounded-lg gap-1 ${isDarkMode ? 'bg-[#4A5568]' : 'bg-gray-100'}`}>
                                    {(['REALIZADO', 'NAO_REALIZADO', 'AUSENTE'] as FeedbackStatus[]).map(s => {
                                      const isActive = fbItem?.status === s;
                                      let activeStyle = 'text-gray-400 hover:text-gray-600';
                                      if (isActive) {
                                        if (s === 'REALIZADO') activeStyle = 'bg-blue-600 text-white shadow-md';
                                        else if (s === 'NAO_REALIZADO') activeStyle = 'bg-red-600 text-white shadow-md';
                                        else if (s === 'AUSENTE') activeStyle = 'bg-amber-500 text-white shadow-md';
                                      }
                                      return (
                                        <button 
                                          key={s} 
                                          onClick={() => {
                                              let newAttendant = fbItem?.attendantName || "";
                                              if (s === 'REALIZADO') {
                                                  // AUTOMAÇÃO DO ATENDENTE: Busca na Bandeja o match exato
                                                  const trayMatch = trayItems.find(t => 
                                                      t.city.trim().toLowerCase() === city.name.trim().toLowerCase() && 
                                                      t.clientName.trim().toLowerCase() === cl.name.trim().toLowerCase()
                                                  );
                                                  if (trayMatch && trayMatch.attendant) {
                                                      newAttendant = trayMatch.attendant;
                                                  }
                                              }
                                              setFeedback(prev => prev.map(f => f.clientId === clientKey ? { ...f, status: s, attendantName: newAttendant } : f));
                                          }}
                                          className={`px-3 py-2 rounded-md text-[10px] font-black transition-all ${activeStyle}`}
                                        >
                                          {s.replace('_', ' ')}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {fbItem?.status === 'REALIZADO' && (
                                    <select 
                                      value={fbItem.attendantName} 
                                      onChange={e => setFeedback(prev => prev.map(f => f.clientId === clientKey ? { ...f, attendantName: e.target.value } : f))}
                                      className={`p-3 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-300 outline-none w-full md:w-48 ${isDarkMode ? 'bg-[#4A5568] border-gray-600 text-white' : 'bg-indigo-50 text-gray-800'}`}
                                    >
                                      <option value="">Atendente...</option>
                                      {ATTENDANTS.filter(n => n).map(name => (
                                        <option key={name} value={name} className={isDarkMode ? 'bg-[#4A5568] text-white' : ''}>{name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={finalizarEGerarRelatorio} className="w-full bg-indigo-900 hover:bg-black text-white font-black py-5 rounded-xl shadow-2xl transition-all uppercase tracking-widest text-xl mb-4">
                    Finalizar e Gerar Relatório
                  </button>

                  {encerramentoOutput && (
                    <div className="space-y-3 animate-in zoom-in-95">
                      <textarea readOnly value={encerramentoOutput} className="w-full h-80 p-5 font-mono text-sm bg-gray-800 text-indigo-300 rounded-xl shadow-2xl border-4 border-indigo-900"/>
                      <div className="flex gap-3">
                        <button onClick={() => copiarTexto(encerramentoOutput)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black uppercase shadow-lg"><i className="fas fa-copy mr-2"></i> Copiar Fechamento</button>
                        <button onClick={() => imprimirProgramacao(encerramentoOutput)} className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-xl font-black uppercase shadow-lg"><i className="fas fa-print mr-2"></i> Imprimir Fechamento</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              
            </div>
          </div>

) : activeTab === 'admin' ? (
  can('admin') ? (
    <AdminUsersScreen isDarkMode={isDarkMode} />
  ) : (
    <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
      Você não tem permissão para acessar o Admin.
    </div>
  )

        ) : activeTab === 'tray' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* TRAY UI HEADER - LARGURA EXPANDIDA JÁ APLICADA NO CONTAINER PAI */}
            <div className={`p-5 rounded-xl shadow-md border-l-4 border-amber-500 space-y-4 ${themeCard}`}>
                <h2 className={`font-black flex items-center text-lg uppercase ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    <i className="fas fa-inbox mr-3 text-amber-500"></i> BANDEJA DE VIAGENS
                </h2>
                
                
                {/* NÍVEL 1: REGIÕES COM DESTAQUE CONDICIONAL */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.keys(REGIONS).map(region => {
                        const regionCount = getRegionCount(region);
                        const hasItems = regionCount > 0;
                        return (
                        <button
                            key={region}
                            onClick={() => { setActiveTrayRegion(region); setActiveTrayCity(null); }}
                            className={`relative overflow-hidden py-6 px-4 rounded-xl text-xs md:text-sm font-black uppercase transition-all flex flex-col items-center justify-center gap-1 hover:brightness-110 border-2
  ${activeTrayRegion === region
    ? `bg-amber-500 text-white border-amber-200
     shadow-[0_18px_22px_-18px_rgba(245,158,11,0.75)]
     ring-1 ring-white/30
     -translate-y-[1px]`
    : isDarkMode
      ? 'bg-[#2D3748] text-gray-100 border-transparent hover:bg-[#4A5568] shadow-md'
      : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 shadow-md'
  }

  ${
    // ✅ SOMBRA FIXA “embaixo” quando tem itens e NÃO está selecionado
    hasItems && activeTrayRegion !== region
      ? (isDarkMode
          ? 'shadow-[0_17px_20px_-19px_rgba(245,158,11,0.60)]'
          : 'shadow-[0_25px_20px_-20px_rgba(245,158,11,0.55)]')
      : ''
  }

  ${
    // ✅ GLOW/NEON no fundo (só no hover) quando tem itens e NÃO está selecionado
    hasItems && activeTrayRegion !== region
      ? `
        before:content-['']
        before:absolute
        before:inset-0
        before:-z-10
        before:rounded-xl
        before:translate-y-2
        before:blur-2xl
        before:opacity-0
        before:transition-opacity
        before:duration-200
        hover:before:opacity-90
        before:bg-amber-400/55
      `
      : ''
  }

  ${hasItems && activeTrayRegion !== region ? 'border-amber-500' : ''}
`}
                              >
                            {region}
                            <span
  className={`text-[10px] px-2 py-0.5 rounded-full shadow-[0_8px_10px_-10px_rgba(0,0,0,0.35)]
    ${activeTrayRegion === region ? 'bg-black/30 text-white' : 'bg-gray-400 text-white'}`}
>
                                {regionCount} Ordens
                            </span>
                        </button>
                    )})}
              </div>

                {/* NÍVEL 2: CIDADES COM AJUSTE DE COR DARK MODE */}
                {activeTrayRegion && (
                    <div className="flex flex-wrap gap-2 pt-2 animate-in slide-in-from-top-2">
                        {REGIONS[activeTrayRegion].map(city => {
                            const count = getCityCount(city);
                            return (
                                <button
                                    key={city}
                                    onClick={() => setActiveTrayCity(city)}
className={`py-2 px-4 rounded-lg text-xs font-bold uppercase transition-all border flex items-center gap-2
  ${activeTrayCity === city
    ? (isDarkMode
      ? `bg-[#ff9f43]/40 text-white border-amber-300/70
         shadow-[0_14px_18px_-14px_rgba(245,158,11,0.65)]
         ring-1 ring-white/20 -translate-y-[1px]`
      : `bg-amber-100 text-amber-900 border-amber-300
         shadow-[0_12px_16px_-14px_rgba(245,158,11,0.30)]
         ring-1 ring-amber-200 -translate-y-[1px]`)
    : (isDarkMode
        ? 'bg-[#1A202C] text-gray-400 border-gray-600 hover:border-amber-500'
        : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300')
  }

  ${
    // ✅ destaque clean quando tem itens e NÃO está selecionado
    count > 0 && activeTrayCity !== city
      ? (isDarkMode
          ? 'border-amber-400/50 shadow-[0_8px_10px_-10px_rgba(245,158,11,0.55)]'
          : 'border-amber-300 shadow-[0_8px_10px_-10px_rgba(245,158,11,0.25)]')
      : ''
  }

  ${
    // ✅ micro lift no hover (bem discreto)
    count > 0 && activeTrayCity !== city
      ? 'hover:-translate-y-[1px] hover:shadow-[0_10px_12px_-12px_rgba(245,158,11,0.45)]'
      : ''
  }
`}
                                >
                                  {/* Indicador de Itens Pendentes, Notificação */}
                                    {count > 0 && activeTrayCity !== city && (
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
                                    )}
                                    {city}
                                    <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded-full shadow-[0_8px_10px_-10px_rgba(0,0,0,0.35)]
                                        ${activeTrayCity === city ? 'bg-black/30 text-white' : 'bg-gray-300 text-gray-600'}`}
                                    >
                                     {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
               </div>

            {/* NÍVEL 3: GRID DE DADOS COM REORDENAÇÃO DRAG & DROP */}
            {activeTrayCity && (
                <div className={`w-full rounded-xl shadow-md overflow-hidden border ${isDarkMode ? 'border-gray-700 bg-[#2D3748]' : 'border-gray-200 bg-white'}`}>
                    <div className="p-4 bg-amber-500 text-white font-black uppercase flex justify-between items-center">
                        <span><i className="fas fa-list mr-2"></i> {activeTrayCity}</span>
                        <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
                            {trayItems.filter(t => t.city === activeTrayCity).length} Itens
                        </span>
                    </div>

                   {/* Titulos da lista de ordens na bandeja */}
<div className="overflow-x-auto">
  <table className="w-full table-fixed text-left border-collapse min-w-[1406px]">

    <colgroup>
      {TRAY_COLS.map((c) => (
        <col key={c.key} className={c.className} />
      ))}
    </colgroup>

    <thead>
      <tr className={`text-[10px] uppercase font-black tracking-wider ${isDarkMode ? 'bg-[#1A202C] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
        <th className="p-3 border-b border-gray-600">Data</th>
        <th className="p-3 border-b border-gray-600">Nome / Razão Social</th>
        <th className="p-3 border-b border-gray-600">Status</th>
        <th className="p-3 border-b border-gray-600">Equipamento</th>
        <th className="p-3 border-b border-gray-600">Observação</th>
        <th className="p-3 border-b border-gray-600">Atendente</th>
        <th className="p-3 border-b border-gray-600 text-center">Ações</th>
      </tr>
    </thead>


                            <tbody>
                                {trayItems.filter(t => t.city === activeTrayCity).map((item, index, arr) => (
                               <tr
  key={item.id}
  draggable
  onDragStart={(e) => handleDragStart(e, item.id)}
  onDragEnter={() => handleDragEnterRow(item.id)}
  onDragLeave={(e) => handleDragLeaveRow(e, item.id)}
  onDragOver={(e) => handleDragOver(e, item.id)}
  onDrop={(e) => handleDrop(e, item.id)}
  onDragEnd={handleDragEnd}
  style={
    dragOverId === item.id && dropPosition
      ? {
          boxShadow:
            dropPosition === 'above'
              ? 'inset 0 2px 0 rgba(245,158,11,0.95)'
              : 'inset 0 -2px 0 rgba(245,158,11,0.95)',
        }
      : undefined
  }
                                            className={`
                                                         group border-b transition-colors
                                         ${draggedItemId === item.id ? 'opacity-50' : ''}
                                         ${index % 2 === 1
                                         ? (isDarkMode ? 'bg-white/[0.025]' : 'bg-gray-50/40')
                                           : ''
                                          }
                                        ${isDarkMode ? 'border-gray-700 hover:bg-white/[0.06]' : 'border-gray-100 hover:bg-gray-100'}
                                        `}
                                        >
                                        
<td className="relative p-2 pl-4 align-middle whitespace-nowrap">
  {/* Barra lateral da linha (hover/drag) */}
  <span
    className={`
      absolute left-0 top-0 bottom-0 w-[3px] rounded-r transition-colors
      ${dragOverId === item.id ? 'bg-amber-400/90' : 'bg-transparent group-hover:bg-amber-400/70'}
    `}
  />

  {/* Wrapper do date: mantém o ícone alinhado sem “quebrar” a coluna */}
  <div className="relative w-[148px] sm:w-[140px]">
    <input
      type="date"
      value={item.date}
      onChange={(e) => updateTrayField(item.id, "date", e.target.value)}
      onClick={(e) => (e.currentTarget as any).showPicker?.()} // Chrome: abre o calendário ao clicar no input
      className={`
        w-full h-9 px-3 pr-9 rounded-md text-xs font-black
        outline-none focus:ring-1 focus:ring-amber-400
        text-left tabular-nums tracking-normal
        ${
          isDarkMode
            ? 'bg-white/5 text-white border border-white/10'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }

        /*
          IMPORTANTE:
          - NÃO use tracking-wide em input[type=date], pois o Chrome pode “rolar”
            o texto interno ao trocar a data e cortar o primeiro dígito.
          - O tracking-normal + tabular-nums estabiliza a renderização.
        */

        /* Esconde o ícone nativo (mantém o picker funcionando ao clicar no input) */
        [&::-webkit-calendar-picker-indicator]:opacity-0
        [&::-webkit-calendar-picker-indicator]:cursor-pointer
      `}
    />

    {/* Ícone “nosso” (sempre visível e clicável) Calendário */}
    <button
      type="button"
      onClick={(e) => {
        const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
        input?.focus();
        (input as any)?.showPicker?.(); // Chrome
      }}
      className={`
        absolute right-2 top-1/2 -translate-y-1/2
        p-0.5 rounded transition
        ${
          isDarkMode
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
        }
      `}
      title="Selecionar data"
      aria-label="Selecionar data"
    >
      <i className="far fa-calendar-alt" />
    </button>
  </div>
</td>

                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                value={item.clientName} 
                                                placeholder="Nome do Cliente"
                                                onChange={(e) => updateTrayField(item.id, "clientName", e.target.value)}
                                                className={`w-full p-2 rounded border text-xs font-bold uppercase focus:ring-1 focus:ring-amber-400 outline-none ${themeInput}`}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={item.status} 
                                                onChange={(e) => updateTrayField(item.id, "status", e.target.value)}
                                                className={`w-full p-2 rounded border text-[10px] font-bold uppercase focus:ring-1 focus:ring-amber-400 outline-none ${themeInput}`}
                                            >
                                                {TRAY_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className={isDarkMode ? 'bg-[#4A5568]' : ''}>{opt || "Selecione..."}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={item.equipment} 
                                                onChange={(e) => updateTrayField(item.id, "equipment", e.target.value)}
                                                className={`w-full p-2 rounded border text-[10px] font-bold uppercase focus:ring-1 focus:ring-amber-400 outline-none ${themeInput}`}
                                            >
                                                {TRAY_EQUIPMENT_OPTIONS.map(opt => <option key={opt} value={opt} className={isDarkMode ? 'bg-[#4A5568]' : ''}>{opt || "Nenhum"}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                value={item.observation} 
                                                placeholder="Obs..."
                                                onChange={(e) => updateTrayField(item.id, "observation", e.target.value)}
                                                className={`w-full p-2 rounded border text-xs font-medium focus:ring-1 focus:ring-amber-400 outline-none ${themeInput}`}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={item.attendant} 
                                                onChange={(e) => updateTrayField(item.id, "attendant", e.target.value)}
                                                className={`w-full p-2 rounded border text-[10px] font-bold uppercase focus:ring-1 focus:ring-amber-400 outline-none ${themeInput}`}
                                            >
                                                {ATTENDANTS.map(opt => <option key={opt} value={opt} className={isDarkMode ? 'bg-[#4A5568]' : ''}>{opt || "Selecione"}</option>)}
                                            </select>
                                        </td>
                                        {/* Ícone exclusivo para Arraste */}
                                        <td className="p-2 text-center align-middle">
                                         <div className={`inline-flex items-center justify-center gap-2 rounded-md px-2 py-1
                                              ${isDarkMode ? 'bg-white/0 group-hover:bg-white/5' : 'bg-transparent group-hover:bg-black/5'}
                                                            transition-colors
                                          `}>
                                        <div
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item.id)}
                                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-amber-500 p-2 drag-handle"
                                            title="Arrastar para reordenar"
                                            >
                                         <i className="fas fa-grip-vertical"></i>
                                         </div>

                                         <button
                                          onClick={() => deleteTrayItem(item.id)}
                                          className="text-red-400 hover:text-red-600 transition-colors p-2"
                                          title="Remover"
                                            >
                                        <i className="fas fa-trash"></i>
                                            </button>
                                           </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                                          <button
                                          type="button"
                                         onClick={addTrayRow}
                                        className={`w-full py-3 text-center text-xs font-black uppercase hover:bg-amber-50 transition-colors border-t border-dashed ${isDarkMode ? 'border-gray-600 hover:bg-[#4A5568] text-amber-400' : 'border-gray-200 text-amber-600'}`}
                                          >
                                      <i className="fas fa-plus mr-1"></i> Adicionar Nova Linha
                                    </button>
                    </div>
                </div>
            )}
          </div>
        ) : (

 <div className="space-y-6 animate-in fade-in duration-300">
            <div className={`flex flex-col gap-4 border-b-2 pb-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-black uppercase flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}><i className="fas fa-history text-blue-600"></i> Histórico de Viagens</h2>
                {/* O length é correto, pois 'history' agora vem do Firestore */}
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{history.length} SALVAS</span> 
              </div>
                
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                    <input 
                    type="text" 
                    placeholder="Buscar por nome, cidade ou data..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none text-sm font-bold uppercase ${themeInput}`}
                    />
                    <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                </div>
                <div>
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as 'all' | 'open' | 'finalized')}
                    className={`w-full py-3 px-4 rounded-lg border outline-none text-sm font-bold uppercase ${themeInput}`}
                  >
                    <option value="all" className={isDarkMode ? 'bg-[#4A5568] text-white' : ''}>Todas as Viagens</option>
                    <option value="open" className={isDarkMode ? 'bg-[#4A5568] text-white' : ''}>Abertas (Pendentes)</option>
                    <option value="finalized" className={isDarkMode ? 'bg-[#4A5568] text-white' : ''}>Finalizadas (Fechadas)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 🛑 AQUI ESTÁ O MAP QUE VOCÊ QUERIA */}
            {filteredHistory.length === 0 ? (
              <div className={`text-center py-20 rounded-xl shadow-sm border border-dashed ${isDarkMode ? 'bg-[#2D3748] border-gray-600' : 'bg-white border-gray-300'}`}>
                <i className="fas fa-folder-open text-5xl text-gray-200 mb-4"></i>
                <p className="text-gray-400 font-bold uppercase text-xs">Nenhuma viagem encontrada.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {currentHistoryPage.map((viagem) => {
                    const isFinalized = viagem.feedbacks && viagem.feedbacks.length > 0;
                    const statusColor = isFinalized ? 'border-green-500 dark:border-green-500' // FINALIZADA (Verde)
                                                   : 'border-amber-500 dark:border-amber-500'; // ABERTA (Âmbar/Laranja)
                    const isEditing = editingTripId === viagem.id;
                      
                    const teamMembers = [viagem.state.technician, viagem.state.assistant].filter(Boolean);
                    const teamDisplay = listaComE(teamMembers) || "EQUIPE NÃO INFORMADA";
                    const citiesDisplay = viagem.state.cities.filter(c => c.enabled && c.name).map(c => c.name).join(', ') || "Sem Cidade";
                      
                    const displayTitle = `${formatarData(viagem.state.date)} - ${viagem.state.startTime} - ${teamDisplay} (${citiesDisplay})`;

                    return (
                      <div key={viagem.id} className={`p-5 rounded-xl shadow-md border border-l-8 ${statusColor} ${isEditing ? 'ring-2 ring-blue-500' : ''} flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-lg hover:border-blue-100 group ${isDarkMode ? 'bg-[#2D3748] border-gray-600' : 'bg-white border-gray-100'}`}>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isFinalized ? (
                              <span className="text-[10px] font-black text-white bg-green-500 px-2 py-0.5 rounded uppercase tracking-wider">Finalizada</span>
                            ) : (
                              <span className="text-[10px] font-black text-white bg-amber-500 px-2 py-0.5 rounded uppercase tracking-wider">Aberta</span>
                            )}
                            {isEditing && (
                               <span className="text-[10px] font-black text-blue-800 bg-blue-200 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Editando Agora</span>
                            )}
                          </div>
                          <h3 className={`font-black text-base group-hover:text-blue-700 transition-colors uppercase ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{displayTitle}</h3>
                          <p className="text-xs text-gray-500 font-medium italic">{viagem.state.services.join(', ') || 'Sem serviços definidos'}</p>
                        </div>
                            
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => carregarViagem(viagem)} className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2">
                            <i className="fas fa-edit"></i> Editar
                          </button>
                            
                      {/* Apenas mostra o botão RELATÓRIO se a viagem estiver finalizada */}
                           {isFinalized ? (
                          <button onClick={() => setRelatorioViagem(viagem)} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2">
                           <i className="fas fa-file-alt"></i> Relatório
                          </button>
                           ) : (
                         // Se não estiver finalizada (ABERTA), não renderiza NADA (remove o botão 'Concluir')
                         null 
                           )}

                          <button onClick={() => viagem.id && excluirViagem(viagem.id)} className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'} ${isDarkMode ? 'bg-[#2D3748] text-white border border-gray-600' : 'bg-white border border-gray-200 text-gray-600'}`}
                    >
                      <i className="fas fa-chevron-left"></i> Anterior
                    </button>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'} ${isDarkMode ? 'bg-[#2D3748] text-white border border-gray-600' : 'bg-white border border-gray-200 text-gray-600'}`}
                    >
                      Próximo <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
    )} {/* Fecha a condição ternária do activeTab */}


        <footer className="text-center py-10 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-t">
          &copy; {new Date().getFullYear()} Programação de Viagem &bull; Eficiência Técnica &bull; feito por Alisson Silva
        </footer>
      </div>
      
      {/* Botão Flutuante de Dark Mode */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl bg-blue-600 text-white hover:bg-blue-700 transition-all border-4 border-blue-800 flex items-center justify-center"
        title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
      >
        <i className={`fas ${isDarkMode ? 'fa-sun text-yellow-300' : 'fa-moon text-blue-100'} text-xl`}></i>
      </button>
    </div>
  );
};

interface MaterialSelectorProps {
  options: string[];
  value: string;
  qty: number;
  onModelChange: (val: string) => void;
  onQtyChange: (val: number) => void;
  isDarkMode: boolean;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({ 
  options, value, qty, onModelChange, onQtyChange, isDarkMode 
}) => (
  <div className={`flex items-center gap-2 p-1 rounded-lg border shadow-sm ${isDarkMode ? 'bg-[#2D3748] border-gray-600' : 'bg-white border-gray-100'}`}>
    <select 
      value={value} 
      onChange={e => onModelChange(e.target.value)}
      className={`rounded border-none bg-transparent font-bold text-[10px] focus:ring-0 cursor-pointer min-w-[120px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
    >
      {options.map(opt => <option key={opt} value={opt} className={isDarkMode ? 'bg-[#4A5568] text-white' : ''}>{opt || "Selecione..."}</option>)}
    </select>
    <div className={`h-4 w-[1px] ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
    <div className="flex items-center gap-1">
      <button 
        onClick={() => onQtyChange(Math.max(0, qty - 1))}
        className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${isDarkMode ? 'bg-[#4A5568] hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
      >-</button>
      <input 
        type="text" 
        inputMode="numeric"
        value={qty === 0 ? '' : qty} 
        placeholder="0"
        onChange={e => {
          const valStr = e.target.value.replace(/\D/g, '');
          const val = valStr === '' ? 0 : parseInt(valStr);
          onQtyChange(isNaN(val) ? 0 : Math.max(0, val));
        }}
        className="w-8 bg-transparent font-black text-[10px] text-blue-600 text-center focus:ring-0 placeholder-gray-300 outline-none"
      />
      <button 
        onClick={() => onQtyChange(qty + 1)}
        className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${isDarkMode ? 'bg-[#4A5568] hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
      >+</button>
    </div>
  </div>
);

interface NumericStepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  isDarkMode: boolean;
}

const NumericStepper: React.FC<NumericStepperProps> = ({ label, value, onChange, isDarkMode }) => (
  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1A202C] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">{label}</label>
    <div className="flex items-center justify-between">
      <button 
        onClick={() => onChange(Math.max(0, value - 1))}
        className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-colors shadow-sm ${isDarkMode ? 'bg-[#2D3748] border-gray-600 hover:border-orange-500 text-gray-400' : 'bg-white border-gray-200 hover:border-orange-200 text-gray-400 hover:text-orange-500'}`}
      >
        <i className="fas fa-minus text-[10px]"></i>
      </button>
      <input 
        type="text" 
        inputMode="numeric"
        value={value || ''} 
        placeholder="0" 
        onChange={e => {
          const valStr = e.target.value.replace(/\D/g, '');
          onChange(parseInt(valStr) || 0);
        }}
        className={`w-12 bg-transparent font-black text-center focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
      />
      <button 
        onClick={() => onChange(value + 1)}
        className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-colors shadow-sm ${isDarkMode ? 'bg-[#2D3748] border-gray-600 hover:border-orange-500 text-gray-400' : 'bg-white border-gray-200 hover:border-orange-200 text-gray-400 hover:text-orange-500'}`}
      >
        <i className="fas fa-plus text-[10px]"></i>
      </button>
    </div>
  </div>
);

export default App;