import React from 'react';
import ModelBuilder from './ModelBuilder';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>The Rebel Einstein</h1>
        <p style={{ fontSize: '14px', margin: 0 }}>Decision Analysis & Markov Modeling Tool</p>
      </header>
      <div style={{ width: '100vw', height: 'calc(100vh - 60px)' }}>
        <ModelBuilder />
      </div>
    </div>
  );
}

export default App;
