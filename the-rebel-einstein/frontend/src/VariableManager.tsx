import React, { useState } from 'react';

interface VariableManagerProps {
  variables: { [key: string]: number };
  onUpdateVariables: (newVariables: { [key: string]: number }) => void;
}

export default function VariableManager({ variables, onUpdateVariables }: VariableManagerProps) {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAddVariable = () => {
    if (newVarName && !isNaN(Number(newVarValue))) {
      onUpdateVariables({ ...variables, [newVarName]: Number(newVarValue) });
      setNewVarName('');
      setNewVarValue('');
    }
  };

  const handleDeleteVariable = (nameToDelete: string) => {
    const newVars = { ...variables };
    delete newVars[nameToDelete];
    onUpdateVariables(newVars);
  };

  const handleUpdateVariable = (nameToUpdate: string, newValue: string) => {
    if (!isNaN(Number(newValue))) {
      onUpdateVariables({ ...variables, [nameToUpdate]: Number(newValue) });
    }
  };

  return (
    <div style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
      <h4 style={{ marginTop: 0 }}>Global Variables</h4>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Name (e.g., p_success)"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          style={{ flexGrow: 1, padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="number"
          placeholder="Value (e.g., 0.8)"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          style={{ width: '100px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button onClick={handleAddVariable} style={{ padding: '5px 10px' }}>
          Add
        </button>
      </div>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {Object.entries(variables).map(([name, value]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
            }}
          >
            <span>{name} =</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="number"
                value={value}
                onChange={(e) => handleUpdateVariable(name, e.target.value)}
                style={{ width: '80px', padding: '3px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button
                onClick={() => handleDeleteVariable(name)}
                style={{
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  padding: '3px 8px',
                }}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
