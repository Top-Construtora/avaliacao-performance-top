export interface PDIItem {
  id?: string;
  competencia: string;
  resultadosEsperados: string;
  comoDesenvolver: string;
  calendarizacao: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao?: string;
  prazo: 'curto' | 'medio' | 'longo';
}

export interface PDIData {
  id?: string;
  employeeId: string;
  cycleId?: string;
  leaderEvaluationId?: string;
  items: PDIItem[];
  periodo?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  employee?: {
    id: string;
    name: string;
    position: string;
    department?: string;
  };
  leaderEvaluation?: {
    id: string;
    evaluator?: {
      id: string;
      name: string;
    };
  };
}