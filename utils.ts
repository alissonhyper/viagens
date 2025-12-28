
export const pad = (num: number): string => num.toString().padStart(2, '0');

export const formatarData = (dataStr: string): string => {
  if (!dataStr) return "";
  const [year, month, day] = dataStr.split('-');
  return `${day}/${month}/${year}`;
};

export const getDiaSemana = (dataStr: string): string => {
  if (!dataStr) return "";
  const days = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
  const date = new Date(dataStr + "T12:00:00");
  return days[date.getDay()];
};

export const listaComE = (lista: string[]): string => {
  if (lista.length === 0) return "";
  const copy = [...lista]; // Safe copy to avoid mutations
  if (copy.length === 1) return copy[0];
  const last = copy.pop();
  return `${copy.join(', ')} e ${last}`;
};
