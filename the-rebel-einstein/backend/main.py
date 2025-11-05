from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Union, Optional
import numpy as np

# --- Pydantic Models for Data Validation ---

class Branch(BaseModel):
    id: str
    name: str
    probability: Union[float, str] = 1.0
    cost: Union[float, str] = 0.0
    effectiveness: Union[float, str] = 0.0
    target_node_id: Optional[str] = None

class Node(BaseModel):
    id: str
    data: Dict
    type: Literal['custom'] = 'custom'

class GraphModel(BaseModel):
    nodes: List[Node]
    edges: List[Dict]

class EVResult(BaseModel):
    cost: float
    effectiveness: float
    strategy: Optional[str] = None

class SensitivityParam(BaseModel):
    variable_name: str
    low: float
    high: float

class TornadoBar(BaseModel):
    variable_name: str
    low_impact: float
    high_impact: float

class TornadoResult(BaseModel):
    base_outcome: float
    bars: List[TornadoBar]

class MarkovState(BaseModel):
    name: str
    cost: Union[float, str]
    utility: Union[float, str]

class MarkovModelData(BaseModel):
    states: List[MarkovState]
    transitionMatrix: Dict[str, Dict[str, Union[float, str]]]
    timeHorizon: int
    cycleLength: float
    initialDistribution: Dict[str, Union[float, str]]
    halfCycleCorrection: bool

class AnalysisRequest(BaseModel):
    model: GraphModel
    variables: Dict[str, float] = {}

# --- Analysis Engine ---

def _resolve_value(value: Union[float, str], variables: dict) -> float:
    if isinstance(value, (int, float)): return float(value)
    if isinstance(value, str): return variables.get(value, 0.0)
    return 0.0

def calculate_expected_value(model: GraphModel, node_id: str, variables: dict) -> EVResult:
    current_node_data = next((n for n in model.nodes if n.id == node_id), None)
    if not current_node_data: raise ValueError(f"Node {node_id} not found.")
    node_type = current_node_data.data['nodeType']
    branches = current_node_data.data.get('branches', [])

    if node_type == 'terminal':
        if not branches: return EVResult(cost=0, effectiveness=0)
        branch = branches[0]
        cost = _resolve_value(branch['cost'], variables)
        effectiveness = _resolve_value(branch['effectiveness'], variables)
        return EVResult(cost=cost, effectiveness=effectiveness)

    if node_type == 'chance':
        total_cost, total_effectiveness, total_prob = 0.0, 0.0, 0.0
        for branch in branches:
            prob = _resolve_value(branch['probability'], variables)
            if branch.get('target_node_id'):
                child_ev = calculate_expected_value(model, branch['target_node_id'], variables)
                total_cost += prob * child_ev.cost
                total_effectiveness += prob * child_ev.effectiveness
                total_prob += prob
        if total_prob > 0: return EVResult(cost=total_cost / total_prob, effectiveness=total_effectiveness / total_prob)
        else: return EVResult(cost=0, effectiveness=0)

    if node_type == 'decision':
        best_ev, best_branch_name = None, None
        for branch in branches:
            if branch.get('target_node_id'):
                child_ev = calculate_expected_value(model, branch['target_node_id'], variables)
            else:
                child_ev = EVResult(cost=_resolve_value(branch['cost'], variables), effectiveness=_resolve_value(branch['effectiveness'], variables))
            if best_ev is None or child_ev.effectiveness > best_ev.effectiveness:
                best_ev, best_branch_name = child_ev, branch['name']
        if best_ev: return EVResult(cost=best_ev.cost, effectiveness=best_ev.effectiveness, strategy=best_branch_name)
        else: return EVResult(cost=0, effectiveness=0)
    return EVResult(cost=0, effectiveness=0)

def run_markov_cohort_simulation(model: GraphModel, node_id: str, variables: dict) -> EVResult:
    node_data = next((n for n in model.nodes if n.id == node_id), None).data
    markov_data = MarkovModelData(**node_data)
    
    state_names = [s.name for s in markov_data.states]
    num_states = len(state_names)
    
    P = np.zeros((num_states, num_states))
    for i, from_state in enumerate(state_names):
        row_sum = 0
        for j, to_state in enumerate(state_names):
            prob = _resolve_value(markov_data.transitionMatrix.get(from_state, {}).get(to_state, 0), variables)
            P[i, j] = prob
            row_sum += prob
        if row_sum > 0: P[i, :] /= row_sum

    cost_vector = np.array([_resolve_value(s.cost, variables) for s in markov_data.states])
    utility_vector = np.array([_resolve_value(s.utility, variables) for s in markov_data.states])
    
    cohort = np.array([_resolve_value(markov_data.initialDistribution.get(s.name, 0), variables) for s in markov_data.states])
    if cohort.sum() == 0: cohort[0] = 1.0

    total_cost, total_utility = 0.0, 0.0
    
    for cycle in range(markov_data.timeHorizon):
        total_cost += np.dot(cohort, cost_vector) * markov_data.cycleLength
        total_utility += np.dot(cohort, utility_vector) * markov_data.cycleLength
        next_cohort = np.dot(cohort, P)
        if markov_data.halfCycleCorrection:
            avg_cohort = (cohort + next_cohort) / 2
            total_cost += np.dot(avg_cohort, cost_vector) * markov_data.cycleLength * -1
            total_utility += np.dot(avg_cohort, utility_vector) * markov_data.cycleLength * -1
            total_cost += np.dot(avg_cohort, cost_vector) * markov_data.cycleLength
            total_utility += np.dot(avg_cohort, utility_vector) * markov_data.cycleLength
        cohort = next_cohort
    return EVResult(cost=total_cost, effectiveness=total_utility)

def run_one_way_sensitivity(model: GraphModel, root_node_id: str, base_variables: dict, params_to_test: List[SensitivityParam]) -> TornadoResult:
    base_outcome_ev = calculate_expected_value(model, root_node_id, base_variables)
    base_outcome = base_outcome_ev.effectiveness
    tornado_bars = []
    for param in params_to_test:
        low_vars, high_vars = base_variables.copy(), base_variables.copy()
        low_vars[param.variable_name], high_vars[param.variable_name] = param.low, param.high
        low_ev, high_ev = calculate_expected_value(model, root_node_id, low_vars), calculate_expected_value(model, root_node_id, high_vars)
        tornado_bars.append(TornadoBar(variable_name=param.variable_name, low_impact=low_ev.effectiveness, high_impact=high_ev.effectiveness))
    tornado_bars.sort(key=lambda bar: abs(bar.high_impact - bar.low_impact), reverse=True)
    return TornadoResult(base_outcome=base_outcome, bars=tornado_bars)

# --- FastAPI Application ---

app = FastAPI(title="The Rebel Einstein API", version="1.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _build_node_targets(model: GraphModel):
    node_map = {node.id: node for node in model.nodes}
    for edge in model.edges:
        source_node = node_map.get(edge['source'])
        if source_node and 'branches' in source_node.data:
            target_branch = next((b for b in source_node.data['branches'] if b['id'] == edge['sourceHandle']), None)
            if target_branch: target_branch['target_node_id'] = edge['target']

@app.post("/analyze/rollback", response_model=EVResult)
async def run_rollback_analysis(request: AnalysisRequest):
    try:
        model, variables = request.model, request.variables
        source_ids = {edge['target'] for edge in model.edges}
        root_node = next((node for node in model.nodes if node.id not in source_ids), None)
        if not root_node: raise HTTPException(status_code=400, detail="No root node found.")
        _build_node_targets(model)
        if root_node.data.get('nodeType') == 'markov': result = run_markov_cohort_simulation(model, root_node.id, variables)
        else: result = calculate_expected_value(model, root_node.id, variables)
        return result
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/sensitivity-oneway", response_model=TornadoResult)
async def run_sensitivity_analysis(request: AnalysisRequest):
    try:
        model, variables = request.model, request.variables
        source_ids = {edge['target'] for edge in model.edges}
        root_node = next((node for node in model.nodes if node.id not in source_ids), None)
        if not root_node: raise HTTPException(status_code=400, detail="No root node found.")
        _build_node_targets(model)
        params_to_test = []
        for name, value in variables.items():
            low_val, high_val = value * 0.8, value * 1.2
            params_to_test.append(SensitivityParam(variable_name=name, low=low_val, high=high_val))
        result = run_one_way_sensitivity(model, root_node.id, variables, params_to_test)
        return result
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root(): return {"message": "The Rebel Einstein API is online and ready for analysis."}
