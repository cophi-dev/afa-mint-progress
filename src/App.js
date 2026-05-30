import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import NFTGrid from './components/NFTGrid';

function App() {
  return (
    <div className="App">
      <NFTGrid />
      <Analytics />
    </div>
  );
}

export default App; 