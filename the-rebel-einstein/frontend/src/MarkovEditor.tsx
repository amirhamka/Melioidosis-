import React, { useState, useEffect } from 'react';

interface MarkovEditorProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

export default function MarkovEditor({ nodeData, onUpdateNode }: MarkovEditorProps) {
  const [model, setModel] = useState({
    label: nodeData.label || 'Markov Model',
    nodeType: 'markov' as const,
    states: [
      { name: 'Healthy', cost: 0, utility: 1 },
      { name: 'Dead', cost: 0, utility: 0 },
    ],
    transitionMatrix: {} as Record<string, Record<string, number | string>>,
    timeHorizon: 50,
    cycleLength: 1,
    initialDistribution: {} as Record<string, number | string>,
    halfCycleCorrection: true,
  });

  useEffect(() => {
    if (nodeData) {
      setModel({
        label: nodeData.label || 'Markov Model',
        nodeType: 'markov',
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

  const handleStateChange = (index: number, field: string, value: any) => {
    const newStates = [...model.states];
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
    const newStateName = `State ${model.states.length + 1}`;
    setModel({
      ...model,
      states: [...model.states, { name: newStateName, cost: 0, utility: 0 }],
    });
  };

  if (!model) return <div>Loading...</div>;

  return (
    <div style={{ padding: '15px', background: '#f9f9f9', height: '100%', overflowY: 'auto' }}>
      <h3>Markov Model Properties</h3>
      <div style={{ marginBottom: '20px' }}>
        <label>Time Horizon (cycles):</label>
        <input
          type="number"
          value={model.timeHorizon}
          onChange={(e) => setModel({ ...model, timeHorizon: Number(e.target.value) })}
          onBlur={pushUpdate}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      <h4>States</h4>
      <button onClick={addState} style={{ marginBottom: '10px', padding: '5px 10px' }}>
        + Add State
      </button>
      {model.states.map((state: any, index: number) => (
        <div
          key={index}
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '5px',
          }}
        >
          <input
            type="text"
            value={state.name}
            onChange={(e) => handleStateChange(index, 'name', e.target.value)}
            onBlur={pushUpdate}
            style={{ fontWeight: 'bold', width: '100%', marginBottom: '5px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Cost"
              value={state.cost}
              onChange={(e) => handleStateChange(index, 'cost', e.target.value)}
              onBlur={pushUpdate}
              style={{ flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <input
              type="text"
              placeholder="Utility"
              value={state.utility}
              onChange={(e) => handleStateChange(index, 'utility', e.target.value)}
              onBlur={pushUpdate}
              style={{ flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
      ))}
      <h4 style={{ marginTop: '20px' }}>Transition Matrix</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '5px' }}>From / To</th>
            {model.states.map((state) => (
              <th key={state.name} style={{ border: '1px solid #ddd', padding: '5px' }}>
                {state.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.states.map((fromState: any) => (
            <tr key={fromState.name}>
              <td style={{ fontWeight: 'bold', border: '1px solid #ddd', padding: '5px' }}>
                {fromState.name}
              </td>
              {model.states.map((toState: any) => (
                <td key={toState.name} style={{ border: '1px solid #ddd', padding: '5px' }}>
                  <input
                    type="text"
                    style={{ width: '80px', padding: '3px', borderRadius: '4px', border: '1px solid #ddd' }}
                    value={model.transitionMatrix[fromState.name]?.[toState.name] || ''}
                    onChange={(e) => handleMatrixChange(fromState.name, toState.name, e.target.value)}
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
