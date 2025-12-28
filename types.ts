
export interface MaterialItem {
  model: string;
  qty: number;
}

export interface Client {
  name: string;
  status: string;
}

export interface CityData {
  enabled: boolean;
  name: string;
  clients: Client[];
}

export interface AppState {
  date: string;
  startTime: string;
  technician: string;
  assistant: string;
  services: string[];
  materials: {
    onus: MaterialItem[];
    onts: MaterialItem[];
    routers: MaterialItem[];
    connectorApc: number;
    connectorUpc: number;
    note: string;
    key: boolean;
    fuelNote: boolean;
    lunch: string;
  };
  cities: CityData[];
}

export type FeedbackStatus = 'REALIZADO' | 'NAO_REALIZADO' | 'AUSENTE';

export interface EncerramentoFeedback {
  clientId: string;
  status: FeedbackStatus;
  attendantName?: string;
}

export interface SavedTrip {
  id: string;
  title: string;
  timestamp: number;
  state: AppState;
  feedbacks?: EncerramentoFeedback[];
}
