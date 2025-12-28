
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
