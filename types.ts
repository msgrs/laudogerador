
export interface ToolComparison {
  category: string;
  name: string;
  cost: string;
  limit: string;
  learning: number;
  recommendation: boolean;
}

export interface RoadmapItem {
  week: number;
  title: string;
  tasks: string[];
  risk: string;
  mitigation: string;
}

export interface AutomationTask {
  name: string;
  trigger: string;
  action: string;
  tool: string;
  cost: string;
}

export interface LaudoData {
  id: string;
  data: string;
  cliente: string;
  // Visual
  oleo_visual: string;
  agua_visual: string;
  vent_visual: string;
  correias_visual: string;
  // Motor
  rpm: number;
  pressao_bar: number;
  temp_antes: number;
  temp_depois: number;
  vbat: number;
  comb_percent: number;
  comb_litros: number;
  // Gerador (Tensões)
  gen_l1n: number; gen_l2n: number; gen_l3n: number;
  gen_l1l2: number; gen_l2l3: number; gen_l3l1: number;
  // Rede (Tensões)
  red_l1n: number; red_l2n: number; red_l3n: number;
  red_l1l2: number; red_l2l3: number; red_l3l1: number;
  // Final
  frequencia: number;
  assinatura: string; // base64
  observacoes: string;
  imagens?: string;
  pdf_url?: string;
}
