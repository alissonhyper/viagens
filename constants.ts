
export const TECHNICIANS = ["", "Robert", "Wallace", "Paulo Henrique", "Paulo Sergio", "Valdemir"];
export const ASSISTANTS = ["", "Kazury", "Túlio", "Júlio"];

export const ONU_MODELS = [
  "", 
  "ONU FIBERHOME", 
  "ONU FIBERSMART", 
  "ONU TP-LINK", 
  "ONU CIANET", 
  "ONU FAST-WI", 
  "ONU C-DATA"
];

export const ONT_MODELS = [
  "", 
  "ONT FIBERHOME AC1200",
  "ONT FIBERHOME AX3000"
];

export const ROUTER_MODELS = [
  "", 
  "ROTEADOR HUAWEI AX3S", 
  "ROTEADOR INTELBRAS W6-1500", 
  "ROTEADOR FIBERHOME 1500AX", 
  "ROTEADOR GREATEK 1500AX", 
  "ROTEADOR GREATEK 1200AC"
];

export const LUNCH_OPTIONS = [
  "",
  "R$ 25,00 PARA O ALMOÇO",
  "R$ 50,00 PARA O ALMOÇO",
  "R$ 75,00 PARA O ALMOÇO",
  "R$ 100,00 PARA O ALMOÇO"
];

export const SERVICES_OPTIONS = [
  "Instalações",
  "Atendimentos",
  "Entrega de boletos",
  "Infraestrutura"
];

export const INITIAL_STATE = {
  date: new Date().toISOString().split('T')[0],
  startTime: "07:00",
  technician: "",
  assistant: "",
  services: [],
  materials: {
    onus: [{ model: "", qty: 0 }],
    onts: [{ model: "", qty: 0 }],
    routers: [{ model: "", qty: 0 }],
    connectorApc: 0,
    connectorUpc: 0,
    note: "",
    key: false,
    fuelNote: false,
    lunch: ""
  },
  cities: Array.from({ length: 4 }, (_, i) => ({
    enabled: false,
    name: "",
    clients: Array.from({ length: 30 }, () => ({ name: "", status: "" }))
  }))
};

// --- NOVAS CONSTANTES DA BANDEJA ---

export const REGIONS: Record<string, string[]> = {
  'Mata Verde': ['Mata Verde', 'Sapata'],
  'Palmópolis': ['Palmópolis', 'Vila Formosa', 'Igrejinha'],
  'Jacinto': ['Jacinto', 'Santo Antônio', 'Jaguarão', 'Bom Jardim', 'Salto da Divisa', 'Santa Maria'],
  'Jequitinhonha': ['Jequitinhonha', 'Joaíma']
};

export const TRAY_STATUS_OPTIONS = [
  "",
  "SEM INTERNET",
  "CLIENTE NOVO",
  "LENTIDÃO",
  "QUEDAS",
  "CANCELAMENTO",
  "COBRANÇA",
  "TROCA DE TECNOLOGIA",
  "TROCA DE TITULARIDADE",
  "AMPLIAÇÃO",
  "ORÇAMENTO",
  "SERVIÇO DE REDE",
  "MUDANÇA DE ENDEREÇO",
  "ASSINATURA",
  "NOVO ACESSO",
  "REATIVAÇÃO",
  "SINAL ALTO",
  "CONFIGURAÇÃO DE EQUIPAMENTO",
];

export const TRAY_EQUIPMENT_OPTIONS = [
  "",
  "ONU",
  "ONT",
  "HUAWEI AX3S",
  "FIBERHOME 1500AX",
  "GREATEK 1500AX",
  "GREATEK 1200AC",
  "INTELBRAS W6-1500"
];
