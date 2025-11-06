export interface BranchData {
  id: string;
  name: string;
  probability: number | string;
  cost: number | string;
  effectiveness: number | string;
  target_node_id?: string;
}

export interface NodeData {
  label: string;
  nodeType: 'decision' | 'chance' | 'terminal' | 'markov';
  branches?: BranchData[];
  // Markov-specific fields
  states?: MarkovState[];
  transitionMatrix?: Record<string, Record<string, number | string>>;
  timeHorizon?: number;
  cycleLength?: number;
  initialDistribution?: Record<string, number | string>;
  halfCycleCorrection?: boolean;
  [key: string]: any;
}

export type CustomNode = {
  id: string;
  type: 'custom';
  position: { x: number; y: number };
  data: NodeData;
};

export interface EVResult {
  cost: number;
  effectiveness: number;
  strategy?: string;
}

export interface TornadoBar {
  variable_name: string;
  low_impact: number;
  high_impact: number;
}

export interface TornadoResult {
  base_outcome: number;
  bars: TornadoBar[];
}

export interface MarkovState {
  name: string;
  cost: number | string;
  utility: number | string;
}

export type GraphModelForAPI = {
  nodes: any[];
  edges: any[];
};
