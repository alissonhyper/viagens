
export interface MaterialItem {
  model: string;
  qty: number;
}

export interface Client {
  name: string;
  status: string;
}

export interface City {
  enabled: boolean;
  name: string;
  clients: Client[];
}

export interface Materials {
  onus: MaterialItem[];
  onts: MaterialItem[];
  routers: MaterialItem[];
  connectorApc: number;
  connectorUpc: number;
  note: string;
  key: boolean;
  fuelNote: boolean;
  lunch: string;
}

export interface AppState {
  date: string;
  startTime: string;
  technician: string;
  assistant: string;
  services: string[];
  materials: Materials;
  equipment?: string; 
  cities: City[];
  id?: string;
  id_viagem?: string;
  observations?: string;
  clientName?: string;
  atendente?: string;
}

export type FeedbackStatus = 'REALIZADO' | 'NAO_REALIZADO' | 'AUSENTE';

export interface EncerramentoFeedback {
  clientId: string;
  status: FeedbackStatus;
  attendantName?: string;

  // NOVOS (para ligar o encerramento à bandeja)
  cityName: string;
  trayItemId?: string;
}

export interface TrayItem {
  id: string;
  region: string;
  city: string;
  date: string;
  clientName: string;
  status: string;
  equipment: string;
  observation: string;
  attendant: string;
  trayOrder?: number;

// marca que essa ordem foi incluída numa viagem do histórico
  tripId?: string | null;
  tripAt?: any; // Timestamp (não precisa tipar forte agora)
}
