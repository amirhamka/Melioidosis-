import React, { useState, useEffect } from 'react';
import { NodeData, BranchData } from './types';
import VariableManager from './VariableManager';

interface PropertiesPanelProps {
  selectedNodeData: NodeData | null;
  onUpdateNode: (updatedData: NodeData) => void;
  variables: { [key: string]: number };
  onUpdateVariables: (newVariables: { [key: string]: number }) => void;
  formatCurrency: (value: number) => string;
}

export default function PropertiesPanel({
  selectedNodeData,
  onUpdateNode,
  variables,
  onUpdateVariables,
  formatCurrency,
}: PropertiesPanelProps) {
  const [formData, setFormData] = useState<NodeData | null>(null);

  useEffect(() => {
    setFormData(selectedNodeData);
  }, [selectedNodeData]);

  if (!formData) {
    return (
      <aside
        style={{
          width: '300px',
          borderLeft: '1px solid #ddd',
          padding: '15px',
        }}
      >
        <VariableManager variables={variables} onUpdateVariables={onUpdateVariables} />
      </aside>
    );
  }

  const handleNodeDataChange = (field: keyof NodeData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBranchChange = (branchId: string, field: keyof BranchData, value: any) => {
    const updatedBranches = formData.branches?.map((branch) =>
      branch.id === branchId ? { ...branch, [field]: value } : branch
    );
    setFormData({ ...formData, branches: updatedBranches });
  };

  const pushUpdate = () => {
    if (formData) onUpdateNode(formData);
  };

  return (
    <aside
      className="properties-panel"
      style={{
        width: '300px',
        borderLeft: '1px solid #ddd',
        padding: '0',
        background: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <VariableManager variables={variables} onUpdateVariables={onUpdateVariables} />
      <div style={{ padding: '15px', flexGrow: 1, overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Node Properties</h3>
        <div style={{ marginBottom: '15px' }}>
          <label>Node Name</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleNodeDataChange('label', e.target.value)}
            onBlur={pushUpdate}
            style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <h4>Branches</h4>
        {formData.branches?.map((branch) => (
          <div
            key={branch.id}
            className="branch-editor"
            style={{
              border: '1px solid #e0e0e0',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '5px',
              background: '#fff',
            }}
          >
            <input
              type="text"
              value={branch.name}
              onChange={(e) => handleBranchChange(branch.id, 'name', e.target.value)}
              onBlur={pushUpdate}
              style={{ width: '100%', marginBottom: '5px', fontWeight: 'bold', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <div style={{ display: 'flex', gap: '5px', fontSize: '12px' }}>
              {formData.nodeType !== 'decision' && (
                <input
                  type="text"
                  placeholder="Prob."
                  value={branch.probability}
                  onChange={(e) => handleBranchChange(branch.id, 'probability', e.target.value)}
                  onBlur={pushUpdate}
                  style={{ width: '33%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              )}
              <input
                type="text"
                placeholder="Cost"
                value={branch.cost}
                onChange={(e) => handleBranchChange(branch.id, 'cost', e.target.value)}
                onBlur={pushUpdate}
                style={{ width: formData.nodeType !== 'decision' ? '33%' : '50%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="Effect."
                value={branch.effectiveness}
                onChange={(e) => handleBranchChange(branch.id, 'effectiveness', e.target.value)}
                onBlur={pushUpdate}
                style={{ width: formData.nodeType !== 'decision' ? '33%' : '50%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            {typeof branch.cost === 'number' && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                ≈ {formatCurrency(branch.cost)}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
