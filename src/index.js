import './appCacheBootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { prefetchMintStatus } from './services/mintStatusCache';
import App from './App';

prefetchMintStatus();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
