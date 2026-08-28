import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'highlight.js/styles/github-dark-dimmed.css';
import { initProjectMemory } from './services/projectMemory';

// Initialize in-memory project files context for self code reading and inspection
initProjectMemory();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

