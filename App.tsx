
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [history, setHistory] = useState<SavedTrip[]>([]);
  
  // Controle local para inputs de texto permitindo espaços e quebras de linha nativas
  const [localText, setLocalText] = useState<Record<string, string>>({});

  const [servicesOpen, setServicesOpen] = useState(false);
  const [cityAccordions, setCityAccordions] = useState<boolean[]>([false, false, false, false]);
  const [output, setOutput] = useState("");
  const [encerramentoOutput, setEncerramentoOutput] = useState("");
  const [feedback, setFeedback] = useState<EncerramentoFeedback[]>([]);
  const [isEncerramentoVisible, setIsEncerramentoVisible] = useState(false);

  // Carregar do LocalStorage no Início
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

  // Persistência Automática
  useEffect(() => {
    localStorage.setItem('prog_viagem_draft', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('prog_viagem_history', JSON.stringify(history));
  }, [history]);

  const updateState = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const updateMaterials = (updates: Partial<AppState['materials']>) => {
    setState(prev => ({
      ...prev,
      materials: { ...prev.materials, ...updates }
    }));
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
      const newClients = newCities[index].clients.map((cl, i) => ({
        ...cl,
        [type]: lines[i] !== undefined ? lines[i] : ""
      }));
      newCities[index] = { ...newCities[index], clients: newClients };
      return { ...prev, cities: newCities };
    });
  };

  const getTextAreaValue = (index: number, type: 'name' | 'status') => {
    const key = `${index}-${type}`;
    if (localText[key] !== undefined) return localText[key];

    const lines = state.cities[index].clients.map(c => c[type]);
    let lastIndex = -1;
    for (let i = 29; i >= 0; i--) {
      if (lines[i] !== "") {
        lastIndex = i;
        break;
      }
    }
    return lines.slice(0, lastIndex + 1).join('\n');
  };

  const handleServiceToggle = (service: string) => {
    const newServices = state.services.includes(service)
      ? state.services.filter(s => s !== service)
      : [...state.services, service];
    updateState('services', newServices);
  };

  const salvarViagem = () => {
    const nomesCidades = state.cities.filter(c => c.enabled && c.name).map(c => c.name).join(', ');
    const novaViagem: SavedTrip = {
      id: crypto.randomUUID(),
      title: `${formatarData(state.date)} - ${state.technician || 'Equipe'} (${nomesCidades || 'Sem Cidade'})`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state))
    };
    setHistory(prev => [novaViagem, ...prev]);
    alert("Viagem arquivada com sucesso!");
  };

  const excluirViagem = (id: string) => {
    if (confirm("Deseja realmente excluir esta viagem?")) {
      setHistory(prev => prev.filter(v => v.id !== id));
    }
  };

  const carregarViagem = (viagem: SavedTrip) => {
    setState(viagem.state);
    setLocalText({});
    setActiveTab('form');
    setIsEncerramentoVisible(false);
    setOutput("");
    setEncerramentoOutput("");
  };

  const carregarParaEncerramento = (viagem: SavedTrip) => {
    setState(viagem.state);
    setLocalText({});
    setActiveTab('form');
    iniciarEncerramento();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

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
    if (state.materials.note) text += `OBS: ${state.materials.note}\n`;
    text += `\n`;

    cidadesHabilitadas.forEach((city, idx) => {
      text += `----------------------------------------------------------------------------\n`;
      text += `${idx + 1}ª CIDADE: ${city.name.toUpperCase()}\n`;
      text += `----------------------------------------------------------------------------\n`;
      text += `ATENDIMENTOS AGENDADOS:\n`;
      const filledClients = city.clients.filter(cl => cl.name.trim());
      filledClients.forEach((cl, clIdx) => {
        text += `${clIdx + 1}. ${cl.name.trim().toUpperCase()}${cl.status.trim() ? ` - ${cl.status.trim().toUpperCase()}` : ""}\n`;
      });
      text += `\n`;
    });
    setOutput(text.trim());
  };

  const iniciarEncerramento = () => {
    const newFeedback: EncerramentoFeedback[] = [];
    state.cities.forEach(city => {
      if (city.enabled && city.name) {
        city.clients.forEach((cl, clIdx) => {
          if (cl.name.trim()) {
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

  const gerarEncerramento = () => {
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

      const filledClients = city.clients.filter(cl => cl.name.trim());
      filledClients.forEach((cl, clIdx) => {
        const fb = feedback.find(f => f.clientId === `${city.name}-${clIdx}`);
        const statusDisplay = fb?.status === 'NAO_REALIZADO' ? 'NAO REALIZADO' : fb?.status;
        text += `${clIdx + 1}. ${cl.name.trim().toUpperCase()}${cl.status.trim() ? ` - ${cl.status.trim().toUpperCase()}` : ""} (${statusDisplay})\n`;
        if (fb?.status === 'REALIZADO') {
          text += `*O.S NA MESA DE: ${fb.attendantName || ""}\n`;
        } else {
          text += `*O.S RETORNOU A BANDEJA\n`;
        }
      });
      text += `\n`;
    });
    setEncerramentoOutput(text.trim());
  };

  const copiarTexto = (text: string) => {
    navigator.clipboard.writeText(text).then(() => alert("Texto copiado!"));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 no-print text-gray-900 font-sans">
      <header className="text-center py-6 bg-blue-700 text-white rounded-xl shadow-lg border-b-4 border-blue-900">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">Programação de Viagem</h1>
        <p className="text-blue-200 text-sm mt-1 font-medium">abertura e fechamento de programações</p>
      </header>

      <nav className="flex bg-white p-1 rounded-lg shadow-inner border border-gray-200">
        <button onClick={() => setActiveTab('form')} className={`flex-1 py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'form' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
          <i className="fas fa-edit"></i> Programação Atual
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 rounded-md font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
          <i className="fas fa-history"></i> Histórico ({history.length})
        </button>
      </nav>

      {activeTab === 'form' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* DADOS DA EQUIPE */}
          <section className="bg-white p-5 rounded-xl shadow-md border-l-8 border-blue-500 space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center text-lg"><i className="fas fa-info-circle mr-3 text-blue-500"></i> DADOS DA EQUIPE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data</label>
                <input type="date" value={state.date} onChange={e => updateState('date', e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border font-medium bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Horário Saída</label>
                <input type="time" value={state.startTime} onChange={e => updateState('startTime', e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border font-medium bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Técnico</label>
                <select value={state.technician} onChange={e => updateState('technician', e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border font-medium bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none">
                  {TECHNICIANS.map(t => <option key={t} value={t}>{t || "Selecione..."}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Auxiliar</label>
                <select value={state.assistant} onChange={e => updateState('assistant', e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border font-medium bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none">
                  {ASSISTANTS.map(a => <option key={a} value={a}>{a || "Selecione..."}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* SERVIÇOS AGENDADOS */}
          <section className="bg-white p-5 rounded-xl shadow-md border-l-8 border-emerald-500 space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center text-lg"><i className="fas fa-tools mr-3 text-emerald-500"></i> SERVIÇOS AGENDADOS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SERVICES_OPTIONS.map(s => (
                <label key={s} className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${state.services.includes(s) ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                  <input type="checkbox" checked={state.services.includes(s)} onChange={() => handleServiceToggle(s)} className="hidden"/>
                  <span className="text-xs uppercase">{s}</span>
                </label>
              ))}
            </div>
          </section>

          {/* LISTA DE MATERIAIS */}
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
                        <MaterialSelector options={models} value={item.model} qty={item.qty} 
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
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CONECTOR APC</label>
                  <input type="number" min="0" value={state.materials.connectorApc || ''} placeholder="0" onChange={e => updateMaterials({ connectorApc: parseInt(e.target.value) || 0 })} className="w-full bg-transparent font-bold text-gray-800 focus:outline-none"/>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CONECTOR UPC</label>
                  <input type="number" min="0" value={state.materials.connectorUpc || ''} placeholder="0" onChange={e => updateMaterials({ connectorUpc: parseInt(e.target.value) || 0 })} className="w-full bg-transparent font-bold text-gray-800 focus:outline-none"/>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
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
            
            <textarea value={state.materials.note} onChange={e => updateMaterials({ note: e.target.value })} placeholder="Observações adicionais..." className="w-full rounded-lg border-gray-200 bg-gray-50 p-3 text-sm font-medium h-20 outline-none focus:ring-1 focus:ring-orange-200 transition-all"/>
          </section>

          {/* CIDADES E ATENDIMENTOS */}
          <section className="space-y-4">
            {state.cities.map((city, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md border-l-8 border-indigo-500 overflow-hidden">
                <div className="p-4 flex items-center bg-gray-50 gap-4">
                  <input type="checkbox" checked={city.enabled} onChange={e => updateCity(idx, { enabled: e.target.checked })} className="h-5 w-5 rounded border-gray-300 text-indigo-600"/>
                  <input type="text" placeholder={`Cidade ${idx + 1}`} value={city.name} onChange={e => updateCity(idx, { name: e.target.value })} disabled={!city.enabled} className="flex-1 bg-transparent border-b-2 border-indigo-100 font-black text-indigo-900 focus:outline-none focus:border-indigo-600 disabled:opacity-30"/>
                  <button onClick={() => { const n = [...cityAccordions]; n[idx] = !n[idx]; setCityAccordions(n); }} disabled={!city.enabled} className="text-indigo-300 hover:text-indigo-600 p-2"><i className={`fas fa-chevron-${cityAccordions[idx] ? 'up' : 'down'}`}></i></button>
                </div>
                {city.enabled && cityAccordions[idx] && (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div>
                      <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">Nomes (ENTER para nova linha)</label>
                      <textarea value={getTextAreaValue(idx, 'name')} onChange={e => handleBulkUpdate(idx, 'name', e.target.value)} className="w-full h-40 p-3 border rounded-lg text-sm bg-gray-50 font-mono focus:ring-2 focus:ring-indigo-100 outline-none resize-none"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">Status (ENTER para nova linha)</label>
                      <textarea value={getTextAreaValue(idx, 'status')} onChange={e => handleBulkUpdate(idx, 'status', e.target.value)} className="w-full h-40 p-3 border rounded-lg text-sm bg-gray-50 font-mono focus:ring-2 focus:ring-indigo-100 outline-none resize-none"/>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={gerarTexto} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase">
              <i className="fas fa-file-invoice mr-2"></i> Gerar Programação
            </button>
            <button onClick={salvarViagem} className="bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase">
              <i className="fas fa-save mr-2"></i> Salvar na Lista
            </button>
          </div>

          {output && (
            <div className="space-y-2 animate-in slide-in-from-bottom-4">
              <textarea readOnly value={output} className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-xl border-4 border-gray-800 outline-none"/>
              <button onClick={() => copiarTexto(output)} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold uppercase"><i className="fas fa-copy mr-2"></i> Copiar Texto</button>
            </div>
          )}

          {/* ENCERRAMENTO */}
          <div className="pt-10 border-t-4 border-dashed border-gray-200">
            <button onClick={iniciarEncerramento} className="w-full bg-indigo-700 text-white font-black py-4 rounded-xl shadow-xl uppercase tracking-widest text-lg border-b-4 border-indigo-900 active:translate-y-1 transition-all">
              <i className="fas fa-flag-checkered mr-2"></i> Iniciar Encerramento da Viagem
            </button>

            {isEncerramentoVisible && (
              <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-10 pb-10">
                <h2 className="text-2xl font-black text-indigo-900 border-b-2 border-indigo-100 pb-2">FECHAMENTO TÉCNICO</h2>
                {state.cities.filter(c => c.enabled && c.name).map(city => (
                  <div key={city.name} className="space-y-4">
                    <h3 className="font-black text-indigo-500 flex items-center gap-2"><i className="fas fa-map-marker-alt"></i> {city.name.toUpperCase()}</h3>
                    {city.clients.filter(cl => cl.name.trim()).map((cl, clIdx) => {
                      const key = `${city.name}-${clIdx}`;
                      const fb = feedback.find(f => f.clientId === key);
                      return (
                        <div key={key} className="bg-white p-4 rounded-xl border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-black text-gray-800 text-base">{cl.name.trim().toUpperCase()}</p>
                            <p className="text-gray-400 text-xs font-bold uppercase">{cl.status.trim()}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {(['REALIZADO', 'NAO_REALIZADO', 'AUSENTE'] as FeedbackStatus[]).map(s => {
                              const isActive = fb?.status === s;
                              let activeClass = 'bg-gray-100 text-gray-400';
                              if (isActive) {
                                if (s === 'REALIZADO') activeClass = 'bg-blue-600 text-white shadow-md';
                                else if (s === 'NAO_REALIZADO') activeClass = 'bg-red-600 text-white shadow-md';
                                else if (s === 'AUSENTE') activeClass = 'bg-amber-500 text-white shadow-md';
                              }
                              return (
                                <button key={s} onClick={() => setFeedback(prev => prev.map(f => f.clientId === key ? { ...f, status: s } : f))} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeClass}`}>
                                  {s === 'NAO_REALIZADO' ? 'NÃO REALIZADO' : s}
                                </button>
                              );
                            })}
                            {fb?.status === 'REALIZADO' && (
                              <input type="text" placeholder="Nome do Atendente..." value={fb.attendantName} onChange={e => setFeedback(prev => prev.map(f => f.clientId === key ? { ...f, attendantName: e.target.value } : f))} className="p-2 border rounded bg-indigo-50 text-xs font-bold w-full md:w-40 outline-none focus:ring-1 focus:ring-indigo-400"/>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <button onClick={gerarEncerramento} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xl shadow-2xl">Finalizar e Gerar Relatório</button>
                {encerramentoOutput && (
                  <div className="space-y-3 animate-in zoom-in-95">
                    <textarea readOnly value={encerramentoOutput} className="w-full h-80 p-5 font-mono text-sm bg-gray-800 text-indigo-300 rounded-xl border-4 border-indigo-900 outline-none"/>
                    <button onClick={() => copiarTexto(encerramentoOutput)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase shadow-lg"><i className="fas fa-copy mr-2"></i> Copiar Relatório Final</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HISTÓRICO */
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-black text-gray-800 uppercase flex items-center gap-2"><i className="fas fa-history text-blue-600"></i> Viagens Arquivadas</h2>
            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black">{history.length} SALVAS</span>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs italic">Nenhuma viagem no histórico...</div>
          ) : (
            <div className="grid gap-4">
              {history.map(v => (
                <div key={v.id} className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-lg transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{formatarData(v.state.date)}</span>
                    </div>
                    <h3 className="font-black text-gray-800 text-lg group-hover:text-blue-700">{v.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => carregarViagem(v)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-edit mr-1"></i> Carregar</button>
                    <button onClick={() => carregarParaEncerramento(v)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-check-circle mr-1"></i> Encerrar</button>
                    <button onClick={() => excluirViagem(v.id)} className="text-red-300 hover:text-red-600 p-2 transition-colors"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="text-center py-10 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-t border-gray-200">
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

const MaterialSelector: React.FC<MaterialSelectorProps> = ({ options, value, qty, onModelChange, onQtyChange }) => (
  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
    <select value={value} onChange={e => onModelChange(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none cursor-pointer text-gray-700">
      {options.map(o => <option key={o} value={o}>{o || "Selecione..."}</option>)}
    </select>
    <div className="w-[1px] h-3 bg-gray-200 mx-1"></div>
    <input type="number" min="0" value={qty === 0 ? "" : qty} placeholder="0" onChange={e => onQtyChange(parseInt(e.target.value) || 0)} className="w-8 text-center bg-gray-50 text-[10px] font-black text-blue-600 outline-none rounded"/>
  </div>
);

export default App;
