const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { getAdapterForProvider } from './services/providers';",
  "import { getAdapterForProvider } from './services/providers';\nimport { AgentOrchestrator } from './services/orchestrator/AgentOrchestrator';"
);

fs.writeFileSync('src/App.tsx', code);
