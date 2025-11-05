import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  OnSelectionChangeParams,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodePalette from './NodePalette';
import { CustomNode as CustomNodeComponent } from './CustomNode';
import PropertiesPanel from './PropertiesPanel';
import MarkovEditor from './MarkovEditor';
import { analyzeRollback, analyzeSensitivity } from './api';
import { EVResult, TornadoResult, NodeData } from './types';
import TornadoChart from './TornadoChart';

const nodeTypes = { custom: CustomNodeComponent };

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [variables, setVariables] = useState<{ [key: string]: number }>({});
  const [currency, setCurrency] = useState<'USD' | 'MYR'>('USD');
  const conversionRates = { USD: 1, MYR: 4.75 };
  const formatCurrency = (value: number) => {
    const symbol = currency === 'MYR' ? 'RM' : '$';
    const convertedValue = value * conversionRates[currency];
    return `${symbol}${convertedValue.toFixed(2)}`;
  };
  const [analysisResult, setAnalysisResult] = useState<EVResult | null>(null);
  const [sensitivityResult, setSensitivityResult] = useState<TornadoResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    if (nodes.length === 1) {
      setSelectedNode(nodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const onUpdateNode = useCallback(
    (updatedData: NodeData) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((node) => (node.id === selectedNode.id ? { ...node, data: updatedData } : node))
      );
    },
    [selectedNode, setNodes]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const createDefaultBranches = (nodeType: string) => {
        if (nodeType === 'terminal')
          return [{ id: 'b1', name: 'Outcome', probability: 1, cost: 0, effectiveness: 0 }];
        if (nodeType === 'decision')
          return [
            { id: 'b1', name: 'Option 1', probability: 1, cost: 0, effectiveness: 0 },
            { id: 'b2', name: 'Option 2', probability: 1, cost: 0, effectiveness: 0 },
          ];
        return [
          { id: 'b1', name: 'Yes', probability: 0.5, cost: 0, effectiveness: 0 },
          { id: 'b2', name: 'No', probability: 0.5, cost: 0, effectiveness: 0 },
        ];
      };

      const newNode: Node = {
        id: `${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          nodeType: type,
          ...(type === 'markov' ? {} : { branches: createDefaultBranches(type) }),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const modelForApi = { nodes, edges };
      const result = await analyzeRollback(modelForApi, variables);
      setAnalysisResult(result);
    } catch (error: any) {
      console.error(error);
      alert(`Analysis Failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [nodes, edges, variables]);

  const handleSensitivityAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setSensitivityResult(null);
    try {
      const modelForApi = { nodes, edges };
      const result = await analyzeSensitivity(modelForApi, variables);
      setSensitivityResult(result);
    } catch (error: any) {
      console.error(error);
      alert(`Sensitivity Analysis Failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [nodes, edges, variables]);

  return (
    <div className="dndflow" style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <NodePalette />
      <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
        <div
          className="analysis-controls"
          style={{
            position: 'absolute',
            top: 20,
            left: 220,
            background: 'white',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{ marginRight: '5px', padding: '8px 16px' }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Model'}
              </button>
              <button onClick={handleSensitivityAnalysis} disabled={isAnalyzing} style={{ padding: '8px 16px' }}>
                {isAnalyzing ? 'Analyzing...' : 'Sensitivity Analysis'}
              </button>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'USD' | 'MYR')}
              style={{ padding: '5px' }}
            >
              <option value="USD">USD ($)</option>
              <option value="MYR">MYR (RM)</option>
            </select>
          </div>
          {analysisResult && (
            <div style={{ marginTop: '10px', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Optimal Strategy:</strong> {analysisResult.strategy || 'N/A'}
              <br />
              <strong>Expected Cost:</strong> {formatCurrency(analysisResult.cost)}
              <br />
              <strong>Expected Effectiveness:</strong> {analysisResult.effectiveness.toFixed(2)} QALYs
            </div>
          )}
        </div>
      </div>
      <aside style={{ width: '300px', borderLeft: '1px solid #ddd', background: '#f9f9f9' }}>
        {selectedNode?.data.nodeType === 'markov' ? (
          <MarkovEditor
            nodeData={selectedNode.data}
            onUpdateNode={(updatedData) => onUpdateNode({ ...selectedNode.data, ...updatedData })}
          />
        ) : (
          <PropertiesPanel
            selectedNodeData={selectedNode?.data || null}
            onUpdateNode={onUpdateNode}
            variables={variables}
            onUpdateVariables={setVariables}
            formatCurrency={formatCurrency}
          />
        )}
      </aside>
      {sensitivityResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2>One-Way Sensitivity Analysis</h2>
            <button
              onClick={() => setSensitivityResult(null)}
              style={{ float: 'right', padding: '5px 10px' }}
            >
              Close
            </button>
            <TornadoChart data={sensitivityResult} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModelBuilder() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
