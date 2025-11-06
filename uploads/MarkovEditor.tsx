import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { NodeData, MarkovState } from '@shared/analysisTypes';

interface MarkovEditorProps {
  nodeData: NodeData;
  onUpdateNode: (updatedData: NodeData) => void;
}

export default function MarkovEditor({ nodeData, onUpdateNode }: MarkovEditorProps) {
  const [model, setModel] = useState<NodeData>({
    label: nodeData.label,
    nodeType: 'markov',
    states: [
      { name: 'Healthy', cost: 0, utility: 1 },
      { name: 'Dead', cost: 0, utility: 0 },
    ],
    transitionMatrix: {},
    timeHorizon: 50,
    cycleLength: 1,
    initialDistribution: {},
    halfCycleCorrection: true,
  });

  useEffect(() => {
    if (nodeData) {
      setModel({
        ...nodeData,
        states: nodeData.states || model.states,
        transitionMatrix: nodeData.transitionMatrix || {},
        timeHorizon: nodeData.timeHorizon || 50,
        cycleLength: nodeData.cycleLength || 1,
        initialDistribution: nodeData.initialDistribution || {},
        halfCycleCorrection: nodeData.halfCycleCorrection ?? true,
      });
    }
  }, [nodeData]);

  const pushUpdate = () => {
    onUpdateNode(model);
  };

  const handleStateChange = (index: number, field: keyof MarkovState, value: any) => {
    const newStates = [...(model.states || [])];
    newStates[index] = { ...newStates[index], [field]: value };
    setModel({ ...model, states: newStates });
  };

  const handleMatrixChange = (fromState: string, toState: string, value: string) => {
    const newMatrix = { ...model.transitionMatrix };
    if (!newMatrix[fromState]) newMatrix[fromState] = {};
    newMatrix[fromState][toState] = value;
    setModel({ ...model, transitionMatrix: newMatrix });
  };

  const addState = () => {
    const newStateName = `State ${(model.states?.length || 0) + 1}`;
    setModel({
      ...model,
      states: [...(model.states || []), { name: newStateName, cost: 0, utility: 0 }],
    });
  };

  const states = model.states || [];

  return (
    <div style={{ padding: '15px', background: '#f9f9f9', height: '100%', overflowY: 'auto' }}>
      <h3>Markov Model Properties</h3>
      <div style={{ marginBottom: '20px' }}>
        <label>Time Horizon (cycles):</label>
        <Input
          type="number"
          value={model.timeHorizon}
          onChange={(e) => setModel({ ...model, timeHorizon: Number(e.target.value) })}
          onBlur={pushUpdate}
        />
      </div>
      <h4>States</h4>
      <Button onClick={addState}>+ Add State</Button>
      {states.map((state, index) => (
        <div
          key={index}
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '5px',
          }}
        >
          <Input
            type="text"
            value={state.name}
            onChange={(e) => handleStateChange(index, 'name', e.target.value)}
            onBlur={pushUpdate}
            style={{ fontWeight: 'bold', width: '100%', marginBottom: '5px' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input
              type="text"
              placeholder="Cost"
              value={state.cost}
              onChange={(e) => handleStateChange(index, 'cost', e.target.value)}
              onBlur={pushUpdate}
            />
            <Input
              type="text"
              placeholder="Utility"
              value={state.utility}
              onChange={(e) => handleStateChange(index, 'utility', e.target.value)}
              onBlur={pushUpdate}
            />
          </div>
        </div>
      ))}
      <h4 style={{ marginTop: '20px' }}>Transition Matrix</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>From / To</th>
            {states.map((state) => (
              <th key={state.name}>{state.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((fromState) => (
            <tr key={fromState.name}>
              <td style={{ fontWeight: 'bold' }}>{fromState.name}</td>
              {states.map((toState) => (
                <td key={toState.name}>
                  <Input
                    type="text"
                    style={{ width: '80px' }}
                    value={model.transitionMatrix?.[fromState.name]?.[toState.name] || ''}
                    onChange={(e) =>
                      handleMatrixChange(fromState.name, toState.name, e.target.value)
                    }
                    onBlur={pushUpdate}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
