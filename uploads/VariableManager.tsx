import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface VariableManagerProps {
  variables: Record<string, number>;
  onUpdateVariables: (newVariables: Record<string, number>) => void;
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
        <Input
          type="text"
          placeholder="Name (e.g., p_success)"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          style={{ flexGrow: 1 }}
        />
        <Input
          type="number"
          placeholder="Value (e.g., 0.8)"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          style={{ width: '100px' }}
        />
        <Button onClick={handleAddVariable}>Add</Button>
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
              <Input
                type="number"
                value={value}
                onChange={(e) => handleUpdateVariable(name, e.target.value)}
                style={{ width: '80px' }}
              />
              <Button
                onClick={() => handleDeleteVariable(name)}
                variant="destructive"
                size="sm"
              >
                X
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
