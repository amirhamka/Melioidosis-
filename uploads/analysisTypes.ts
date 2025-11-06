export interface BranchData {
  id: string;
  name: string;
  probability: number | string;
  cost: number | string;
  effectiveness: number | string;
  target_node_id?: string;
}

export interface NodeData extends Record<string, unknown> {
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
}

export interface CustomNode {
  id: string;
  type: 'custom';
  position: { x: number; y: number };
  data: NodeData;
}

export interface GraphModel {
  nodes: CustomNode[];
  edges: Array<{
    id?: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

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

export interface SensitivityParam {
  variable_name: string;
  low: number;
  high: number;
}
