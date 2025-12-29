
import React, { useState, useEffect } from 'react';
import { 
  TECHNICIANS, 
  ASSISTANTS, 
  SERVICES_OPTIONS, 
  ONU_MODELS, 
  ONT_MODELS, 
  ROUTER_MODELS, 
  LUNCH_OPTIONS,
  INITIAL_STATE 
} from './constants';
import { AppState, EncerramentoFeedback, SavedTrip, FeedbackStatus } from './types';
import { formatarData, getDiaSemana, listaComE, pad } from './utils';

// Lista de atendentes autorizados para o fechamento
const ATTENDANTS = ['', 'Alisson', 'Welvister', 'Uriel', 'Pedro', 'João', 'Willians', 'Keven', 'Amile'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [history, setHistory] = useState<SavedTrip[]>([]);
  
  // Estado para controlar se estamos editando uma viagem existente
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Buffer local para evitar cursor saltando e perda de espaços/quebras de linha
  const [localText, setLocalText] = useState<Record<string, string>>({});

  const [servicesOpen, setServicesOpen] = useState(false);
  const [cityAccordions, setCityAccordions] = useState<boolean[]>([false, false, false, false]);
  const [output, setOutput] = useState("");
  const [encerramentoOutput, setEncerramentoOutput] = useState("");
  const [feedback, setFeedback] = useState<EncerramentoFeedback[]>([]);
  const [isEncerramentoVisible, setIsEncerramentoVisible] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const savedDraft = localStorage.getItem('prog_viagem_draft');
    if (savedDraft) {
      try { setState(JSON.parse(savedDraft)); } catch (e) { console.error(e); }
    }
    const savedHistory = localStorage.getItem('prog_viagem_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
  }, []);

  // Salvar rascunho automaticamente
  useEffect(() => {
    localStorage.setItem('prog_viagem_draft', JSON.stringify(state));
  }, [state]);

  // Salvar histórico
  useEffect(() => {
    localStorage.setItem('prog_viagem_history', JSON.stringify(history));
  }, [history]);

  // --- FUNÇÕES DE ESTADO ---

  const resetForm = () => {
    if (confirm("Deseja iniciar uma nova programação? Todos os dados não salvos do formulário atual serão perdidos.")) {
      setState(INITIAL_STATE);
      setLocalText({});
      setEditingTripId(null);
      setOutput("");
      setEncerramentoOutput("");
      setFeedback([]);
      setIsEncerramentoVisible(false);
      setActiveTab('form');
      setServicesOpen(false);
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

  const updateCity = (index: number, updates: Partial<AppState['cities'][0]>) => {
    setState(prev => {
      const newCities = [...prev.cities];
      newCities[index] = { ...newCities[index], ...updates };
      return { ...prev, cities: newCities };
    });
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

  // --- LÓGICA DE VIAGEM (SALVAR, CARREGAR, EDITAR) ---

  const salvarViagem = (customFeedback?: EncerramentoFeedback[]) => {
    const nomesCidades = state.cities.filter(c => c.enabled && c.name).map(c => c.name).join(', ');
    const teamMembers = [state.technician, state.assistant].filter(Boolean);
    const teamString = listaComE(teamMembers) || "Equipe";
    
    // Usa o feedback passado por parâmetro (para o caso de finalização) ou o estado atual
    const feedbacksToSave = customFeedback !== undefined ? customFeedback : (feedback.length > 0 ? feedback : undefined);

    const tripData: SavedTrip = {
      id: editingTripId || crypto.randomUUID(), // Se editando, mantém ID. Se novo, cria ID.
      title: `${formatarData(state.date)} - ${state.startTime} - ${teamString} (${nomesCidades || 'Sem Cidade'})`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
      feedbacks: feedbacksToSave
    };
    
    if (editingTripId) {
      // ATUALIZAR EXISTENTE
      setHistory(prev => prev.map(t => t.id === editingTripId ? tripData : t));
    } else {
      // CRIAR NOVA
      setHistory(prev => [tripData, ...prev]);
      setEditingTripId(tripData.id); // Entra em modo de edição da nova viagem automaticamente
    }

    return tripData.id;
  };

  const handleManualSave = () => {
    salvarViagem();
    alert(editingTripId ? "Alterações salvas com sucesso!" : "Nova viagem salva no histórico!");
  };

  const excluirViagem = (id: string) => {
    if (confirm("Deseja realmente excluir esta viagem do histórico?")) {
      setHistory(prev => prev.filter(v => v.id !== id));
      if (editingTripId === id) {
        resetForm(); // Se excluiu a que estava editando, reseta
      }
    }
  };

  const carregarViagem = (viagem: SavedTrip) => {
    // Carregar os dados nos inputs
    setState(viagem.state);
    setLocalText({});
    setFeedback(viagem.feedbacks || []);
    
    // Configurar modo de edição
    setEditingTripId(viagem.id);
    setActiveTab('form');
    
    // Configurar visualização de encerramento se houver feedback
    setIsEncerramentoVisible(!!(viagem.feedbacks && viagem.feedbacks.length > 0));
    
    // Limpar outputs anteriores para evitar confusão
    setOutput("");
    setEncerramentoOutput("");
    
    alert(`Carregando viagem: ${viagem.title}`);
  };

  const carregarParaEncerramento = (viagem: SavedTrip) => {
    carregarViagem(viagem);
    iniciarEncerramento(); 
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const concluirViagemHistorico = (viagem: SavedTrip) => {
    if (confirm("Deseja concluir esta viagem automaticamente? Isso marcará todos os atendimentos como REALIZADOS.")) {
      const newFeedback: EncerramentoFeedback[] = [];
      viagem.state.cities.forEach(city => {
        if (city.enabled && city.name) {
          city.clients.forEach((cl, clIdx) => {
            if (cl.name && cl.name.trim() !== "") {
              newFeedback.push({
                clientId: `${city.name}-${clIdx}`,
                status: 'REALIZADO',
                attendantName: ""
              });
            }
          });
        }
      });

      setHistory(prev => prev.map(v => 
        v.id === viagem.id ? { ...v, feedbacks: newFeedback } : v
      ));
    }
  };

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
    state.cities.forEach(city => {
      if (city.enabled && city.name) {
        city.clients.forEach((cl, clIdx) => {
          if (cl.name && cl.name.trim() !== "") {
            newFeedback.push({
              clientId: `${city.name}-${clIdx}`,
              status: 'REALIZADO',
              attendantName: ""
            });
          }
        });
      }
    });
    setFeedback(newFeedback);
    setIsEncerramentoVisible(true);
  };

  const finalizarEGerarRelatorio = () => {
    // 1. Gera o Texto
    const diaSemana = getDiaSemana(state.date);
    const dataFormatada = formatarData(state.date);
    const cidadesHabilitadas = state.cities.filter(c => c.enabled && c.name);
    const nomesCidades = cidadesHabilitadas.map(c => c.name);

    let text = `FECHAMENTO DA VIAGEM - ${diaSemana} (${dataFormatada})\n`;
    text += `----------------------------------------------------------------------------\n`;
    const teamMembers = [state.technician, state.assistant].filter(Boolean);
    text += `🔧 EQUIPE: ${listaComE(teamMembers) || "NÃO INFORMADA"}\n`;
    text += `📍 DESIGNAÇÃO: ${listaComE(nomesCidades) || "A DEFINIR"} – ${listaComE([...state.services]) || "A DEFINIR"}\n`;
    text += `🕗 INÍCIO: ${state.startTime}\n\n`;

    cidadesHabilitadas.forEach((city) => {
      text += `----------------------------------------------------------------------------\n`;
      text += `CIDADE: ${city.name.toUpperCase()}\n`;
      text += `----------------------------------------------------------------------------\n`;
      text += `ATENDIMENTOS AGENDADOS:\n`;

      const filledClients = city.clients.filter(cl => cl.name && cl.name.trim() !== "");
      filledClients.forEach((cl, clIdx) => {
        const fb = feedback.find(f => f.clientId === `${city.name}-${clIdx}`);
        const statusReport = fb?.status === 'NAO_REALIZADO' ? 'NAO REALIZADO' : fb?.status;
        text += `${clIdx + 1}. ${cl.name.trim().toUpperCase()}${cl.status && cl.status.trim() ? ` - ${cl.status.trim().toUpperCase()}` : ""} (${statusReport})\n`;
        if (fb?.status === 'REALIZADO') {
          text += `*O.S NA MESA DE: ${fb.attendantName || ""}\n`;
        } else {
          text += `*O.S RETORNOU A BANDEJA\n`;
        }
      });
      text += `\n`;
    });
    
    // 2. Salva no Histórico como Finalizada (com feedbacks)
    salvarViagem(feedback);
    
    // 3. Reseta o formulário (Estado Limpo), mas mostra o resultado
    setState(INITIAL_STATE);
    setLocalText({});
    setEditingTripId(null); // Sai do modo de edição
    setFeedback([]); // Limpa feedbacks locais pois salvamos no histórico
    
    // Restaura a visualização apenas do output
    setEncerramentoOutput(text.trim());
    setIsEncerramentoVisible(true); // Mantém a modal visível para ver o texto
    
    alert("Viagem finalizada, salva no histórico e formulário resetado!");
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 no-print text-gray-900 font-sans">
      <header 
        onClick={resetForm}
        className="text-center py-6 bg-blue-700 text-white rounded-xl shadow-lg border-b-4 border-blue-900 cursor-pointer hover:bg-blue-800 transition-colors group relative"
        title="Clique para iniciar uma Nova Programação (Limpar tudo)"
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-blue-800 text-xs font-bold px-2 py-1 rounded">
          NOVA PROGRAMAÇÃO <i className="fas fa-redo ml-1"></i>
        </div>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">Programação de Viagem</h1>
        <p className="text-blue-200 text-sm mt-1 font-medium">abertura e fechamento de programações</p>
        {editingTripId && (
          <div className="mt-2 inline-block bg-amber-400 text-blue-900 px-3 py-1 rounded-full text-xs font-black uppercase animate-pulse">
            <i className="fas fa-edit mr-1"></i> Editando Viagem
          </div>
        )}
      </header>

      <nav className="flex bg-white p-1 rounded-lg shadow-inner border">
        <button 
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'form' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <i className="fas fa-edit"></i> {editingTripId ? 'Editando Programação' : 'Nova Programação'}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <i className="fas fa-history"></i> Histórico ({history.length})
        </button>
      </nav>

      {activeTab === 'form' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Dados Gerais */}
          <section className="bg-white p-5 rounded-xl shadow-md border-l-8 border-blue-500 space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center text-lg"><i className="fas fa-info-circle mr-3 text-blue-500"></i> DADOS DA EQUIPE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data da Viagem</label>
                <input type="date" value={state.date} onChange={e => updateState('date', e.target.value)} className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 border font-medium outline-none focus:ring-2 focus:ring-blue-100"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horário de Saída</label>
                <input type="time" value={state.startTime} onChange={e => updateState('startTime', e.target.value)} className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 border font-medium outline-none focus:ring-2 focus:ring-blue-100"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Técnico Responsável</label>
                <select value={state.technician} onChange={e => updateState('technician', e.target.value)} className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 border font-medium outline-none focus:ring-2 focus:ring-blue-100">
                  {TECHNICIANS.map(t => <option key={t} value={t}>{t || "Selecione..."}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Auxiliar / Acompanhante</label>
                <select value={state.assistant} onChange={e => updateState('assistant', e.target.value)} className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 border font-medium outline-none focus:ring-2 focus:ring-blue-100">
                  {ASSISTANTS.map(a => <option key={a} value={a}>{a || "Selecione..."}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Serviços */}
          <section className="bg-white rounded-xl shadow-md overflow-hidden border-l-8 border-emerald-500">
            <button onClick={() => setServicesOpen(!servicesOpen)} className="w-full text-left p-5 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-all">
              <span className="font-bold text-gray-800 flex items-center text-lg"><i className="fas fa-tools mr-3 text-emerald-500"></i> Serviços agendados ({state.services.length})</span>
              <i className={`fas fa-chevron-${servicesOpen ? 'up' : 'down'} text-gray-400`}></i>
            </button>
            {servicesOpen && (
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white">
                {SERVICES_OPTIONS.map(service => (
                  <label key={service} className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${state.services.includes(service) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
                    <input type="checkbox" checked={state.services.includes(service)} onChange={() => handleServiceToggle(service)} className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5"/>
                    <span className="text-sm font-bold text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Lista de Materiais com BOTÕES DE INCREMENTO */}
          <section className="bg-white p-5 rounded-xl shadow-md border-l-8 border-orange-500 space-y-6">
            <h2 className="font-bold text-gray-800 flex items-center text-lg"><i className="fas fa-box-open mr-3 text-orange-500"></i> LISTA DE MATERIAIS</h2>
            
            <div className="space-y-5">
              {([['onus', 'ONU', ONU_MODELS], ['onts', 'ONT', ONT_MODELS], ['routers', 'ROTEADOR', ROUTER_MODELS]] as const).map(([type, label, models]) => (
                <div key={type} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}(S)</label>
                    <button onClick={() => addMaterialField(type)} className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-xs">
                      <i className="fas fa-plus-circle"></i> ADICIONAR
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {state.materials[type].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm w-full sm:w-auto">
                        <MaterialSelector 
                          options={models} 
                          value={item.model} 
                          qty={item.qty} 
                          onModelChange={(val) => updateNestedMaterial(type, idx, { model: val })}
                          onQtyChange={(val) => updateNestedMaterial(type, idx, { qty: val })}
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
                />
                <NumericStepper 
                  label="CONECTOR UPC" 
                  value={state.materials.connectorUpc} 
                  onChange={v => updateMaterials({ connectorUpc: v })}
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border flex flex-col justify-center">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">ALMOÇO</label>
                <select value={state.materials.lunch} onChange={e => updateMaterials({ lunch: e.target.value })} className="w-full bg-transparent font-bold text-gray-800 focus:outline-none">
                  {LUNCH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || "Selecione..."}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={state.materials.key} onChange={e => updateMaterials({ key: e.target.checked })} className="rounded text-orange-600 h-5 w-5"/>
                <span className="text-xs font-bold text-gray-600 uppercase group-hover:text-orange-600">Chave da Loja</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={state.materials.fuelNote} onChange={e => updateMaterials({ fuelNote: e.target.checked })} className="rounded text-orange-600 h-5 w-5"/>
                <span className="text-xs font-bold text-gray-600 uppercase group-hover:text-orange-600">Nota Abastecimento</span>
              </label>
            </div>
            
            <textarea 
              value={localText['materials-note'] !== undefined ? localText['materials-note'] : state.materials.note} 
              onChange={e => handleNoteUpdate(e.target.value)} 
              placeholder="Observações adicionais sobre materiais..." 
              spellCheck={false}
              style={{ whiteSpace: 'pre-wrap' }}
              className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm font-medium h-24 outline-none focus:ring-2 focus:ring-orange-100"
            />
          </section>

          <section className="space-y-4">
            {state.cities.map((city, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md border-l-8 border-indigo-500 overflow-hidden">
                <div className="p-4 flex items-center bg-gray-50 gap-4">
                  <input type="checkbox" checked={city.enabled} onChange={e => updateCity(idx, { enabled: e.target.checked })} className="h-6 w-6 text-indigo-600 rounded-md border-gray-300"/>
                  <div className="flex-1">
                    <input type="text" placeholder={`Cidade ${idx + 1}`} value={city.name} onChange={e => updateCity(idx, { name: e.target.value })} disabled={!city.enabled} className={`w-full bg-transparent border-b-2 font-black text-lg focus:outline-none ${city.enabled ? 'border-indigo-200 focus:border-indigo-600 text-gray-800' : 'border-transparent text-gray-300'}`}/>
                  </div>
                  <button onClick={() => { const n = [...cityAccordions]; n[idx] = !n[idx]; setCityAccordions(n); }} disabled={!city.enabled} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                    <i className={`fas fa-chevron-${cityAccordions[idx] ? 'up' : 'down'}`}></i>
                  </button>
                </div>
                {city.enabled && cityAccordions[idx] && (
                  <div className="p-5 space-y-4 bg-white animate-in slide-in-from-top-2">
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
                          className="w-full h-48 p-3 border rounded-lg text-sm bg-gray-50 font-mono text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
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
                          className="w-full h-48 p-3 border rounded-lg text-sm bg-gray-50 font-mono text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
                            <div key={clientKey} className="bg-white p-5 rounded-xl shadow-sm border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-indigo-200">
                              <div className="flex flex-col">
                                <span className="font-black text-gray-800 text-base">{cl.name.trim().toUpperCase()}</span>
                                <span className="text-gray-400 text-xs font-bold uppercase">{cl.status.trim()}</span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
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
                                        onClick={() => setFeedback(prev => prev.map(f => f.clientId === clientKey ? { ...f, status: s } : f))}
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
                                    className="p-3 border rounded-lg text-sm bg-indigo-50 font-bold focus:ring-2 focus:ring-indigo-300 outline-none w-full md:w-48 text-gray-800"
                                  >
                                    <option value="">Atendente...</option>
                                    {ATTENDANTS.filter(n => n).map(name => (
                                      <option key={name} value={name}>{name}</option>
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
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
            <h2 className="text-xl font-black text-gray-800 uppercase flex items-center gap-2"><i className="fas fa-history text-blue-600"></i> Histórico de Viagens</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{history.length} SALVAS</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
              <i className="fas fa-folder-open text-5xl text-gray-200 mb-4"></i>
              <p className="text-gray-400 font-bold uppercase text-xs">Nenhuma viagem arquivada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.map((viagem) => {
                const isFinalized = viagem.feedbacks && viagem.feedbacks.length > 0;
                const statusColor = isFinalized ? 'border-green-500' : 'border-amber-500';
                const isEditing = editingTripId === viagem.id;
                
                const teamMembers = [viagem.state.technician, viagem.state.assistant].filter(Boolean);
                const teamDisplay = listaComE(teamMembers) || "EQUIPE NÃO INFORMADA";
                const citiesDisplay = viagem.state.cities.filter(c => c.enabled && c.name).map(c => c.name).join(', ') || "Sem Cidade";
                
                const displayTitle = `${formatarData(viagem.state.date)} - ${viagem.state.startTime} - ${teamDisplay} (${citiesDisplay})`;

                return (
                  <div key={viagem.id} className={`bg-white p-5 rounded-xl shadow-md border border-gray-100 border-l-8 ${statusColor} ${isEditing ? 'ring-2 ring-blue-500 bg-blue-50' : ''} flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-lg hover:border-blue-100 group`}>
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
                      <h3 className="font-black text-gray-800 text-base group-hover:text-blue-700 transition-colors uppercase">{displayTitle}</h3>
                      <p className="text-xs text-gray-500 font-medium italic">{viagem.state.services.join(', ') || 'Sem serviços definidos'}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => carregarViagem(viagem)} className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2">
                        <i className="fas fa-edit"></i> Editar
                      </button>
                      
                      {isFinalized ? (
                        <button onClick={() => carregarParaEncerramento(viagem)} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2">
                          <i className="fas fa-file-alt"></i> Relatório
                        </button>
                      ) : (
                        <button onClick={() => concluirViagemHistorico(viagem)} className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2">
                          <i className="fas fa-check-double"></i> Concluir
                        </button>
                      )}

                      <button onClick={() => excluirViagem(viagem.id)} className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <footer className="text-center py-10 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-t">
        &copy; {new Date().getFullYear()} Programação de Viagem &bull; Eficiência Técnica &bull; feito por Alisson Silva
      </footer>
    </div>
  );
};

interface MaterialSelectorProps {
  options: string[];
  value: string;
  qty: number;
  onModelChange: (val: string) => void;
  onQtyChange: (val: number) => void;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({ 
  options, value, qty, onModelChange, onQtyChange 
}) => (
  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
    <select 
      value={value} 
      onChange={e => onModelChange(e.target.value)}
      className="rounded border-none bg-transparent font-bold text-[10px] text-gray-700 focus:ring-0 cursor-pointer min-w-[120px]"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt || "Selecione..."}</option>)}
    </select>
    <div className="h-4 w-[1px] bg-gray-200"></div>
    <div className="flex items-center gap-1">
      <button 
        onClick={() => onQtyChange(Math.max(0, qty - 1))}
        className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold"
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
        className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold"
      >+</button>
    </div>
  </div>
);

interface NumericStepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

const NumericStepper: React.FC<NumericStepperProps> = ({ label, value, onChange }) => (
  <div className="bg-gray-50 p-3 rounded-lg border">
    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">{label}</label>
    <div className="flex items-center justify-between">
      <button 
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 hover:border-orange-200 text-gray-400 hover:text-orange-500 rounded-lg transition-colors shadow-sm"
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
        className="w-12 bg-transparent font-black text-gray-800 text-center focus:outline-none"
      />
      <button 
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 hover:border-orange-200 text-gray-400 hover:text-orange-500 rounded-lg transition-colors shadow-sm"
      >
        <i className="fas fa-plus text-[10px]"></i>
      </button>
    </div>
  </div>
);

export default App;
