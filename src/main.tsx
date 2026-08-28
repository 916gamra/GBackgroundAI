import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'highlight.js/styles/github-dark-dimmed.css';
import { migrateLegacyStorage } from './version';

// Move data written by older builds (gbai_*_v13) onto the current storage keys
// before App.tsx reads them, otherwise users silently lose their chats and keys.
migrateLegacyStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
