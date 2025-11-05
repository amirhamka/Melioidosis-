import type {
  GraphModel,
  EVResult,
  SensitivityParam,
  TornadoResult,
  TornadoBar,
  NodeData,
  MarkovState,
} from '@shared/analysisTypes';

/**
 * Resolve a value that can be either a number or a variable name
 */
function resolveValue(value: number | string, variables: Record<string, number>): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return variables[value] ?? 0;
  return 0;
}

/**
 * Calculate expected value for a decision tree node
 */
export function calculateExpectedValue(
  model: GraphModel,
  nodeId: string,
  variables: Record<string, number>
): EVResult {
  const currentNode = model.nodes.find((n) => n.id === nodeId);
  if (!currentNode) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const nodeType = currentNode.data.nodeType;
  const branches = currentNode.data.branches || [];

  // Terminal node
  if (nodeType === 'terminal') {
    if (branches.length === 0) return { cost: 0, effectiveness: 0 };
    const branch = branches[0];
    const cost = resolveValue(branch.cost, variables);
    const effectiveness = resolveValue(branch.effectiveness, variables);
    return { cost, effectiveness };
  }

  // Chance node
  if (nodeType === 'chance') {
    let totalCost = 0;
    let totalEffectiveness = 0;
    let totalProb = 0;

    for (const branch of branches) {
      const prob = resolveValue(branch.probability, variables);
      if (branch.target_node_id) {
        const childEV = calculateExpectedValue(model, branch.target_node_id, variables);
        totalCost += prob * childEV.cost;
        totalEffectiveness += prob * childEV.effectiveness;
        totalProb += prob;
      }
    }

    if (totalProb > 0) {
      return {
        cost: totalCost / totalProb,
        effectiveness: totalEffectiveness / totalProb,
      };
    }
    return { cost: 0, effectiveness: 0 };
  }

  // Decision node
  if (nodeType === 'decision') {
    let bestEV: EVResult | null = null;
    let bestBranchName: string | null = null;

    for (const branch of branches) {
      let childEV: EVResult;
      if (branch.target_node_id) {
        childEV = calculateExpectedValue(model, branch.target_node_id, variables);
      } else {
        childEV = {
          cost: resolveValue(branch.cost, variables),
          effectiveness: resolveValue(branch.effectiveness, variables),
        };
      }

      if (bestEV === null || childEV.effectiveness > bestEV.effectiveness) {
        bestEV = childEV;
        bestBranchName = branch.name;
      }
    }

    if (bestEV) {
      return {
        cost: bestEV.cost,
        effectiveness: bestEV.effectiveness,
        strategy: bestBranchName || undefined,
      };
    }
    return { cost: 0, effectiveness: 0 };
  }

  return { cost: 0, effectiveness: 0 };
}

/**
 * Run Markov cohort simulation
 */
export function runMarkovCohortSimulation(
  model: GraphModel,
  nodeId: string,
  variables: Record<string, number>
): EVResult {
  const node = model.nodes.find((n) => n.id === nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const data = node.data;
  const states = data.states || [];
  const transitionMatrix = data.transitionMatrix || {};
  const timeHorizon = data.timeHorizon || 50;
  const cycleLength = data.cycleLength || 1;
  const initialDistribution = data.initialDistribution || {};
  const halfCycleCorrection = data.halfCycleCorrection ?? true;

  const numStates = states.length;
  const stateNames = states.map((s) => s.name);

  // Build transition probability matrix
  const P: number[][] = [];
  for (let i = 0; i < numStates; i++) {
    const fromState = stateNames[i];
    const row: number[] = [];
    let rowSum = 0;

    for (let j = 0; j < numStates; j++) {
      const toState = stateNames[j];
      const prob = resolveValue(transitionMatrix[fromState]?.[toState] ?? 0, variables);
      row.push(prob);
      rowSum += prob;
    }

    // Normalize row
    if (rowSum > 0) {
      for (let j = 0; j < numStates; j++) {
        row[j] /= rowSum;
      }
    }
    P.push(row);
  }

  // Cost and utility vectors
  const costVector = states.map((s) => resolveValue(s.cost, variables));
  const utilityVector = states.map((s) => resolveValue(s.utility, variables));

  // Initial cohort distribution
  let cohort = states.map((s) => resolveValue(initialDistribution[s.name] ?? 0, variables));
  const cohortSum = cohort.reduce((a, b) => a + b, 0);
  if (cohortSum === 0) {
    cohort[0] = 1.0;
  } else {
    cohort = cohort.map((c) => c / cohortSum);
  }

  let totalCost = 0;
  let totalUtility = 0;

  // Run simulation
  for (let cycle = 0; cycle < timeHorizon; cycle++) {
    // Calculate cost and utility for this cycle
    const cycleCost = cohort.reduce((sum, c, i) => sum + c * costVector[i], 0);
    const cycleUtility = cohort.reduce((sum, c, i) => sum + c * utilityVector[i], 0);

    totalCost += cycleCost * cycleLength;
    totalUtility += cycleUtility * cycleLength;

    // Transition to next state
    const nextCohort = new Array(numStates).fill(0);
    for (let i = 0; i < numStates; i++) {
      for (let j = 0; j < numStates; j++) {
        nextCohort[j] += cohort[i] * P[i][j];
      }
    }

    // Half-cycle correction
    if (halfCycleCorrection) {
      const avgCohort = cohort.map((c, i) => (c + nextCohort[i]) / 2);
      const avgCost = avgCohort.reduce((sum, c, i) => sum + c * costVector[i], 0);
      const avgUtility = avgCohort.reduce((sum, c, i) => sum + c * utilityVector[i], 0);

      // Subtract the full cycle and add the averaged cycle
      totalCost += (avgCost - cycleCost) * cycleLength;
      totalUtility += (avgUtility - cycleUtility) * cycleLength;
    }

    cohort = nextCohort;
  }

  return { cost: totalCost, effectiveness: totalUtility };
}

/**
 * Run one-way sensitivity analysis
 */
export function runOneWaySensitivity(
  model: GraphModel,
  rootNodeId: string,
  baseVariables: Record<string, number>,
  paramsToTest: SensitivityParam[]
): TornadoResult {
  const baseOutcomeEV = calculateExpectedValue(model, rootNodeId, baseVariables);
  const baseOutcome = baseOutcomeEV.effectiveness;

  const tornadoBars: TornadoBar[] = [];

  for (const param of paramsToTest) {
    const lowVars = { ...baseVariables, [param.variable_name]: param.low };
    const highVars = { ...baseVariables, [param.variable_name]: param.high };

    const lowEV = calculateExpectedValue(model, rootNodeId, lowVars);
    const highEV = calculateExpectedValue(model, rootNodeId, highVars);

    tornadoBars.push({
      variable_name: param.variable_name,
      low_impact: lowEV.effectiveness,
      high_impact: highEV.effectiveness,
    });
  }

  // Sort by impact magnitude
  tornadoBars.sort((a, b) => {
    const impactA = Math.abs(a.high_impact - a.low_impact);
    const impactB = Math.abs(b.high_impact - b.low_impact);
    return impactB - impactA;
  });

  return {
    base_outcome: baseOutcome,
    bars: tornadoBars,
  };
}

/**
 * Build node targets from edges
 */
export function buildNodeTargets(model: GraphModel): void {
  const nodeMap = new Map(model.nodes.map((node) => [node.id, node]));

  for (const edge of model.edges) {
    const sourceNode = nodeMap.get(edge.source);
    if (!sourceNode) continue;

    const targetBranch = sourceNode.data.branches?.find((b) => b.id === edge.sourceHandle);
    if (targetBranch) {
      targetBranch.target_node_id = edge.target;
    }
  }
}
