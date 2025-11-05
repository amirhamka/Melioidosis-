import React from 'react';

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      style={{
        padding: '15px',
        borderRight: '1px solid #ddd',
        background: '#f7f7f7',
        width: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        Node Palette
      </h3>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'decision')}
        draggable
        style={{
          padding: '10px',
          border: '2px solid #b38600',
          borderRadius: '5px',
          background: '#ffcc00',
          cursor: 'grab',
          textAlign: 'center',
        }}
      >
        Decision Node
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'chance')}
        draggable
        style={{
          padding: '10px',
          border: '2px solid #2e7d32',
          borderRadius: '5px',
          background: '#4caf50',
          color: 'white',
          cursor: 'grab',
          textAlign: 'center',
        }}
      >
        Chance Node
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'terminal')}
        draggable
        style={{
          padding: '10px',
          border: '2px solid #0d47a1',
          borderRadius: '5px',
          background: '#2196f3',
          color: 'white',
          cursor: 'grab',
          textAlign: 'center',
        }}
      >
        Terminal Node
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'markov')}
        draggable
        style={{
          padding: '10px',
          border: '2px solid #9c27b0',
          borderRadius: '5px',
          background: '#e1bee7',
          color: '#4a148c',
          cursor: 'grab',
          textAlign: 'center',
        }}
      >
        Markov Model
      </div>
    </aside>
  );
}
