import React from 'react';
import { Handle, Position } from 'reactflow';

const nodeStyles = {
  decision: { background: '#ffcc00', border: '2px solid #b38600', color: '#333' },
  chance: { background: '#4caf50', border: '2px solid #2e7d32', color: '#fff' },
  terminal: { background: '#2196f3', border: '2px solid #0d47a1', color: '#fff' },
  markov: { background: '#e1bee7', border: '2px solid #9c27b0', color: '#4a148c' },
};

export const CustomNode = ({ data, selected }: any) => {
  const style = nodeStyles[data.nodeType as keyof typeof nodeStyles] || nodeStyles.terminal;
  const isSelected = selected ? { boxShadow: '0 0 0 2px #255ab0' } : {};
  
  return (
    <div
      style={{
        ...style,
        ...isSelected,
        padding: '10px 15px',
        borderRadius: '8px',
        minWidth: '120px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div>{data.label}</div>
      <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.8 }}>
        {data.nodeType.toUpperCase()}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};
