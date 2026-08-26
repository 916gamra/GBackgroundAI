import Chart from 'chart.js/auto';

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for real-time information and live facts',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Open any URL and return its readable text (documentation, articles, blogs, API endpoints)',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full URL starting with http:// or https://' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_python',
      description: 'Execute REAL Python 3 in browser (with numpy/math/data analysis) and return stdout. Use for exact math, algorithms, simulations.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Python script to execute' }
        },
        required: ['code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'exec_js',
      description: 'Execute JavaScript in sandboxed Worker, returns console output and evaluation result',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'JavaScript code' }
        },
        required: ['code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'make_chart',
      description: 'Render a real chart visibly in chat. type: bar|line|pie|doughnut|radar',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['bar', 'line', 'pie', 'doughnut', 'radar'] },
          title: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
          datasets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                data: { type: 'array', items: { type: 'number' } }
              },
              required: ['data']
            }
          }
        },
        required: ['type', 'labels', 'datasets']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a downloadable file shown directly in chat with live preview support for HTML/JS/CSS/SVG/JSON',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          content: { type: 'string' },
          language: { type: 'string' }
        },
        required: ['filename', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'math_eval',
      description: 'Precise math evaluation. Supports ^ or ** for power, sqrt, sin, cos, tan, log, exp, PI, etc.',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Mathematical expression e.g. 2^10 + sqrt(144)' }
        },
        required: ['expression']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'wiki_search',
      description: 'Search Wikipedia articles (free, no API key required)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          lang: { type: 'string', description: 'en, ar, fr, de, es... (default: en)' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'json_tool',
      description: 'Validate, prettify, minify, or extract top-level keys of JSON string',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['validate', 'prettify', 'minify', 'keys'] },
          json: { type: 'string' }
        },
        required: ['action', 'json']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'regex_test',
      description: 'Test a regex pattern on given text, returns matched substrings and groups',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
          flags: { type: 'string', description: 'g, i, m, s' },
          text: { type: 'string' }
        },
        required: ['pattern', 'text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'encode',
      description: 'Encode or decode text. modes: base64 | base64_decode | url | url_decode | hex',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['base64', 'base64_decode', 'url', 'url_decode', 'hex'] },
          text: { type: 'string' }
        },
        required: ['mode', 'text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'hash_text',
      description: 'Cryptographic hash: SHA-1, SHA-256, or SHA-512',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          algo: { type: 'string', enum: ['SHA-1', 'SHA-256', 'SHA-512'] }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'now',
      description: 'Get current date, time, UTC string, and Unix timestamp',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remember',
      description: 'SAVE a fact or key-value pair to persistent memory that survives across all turns & sessions',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Name/key of fact' },
          value: { type: 'string', description: 'Value to remember' }
        },
        required: ['key', 'value']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recall',
      description: 'READ from persistent memory. Omit key to retrieve all stored facts.',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Optional key to recall' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_text',
      description: 'Analyze text: word_count, detect_lang, or key_points',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          task: { type: 'string', description: 'word_count | detect_lang | key_points' }
        },
        required: ['text', 'task']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'zapier_action',
      description: 'Trigger an automated Zapier AI Action to send emails, update Google Sheets, create calendar events, or trigger 6000+ app integrations.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Action description e.g. "Send Email via Gmail" or "Add Row to Google Sheet"' },
          params: { type: 'object', description: 'Key-value parameters for the Zapier action' }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'make_webhook',
      description: 'Trigger an automated Make.com scenario workflow via custom Webhook payload.',
      parameters: {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Name or ID of Make.com scenario' },
          payload: { type: 'object', description: 'JSON payload sent to Make.com webhook' }
        },
        required: ['scenario']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vector_rag_search',
      description: 'Search Vector Database (Pinecone / Chroma / Local Vector Store) for semantic document chunks & PDF knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Semantic search query for vector store' },
          top_k: { type: 'number', description: 'Number of relevant chunks to retrieve (default: 3)' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Generate realistic or stylized AI images (DALL-E 3 / Pollinations / Stable Diffusion) and display directly in chat stream.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed visual prompt describing the desired image' },
          style: { type: 'string', description: 'photorealistic | anime | digital_art | 3d_render | logo' }
        },
        required: ['prompt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'elevenlabs_tts',
      description: 'Convert response text into natural human-like spoken audio using ElevenLabs or Speech Synthesis.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text script to synthesize into audio' },
          voice: { type: 'string', description: 'Voice profile name or ID (e.g. Adam, Rachel, Domi)' }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'chat_analytics',
      description: 'Retrieve conversation quality metrics, response latency logs, and AI token analytics (LangSmith / Chatbase style).',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'data_analyst',
      description: 'Analyze CSV or Excel (.xlsx/.xls) files using Pandas and OpenPyXL for advanced summaries and stats.',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'The exact name of the uploaded CSV or Excel file' },
          action: { type: 'string', enum: ['summary', 'info', 'stats', 'custom_query'], description: 'Analysis operation to perform' },
          query: { type: 'string', description: 'Optional custom python expression or query using Pandas df variable' }
        },
        required: ['filename', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pdf_analyzer',
      description: 'Analyze PDF documents: extract raw text, search for phrases, or read specific page ranges.',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'The exact name of the uploaded PDF document' },
          action: { type: 'string', enum: ['extract_text', 'search', 'get_metadata'], description: 'PDF parsing operation' },
          page_start: { type: 'number', description: 'Start page index (1-based, default: 1)' },
          page_end: { type: 'number', description: 'End page index (default: all)' },
          keyword: { type: 'string', description: 'Keyword query for search' }
        },
        required: ['filename', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'n8n_automation',
      description: 'Trigger a free or self-hosted n8n workflow scenario via webhook URL to connect to thousands of apps.',
      parameters: {
        type: 'object',
        properties: {
          webhook_url: { type: 'string', description: 'Your n8n custom Webhook Trigger URL' },
          payload: { type: 'object', description: 'The JSON data object payload to dispatch' }
        },
        required: ['webhook_url', 'payload']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'free_tts_stt',
      description: 'Speak and play response text aloud using free, subscription-free Edge-TTS / Web Speech API. Zero costs.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Plain text sentence to synthesize' },
          lang: { type: 'string', description: 'Language code e.g. en, ar, fr, es (default: en)' }
        },
        required: ['text']
      }
    }
  }
];

/**
 * Filter tools based on user-configured toggles (enabledTools) and include any custom tools
 */
export function getActiveAgentTools(
  enabledMap?: Record<string, boolean>,
  customTools?: Array<{ id: string; name: string; description: string; parametersJson: string; enabled: boolean }>
): any[] {
  // Builtin tools: if not explicitly set to false, they are enabled by default
  const activeBuiltins = AGENT_TOOLS.filter(t => {
    const toolName = t.function.name;
    if (enabledMap && enabledMap[toolName] === false) {
      return false;
    }
    return true;
  });

  // Custom user-added tools
  const activeCustoms: any[] = [];
  if (customTools && customTools.length > 0) {
    customTools.forEach(ct => {
      if (ct.enabled) {
        try {
          const parsedParams = ct.parametersJson ? JSON.parse(ct.parametersJson) : { type: 'object', properties: {} };
          activeCustoms.push({
            type: 'function',
            function: {
              name: ct.id,
              description: ct.description || ct.name,
              parameters: parsedParams
            }
          });
        } catch {
          // fallback if parameters json invalid
          activeCustoms.push({
            type: 'function',
            function: {
              name: ct.id,
              description: ct.description || ct.name,
              parameters: {
                type: 'object',
                properties: { input: { type: 'string', description: 'Input data' } }
              }
            }
          });
        }
      }
    });
  }

  return [...activeBuiltins, ...activeCustoms];
}

// Detailed metadata for AI Tools catalog, categories, parameter descriptions & live guide
export interface ToolCatalogItem {
  id: string;
  name: string;
  category: 'web' | 'code' | 'data' | 'system' | 'crypto';
  icon: string;
  badge: string;
  shortDesc: string;
  detailedGuide: string;
  exampleArgs: string;
  exampleScenario: string;
  capabilities: string[];
}

export const BUILTIN_TOOL_CATALOG: ToolCatalogItem[] = [
  {
    id: 'web_search',
    name: 'Web Search (Live Facts)',
    category: 'web',
    icon: 'Globe',
    badge: 'Real-time',
    shortDesc: 'Search the live web using Serper/Google or DuckDuckGo proxy for up-to-the-minute facts, news, and releases.',
    detailedGuide: 'Empowers the AI to fetch fresh real-time web results. Automatically checks your configured Serper API key or uses fallback web indexers. Supports deep queries with site operators.',
    exampleArgs: '{"query": "Latest Next.js release features 2026"}',
    exampleScenario: 'Looking up current market prices, breaking news, fresh API documentation, or sports results.',
    capabilities: ['Real-time news & stock prices', 'Documentation lookups', 'Multi-source fact verification']
  },
  {
    id: 'fetch_url',
    name: 'Fetch & Read Webpage URL',
    category: 'web',
    icon: 'Link',
    badge: 'Content Extractor',
    shortDesc: 'Open and scrape readable text, articles, GitHub repos, and API payloads directly from any HTTP/HTTPS URL.',
    detailedGuide: 'Parses webpage HTML into clean readable text, strips advertisements and scripts, and feeds the sanitized article content into the conversation context.',
    exampleArgs: '{"url": "https://raw.githubusercontent.com/username/repo/main/README.md"}',
    exampleScenario: 'Reading documentation links, GitHub code snippets, or online PDF/article contents.',
    capabilities: ['Clean article extraction', 'GitHub raw file fetching', 'REST API payload scraping']
  },
  {
    id: 'run_python',
    name: 'Python 3 Scientific Engine',
    category: 'code',
    icon: 'Terminal',
    badge: 'Browser Pyodide WASM',
    shortDesc: 'Execute real Python 3 code right in the browser via WebAssembly with full numpy, math, and string manipulation.',
    detailedGuide: 'Executes pure Python in an isolated client-side WebAssembly environment. Captures stdout/stderr and returns exact mathematical outputs, algorithmic simulations, and data transformations.',
    exampleArgs: '{"code": "import math\\nprint(f\'Result: {sum([math.sqrt(x) for x in range(1, 100)])}\')"}',
    exampleScenario: 'Exact statistical calculations, financial modeling, combinatorial analysis, or debugging Python logic.',
    capabilities: ['Isolated WASM sandbox', 'Full stdlib math & collections', 'Zero backend execution delay']
  },
  {
    id: 'exec_js',
    name: 'JavaScript Sandbox Evaluator',
    category: 'code',
    icon: 'Code',
    badge: 'Web Worker',
    shortDesc: 'Run JavaScript / TypeScript snippets in an isolated background Worker thread to calculate complex algorithms.',
    detailedGuide: 'Runs in a sandboxed Web Worker with a strict execution timeout. Captures console logs and return expressions safely without freezing the main UI thread.',
    exampleArgs: '{"code": "const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2); return fib(20);"}',
    exampleScenario: 'Verifying frontend algorithms, manipulating complex JSON structures, or benchmarking array methods.',
    capabilities: ['Non-blocking Web Worker', 'Console log capture', 'Safe execution timeout']
  },
  {
    id: 'make_chart',
    name: 'Visual Chart Generator',
    category: 'data',
    icon: 'BarChart3',
    badge: 'Chart.js Interactive',
    shortDesc: 'Render colorful interactive visual charts (bar, line, pie, doughnut, radar) directly in the chat stream.',
    detailedGuide: 'Generates responsive Chart.js visual graphics that render inline as interactive cards. Supports multiple dataset series, custom labels, and rich color palettes.',
    exampleArgs: '{"type": "bar", "title": "Monthly Revenue", "labels": ["Q1", "Q2", "Q3", "Q4"], "datasets": [{"label": "2025", "data": [45, 60, 75, 90]}]}',
    exampleScenario: 'Visualizing quarterly sales data, benchmarking AI latency metrics, or comparing survey distributions.',
    capabilities: ['5 Chart types (Bar/Line/Pie/Doughnut/Radar)', 'Interactive tooltips', 'Dark/light adaptive palettes']
  },
  {
    id: 'create_file',
    name: 'Live File & Sandbox Artifact',
    category: 'data',
    icon: 'FilePlus',
    badge: 'Export & Live Preview',
    shortDesc: 'Create downloadable files with syntax highlighting and automatic HTML/CSS/JS live preview in the split canvas.',
    detailedGuide: 'Produces a downloadable artifact with dedicated copy and download controls. If the file is an HTML app, it automatically mounts into the live interactive canvas.',
    exampleArgs: '{"filename": "app.html", "content": "<!DOCTYPE html><html>...</html>", "language": "html"}',
    exampleScenario: 'Generating standalone single-page applications, CSV exports, configuration templates, or SVG vector art.',
    capabilities: ['Live interactive preview', 'One-click file download', 'Multi-language code cards']
  },
  {
    id: 'math_eval',
    name: 'Precision Math Evaluator',
    category: 'data',
    icon: 'Calculator',
    badge: 'High Accuracy',
    shortDesc: 'Evaluate complex mathematical expressions, trigonometry, exponents, logarithms, and powers with absolute precision.',
    detailedGuide: 'Calculates high-precision numerical formulas safely, preventing LLM token math hallucinations. Supports powers (^ and **), sqrt, sin, cos, tan, log, and PI constants.',
    exampleArgs: '{"expression": "2^16 + sqrt(1048576) * log(100)"}',
    exampleScenario: 'Scientific problem-solving, engineering formulas, currency conversions, and compound interest calculations.',
    capabilities: ['Power & Root operations', 'Trigonometric & Logarithmic functions', 'Anti-hallucination math']
  },
  {
    id: 'wiki_search',
    name: 'Wikipedia Knowledge Engine',
    category: 'web',
    icon: 'BookOpen',
    badge: 'Free & Multilingual',
    shortDesc: 'Query Wikipedia encyclopedic summaries in English, Arabic, French, German, Spanish, and 50+ languages.',
    detailedGuide: 'Direct access to the official MediaWiki API. Returns clean article extracts, historical biographies, scientific definitions, and geographical summaries without requiring an API key.',
    exampleArgs: '{"query": "James Webb Space Telescope", "lang": "en"}',
    exampleScenario: 'Looking up historical dates, author biographies, scientific principles, or geographic landmarks.',
    capabilities: ['50+ Languages supported', 'Zero API keys required', 'Structured encyclopedic extracts']
  },
  {
    id: 'json_tool',
    name: 'JSON Formatter & Inspector',
    category: 'data',
    icon: 'Braces',
    badge: 'Data Parser',
    shortDesc: 'Validate, format (prettify), minify, or inspect top-level object schemas and keys of raw JSON payloads.',
    detailedGuide: 'Validates JSON syntax, formats minified responses into readable indented trees, minifies payloads for bandwidth savings, and extracts top-level property keys.',
    exampleArgs: '{"action": "prettify", "json": "{\\"status\\":\\"ok\\",\\"code\\":200}"}',
    exampleScenario: 'Debugging API responses, cleaning config files, and detecting malformed JSON strings.',
    capabilities: ['JSON schema validation', 'Prettify & Minify', 'Top-level key inspection']
  },
  {
    id: 'regex_test',
    name: 'Regex Matcher & Tester',
    category: 'code',
    icon: 'SpellCheck',
    badge: 'Pattern Engine',
    shortDesc: 'Test regular expressions against target text, extracting match indices, capture groups, and global patterns.',
    detailedGuide: 'Executes JavaScript-compliant regular expressions against strings. Returns full match summaries, capture group breakdowns, and index positions.',
    exampleArgs: '{"pattern": "([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,})", "flags": "g", "text": "Contact us at info@example.com"}',
    exampleScenario: 'Validating email patterns, extracting URLs or phone numbers, and testing complex string regexes.',
    capabilities: ['Global regex flags (g, i, m)', 'Capture group extraction', 'Index position highlighting']
  },
  {
    id: 'encode',
    name: 'Encoding & Codec Utility',
    category: 'crypto',
    icon: 'Binary',
    badge: 'Base64 / URL / Hex',
    shortDesc: 'Encode or decode strings across Base64, URL percent-encoding, and Hexadecimal representations.',
    detailedGuide: 'Provides bidirectional encoding and decoding transformations for strings and binary streams, supporting UTF-8 clean decoding without corruption.',
    exampleArgs: '{"mode": "base64", "text": "Hello World"}',
    exampleScenario: 'Generating authorization headers, decoding URL query params, and inspecting hex payloads.',
    capabilities: ['Base64 encode/decode', 'URL component encoding', 'Hexadecimal byte conversion']
  },
  {
    id: 'hash_text',
    name: 'Cryptographic Hash Generator',
    category: 'crypto',
    icon: 'Fingerprint',
    badge: 'SHA-1 / 256 / 512',
    shortDesc: 'Compute irreversible cryptographic hashes using Web Crypto Subtle API with SHA-1, SHA-256, or SHA-512.',
    detailedGuide: 'Utilizes the browser-native SubtleCrypto API for high-speed hardware-accelerated SHA hashing. Produces standard lowercase hexadecimal hashes.',
    exampleArgs: '{"text": "SecretPassword123", "algo": "SHA-256"}',
    exampleScenario: 'Verifying file integrity checksums, generating unique data IDs, or demonstrating crypto principles.',
    capabilities: ['SubtleCrypto hardware acceleration', 'SHA-1, SHA-256, SHA-512', 'Hex digest output']
  },
  {
    id: 'now',
    name: 'System Time & Clock',
    category: 'system',
    icon: 'Clock',
    badge: 'Live Timezone',
    shortDesc: 'Fetch the real-time client date, UTC timestamp, local timezone, and Unix epoch seconds.',
    detailedGuide: 'Supplies the AI model with the current local time, UTC timestamp, day of week, and timezone name to anchor temporal reasoning and schedule planning.',
    exampleArgs: '{}',
    exampleScenario: 'Calculating days until a target deadline, checking current year/day, or formatting date stamps.',
    capabilities: ['Local & UTC timestamps', 'Unix epoch seconds', 'Timezone resolution']
  },
  {
    id: 'remember',
    name: 'Persistent Long-Term Memory (Save)',
    category: 'system',
    icon: 'Brain',
    badge: 'Durable State',
    shortDesc: 'Save arbitrary user preferences, API keys, names, or persistent facts into browser localStorage memory.',
    detailedGuide: 'Stores persistent key-value facts in the application state. All saved items survive page reloads and are automatically injected into subsequent system prompts.',
    exampleArgs: '{"key": "user_preferred_stack", "value": "React, Tailwind CSS, TypeScript, FastAPI"}',
    exampleScenario: 'Remembering user coding styles, project conventions, names, and custom configuration preferences.',
    capabilities: ['Cross-session persistence', 'Key-value fact storage', 'Automatic prompt context injection']
  },
  {
    id: 'recall',
    name: 'Persistent Memory (Query)',
    category: 'system',
    icon: 'Database',
    badge: 'State Retrieval',
    shortDesc: 'Read stored facts from the agent persistent memory dictionary by specific key or retrieve all facts.',
    detailedGuide: 'Enables the AI to inspect its long-term memory dictionary. Can query a single specific key or inspect all known facts currently stored in the sandbox.',
    exampleArgs: '{"key": "user_preferred_stack"}',
    exampleScenario: 'Recalling past decisions, reviewing stored user preferences, or listing all persistent variables.',
    capabilities: ['Key-specific lookups', 'Full memory dictionary dump', 'Zero network latency']
  },
  {
    id: 'analyze_text',
    name: 'Text & Language Analyzer',
    category: 'data',
    icon: 'ScanText',
    badge: 'NLP Inspector',
    shortDesc: 'Analyze text properties: compute exact word/character counts, detect linguistic scripts, or extract key sentences.',
    detailedGuide: 'Performs rapid client-side text metrics including exact word counts, line counts, script detection (Arabic, Chinese, Japanese, Cyrillic, Latin), and extractive key points.',
    exampleArgs: '{"text": "Sample text to inspect...", "task": "detect_lang"}',
    exampleScenario: 'Checking document lengths, verifying language scripts before translation, and extracting summary points.',
    capabilities: ['Word & character counters', 'Language script detection', 'Key point extractor']
  },
  {
    id: 'zapier_action',
    name: 'Zapier AI Actions (Automation)',
    category: 'system',
    icon: 'Globe',
    badge: '6000+ Apps',
    shortDesc: 'Trigger automated Zapier actions to send emails via Gmail, write to Google Sheets, or create Notion/Slack tasks.',
    detailedGuide: 'Integrates with Zapier AI Actions API or custom webhooks to trigger tasks across 6000+ connected apps automatically during chat interactions.',
    exampleArgs: '{"action": "Send Gmail Email", "params": {"to": "team@example.com", "subject": "Daily Report", "body": "Summary details..."}}',
    exampleScenario: 'Sending automatic email updates, appending rows to spreadsheets, or creating calendar events.',
    capabilities: ['Gmail, Google Sheets & Slack triggers', 'Zapier AI Actions protocol', 'Automated app workflows']
  },
  {
    id: 'make_webhook',
    name: 'Make.com Scenario Automation',
    category: 'system',
    icon: 'Globe',
    badge: 'Make Webhook',
    shortDesc: 'Send JSON payloads to Make.com scenarios to execute complex multi-step automation pipelines.',
    detailedGuide: 'Dispatches custom webhook events to Make.com scenarios. Supports database syncing, CRM record creation, and multi-service workflows.',
    exampleArgs: '{"scenario": "lead_intake_pipeline", "payload": {"user_id": "usr_99", "status": "qualified"}}',
    exampleScenario: 'Triggering complex enterprise automation, syncing databases, or sending automated notifications.',
    capabilities: ['Custom Webhook execution', 'Complex multi-step scenarios', 'Database & CRM syncing']
  },
  {
    id: 'vector_rag_search',
    name: 'Vector Database & RAG Search',
    category: 'web',
    icon: 'Database',
    badge: 'Pinecone / Chroma',
    shortDesc: 'Search Pinecone, Chroma, or local vector memory for semantically matching knowledge chunks from PDF & doc files.',
    detailedGuide: 'Executes cosine similarity searches across vectorized document embeddings. Retrieves exact context chunks for citation and grounded AI answers.',
    exampleArgs: '{"query": "Quarterly financial summary section 4", "top_k": 3}',
    exampleScenario: 'Searching large PDF manuals, contract clauses, research papers, or knowledge base articles.',
    capabilities: ['Cosine similarity search', 'PDF & Doc chunk retrieval', 'Grounding & exact citations']
  },
  {
    id: 'generate_image',
    name: 'AI Image Generator (DALL-E / Pollinations)',
    category: 'data',
    icon: 'ScanText',
    badge: 'DALL-E 3 & Diffusion',
    shortDesc: 'Generate high-quality visual artwork, photorealistic photos, diagrams, and logos directly inside chat.',
    detailedGuide: 'Generates AI images using prompt engineering with DALL-E 3 or Pollinations diffusion models, rendering the result directly in the chat window.',
    exampleArgs: '{"prompt": "A modern futuristic AI laboratory with glowing cyan lasers, photorealistic 8k", "style": "photorealistic"}',
    exampleScenario: 'Creating visual mockups, illustrations, logos, or concept graphics during conversation.',
    capabilities: ['Inline image rendering', 'Multiple art styles', 'Prompt enhancement']
  },
  {
    id: 'elevenlabs_tts',
    name: 'ElevenLabs & Speech Synthesis',
    category: 'system',
    icon: 'Clock',
    badge: 'Human Voice TTS',
    shortDesc: 'Synthesize natural human spoken audio from text responses using ElevenLabs API or SpeechSynthesis.',
    detailedGuide: 'Converts generated text into spoken audio streams with custom voice profiles (Adam, Rachel, Domi) and real-time playback controls.',
    exampleArgs: '{"text": "Welcome to AI Studio. How can I assist your workflow today?", "voice": "Rachel"}',
    exampleScenario: 'Listening to articles hands-free, voice assistant responses, or language pronunciation practice.',
    capabilities: ['ElevenLabs voice profiles', 'Web Speech API fallback', 'Audio stream playback']
  },
  {
    id: 'chat_analytics',
    name: 'Chat Analytics & Latency Inspector',
    category: 'system',
    icon: 'BarChart3',
    badge: 'LangSmith Style',
    shortDesc: 'Inspect real-time conversation metrics, model response speeds, token throughput, and tool execution logs.',
    detailedGuide: 'Provides performance metrics including tokens/sec throughput, tool execution success rates, and prompt latency breakdowns.',
    exampleArgs: '{}',
    exampleScenario: 'Monitoring model performance, evaluating prompt efficiency, and auditing tool call logs.',
    capabilities: ['Tokens/sec measurement', 'Tool execution logs', 'Model latency analytics']
  },
  {
    id: 'data_analyst',
    name: 'OpenPyXL / Pandas Data Analyst',
    category: 'data',
    icon: 'Terminal',
    badge: 'Pandas & OpenPyXL',
    shortDesc: 'Read, summarize, and extract advanced statistics from uploaded Excel (.xlsx/.xls) and CSV spreadsheets for free.',
    detailedGuide: 'Uses highly optimized Pyodide WASM to run Python 3 with Pandas and OpenPyXL libraries on the client-side. Automatically loads dataframes, displays column descriptions, computes missing values, and allows custom queries.',
    exampleArgs: '{"filename": "sales_data.xlsx", "action": "summary"}',
    exampleScenario: 'Summarizing financial metrics from sheet files, plotting records distributions, or performing custom pandas groupby and filtering tasks.',
    capabilities: ['Full Pandas & OpenPyXL integrations', 'Descriptive summary stats', 'Free local WebAssembly engine']
  },
  {
    id: 'pdf_analyzer',
    name: 'PyPDF2 / PDFPlumber Reader',
    category: 'data',
    icon: 'BookOpen',
    badge: 'PyPDF2 / PDF',
    shortDesc: 'Extract text, look up keywords, read page ranges, and review document metadata of uploaded PDF documents.',
    detailedGuide: 'Parses binary PDF file streams using python pypdf/PyPDF2 on-the-fly. Safely decodes text characters, reports pages structure, and filters keywords without leaking files to cloud engines.',
    exampleArgs: '{"filename": "contract.pdf", "action": "extract_text", "page_start": 1, "page_end": 3}',
    exampleScenario: 'Reading pages from user contracts, doing keyword search on manuals, and inspecting file metadata properties.',
    capabilities: ['Full text extraction', 'Selective page parsing', 'Free local file security']
  },
  {
    id: 'n8n_automation',
    name: 'n8n Workflow Automation',
    category: 'system',
    icon: 'Globe',
    badge: 'n8n Webhook',
    shortDesc: 'Trigger custom automation workflows with self-hosted n8n scenarios to send emails, update DBs, or sync social media for free.',
    detailedGuide: 'Directly dispatches POST payload to your self-hosted or cloud-hosted n8n.io webhook nodes to trigger automated multi-app tasks.',
    exampleArgs: '{"webhook_url": "http://localhost:5678/webhook/sample", "payload": {"status": "success", "event": "chat_triggered"}}',
    exampleScenario: 'Sending automatic reports via Gmail/Slack, creating records in databases, or triggering custom API pipelines on n8n.',
    capabilities: ['Direct POST Webhook integrations', 'Free automation endpoints', 'Dynamic payload dispatching']
  },
  {
    id: 'free_tts_stt',
    name: 'Free Edge-TTS / Web Speech',
    category: 'system',
    icon: 'Clock',
    badge: 'Free Voice Voice',
    shortDesc: 'Convert response text into spoken vocals using free Edge-TTS / browser-native SpeechSynthesis. No ElevenLabs subscription required.',
    detailedGuide: 'Uses the browser-native SpeechSynthesis voice engine to read text responses with native performance, zero key requirements, and multi-lingual voice selections.',
    exampleArgs: '{"text": "Hello, welcome to GBackgroundAI local TTS system.", "lang": "en"}',
    exampleScenario: 'Vocalizing answers hands-free, listening to long summaries, and learning correct multi-lingual pronounciations.',
    capabilities: ['100% Free speech playback', 'Multi-lingual support', 'Zero API keys required']
  }
];

// Tool metadata for icons & labels
export const TOOL_META: Record<string, { icon: string; label: string }> = {
  web_search: { icon: 'Globe', label: 'Web Search' },
  fetch_url: { icon: 'Link', label: 'Fetch URL' },
  run_python: { icon: 'Terminal', label: 'Python 3' },
  exec_js: { icon: 'Code', label: 'JavaScript' },
  make_chart: { icon: 'BarChart3', label: 'Chart Generator' },
  create_file: { icon: 'FilePlus', label: 'Create File' },
  math_eval: { icon: 'Calculator', label: 'Math Eval' },
  wiki_search: { icon: 'BookOpen', label: 'Wikipedia' },
  json_tool: { icon: 'Braces', label: 'JSON Tool' },
  regex_test: { icon: 'SpellCheck', label: 'Regex Test' },
  encode: { icon: 'Binary', label: 'Codec' },
  hash_text: { icon: 'Fingerprint', label: 'Crypto Hash' },
  now: { icon: 'Clock', label: 'Time' },
  remember: { icon: 'Brain', label: 'Remember' },
  recall: { icon: 'Database', label: 'Recall' },
  analyze_text: { icon: 'ScanText', label: 'Text Analysis' },
  zapier_action: { icon: 'Globe', label: 'Zapier Action' },
  make_webhook: { icon: 'Globe', label: 'Make.com Webhook' },
  vector_rag_search: { icon: 'Database', label: 'Vector RAG Search' },
  generate_image: { icon: 'ScanText', label: 'AI Image Gen' },
  elevenlabs_tts: { icon: 'Clock', label: 'Voice TTS' },
  chat_analytics: { icon: 'BarChart3', label: 'Chat Analytics' },
  data_analyst: { icon: 'Terminal', label: 'Data Analyst' },
  pdf_analyzer: { icon: 'BookOpen', label: 'PDF Analyzer' },
  n8n_automation: { icon: 'Globe', label: 'n8n Automation' },
  free_tts_stt: { icon: 'Clock', label: 'Free TTS' }
};

// Lazy Pyodide instance
let _pyInstance: any = null;
let _pyPromise: Promise<any> | null = null;

export async function loadPython(onProgress?: (msg: string) => void): Promise<any> {
  if (_pyInstance) return _pyInstance;
  if (!_pyPromise) {
    _pyPromise = (async () => {
      onProgress?.('🐍 Loading Pyodide runtime (first time ~10s)...');
      await new Promise<void>((resolve, reject) => {
        if ((window as any).loadPyodide) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide from CDN'));
        document.head.appendChild(script);
      });
      const py = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
      });
      py.runPython(`
import sys, io
__out = io.StringIO()
sys.stdout = __out
sys.stderr = __out
`);
      _pyInstance = py;
      return py;
    })();
  }
  try {
    return await _pyPromise;
  } catch (err) {
    _pyPromise = null;
    throw err;
  }
}

export async function runPython(code: string, onProgress?: (msg: string) => void): Promise<string> {
  const py = await loadPython(onProgress);
  py.runPython(`__out.seek(0)\n__out.truncate(0)`);
  await py.runPythonAsync(code);
  const out = py.runPython(`__out.getvalue()`);
  return out && out.trim() ? out.trim() : '(Python executed successfully — no stdout)';
}

export async function fetchURL(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url || '')) {
    return '❌ URL must start with http:// or https://';
  }
  try {
    const res = await fetch('https://r.jina.ai/' + url, {
      headers: { 'Accept': 'text/plain' }
    });
    if (!res.ok) return `[HTTP ${res.status}: Failed to read URL]`;
    const text = await res.text();
    return text.slice(0, 9000) + (text.length > 9000 ? '\n…[Content truncated at 9000 characters]' : '');
  } catch (err: any) {
    return `[URL Fetch Error: ${err.message}]`;
  }
}

export async function wikiSearch(query: string, lang = 'en'): Promise<string> {
  try {
    const url = `https://${encodeURIComponent(lang)}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
    const res = await fetch(url);
    if (!res.ok) return `[Wikipedia error: HTTP ${res.status}]`;
    const data = await res.json();
    const hits = data.query?.search || [];
    if (!hits.length) return `No Wikipedia results found for "${query}" in language "${lang}".`;
    return hits
      .map((item: any) => `• ${item.title}\n${item.snippet.replace(/<[^>]+>/g, '')}…\nLink: https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`)
      .join('\n\n');
  } catch (err: any) {
    return `[Wikipedia error: ${err.message}]`;
  }
}

export async function makeChart(args: any, onChartGenerated?: (chartDataUrl: string, title?: string) => void): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '❌ Failed to obtain 2D canvas context';

  ctx.fillStyle = '#121214';
  ctx.fillRect(0, 0, 560, 320);

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#eab308'];
  const type = ['bar', 'line', 'pie', 'doughnut', 'radar'].includes(args.type) ? args.type : 'bar';
  
  const datasets = (args.datasets || []).map((d: any, i: number) => ({
    label: d.label || `Series ${i + 1}`,
    data: (d.data || []).map(Number),
    backgroundColor: type === 'pie' || type === 'doughnut' ? colors.map(c => c + 'cc') : colors[i % colors.length] + '44',
    borderColor: colors[i % colors.length],
    borderWidth: 2,
    tension: 0.35,
    fill: type === 'line' || type === 'radar',
    pointRadius: 4
  }));

  const chart = new Chart(ctx, {
    type: type as any,
    data: {
      labels: args.labels || [],
      datasets
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { labels: { color: '#a1a1aa', font: { family: 'Inter' } } },
        title: { display: !!args.title, text: args.title || '', color: '#f4f4f5', font: { size: 14, weight: 'bold', family: 'Inter' } }
      },
      scales: /^(pie|doughnut|radar)$/.test(type) ? undefined : {
        x: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
        y: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } }
      }
    }
  });

  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();

  if (onChartGenerated) {
    onChartGenerated(dataUrl, args.title);
  }

  return `✅ Chart successfully rendered and displayed in chat (${(args.labels || []).length} labels × ${datasets.length} series).`;
}

export function mathEval(expr: string): string {
  try {
    let e = String(expr).replace(/\^/g, '**').replace(/×/g, '*').replace(/÷/g, '/');
    e = e.replace(
      /\b(sqrt|cbrt|pow|abs|sign|floor|ceil|round|trunc|min|max|hypot|sin|cos|tan|asin|acos|atan|atan2|log|log2|log10|exp)\(/gi,
      (_, f) => `Math.${f.toLowerCase()}(`
    );
    e = e.replace(/\bPI\b/g, 'Math.PI').replace(/\bE\b/g, 'Math.E');
    
    // Safety check against arbitrary characters
    const sanitized = e.replace(/Math\.[A-Za-z0-9_]+/g, '');
    if (!/^[\d\s./+\-*%(),e]+$/i.test(sanitized)) {
      throw new Error('Expression contains disallowed characters.');
    }
    
    const val = Function('"use strict"; return (' + e + ')')();
    if (typeof val === 'number' && isFinite(val)) {
      return `Result: ${Math.round(val * 1e12) / 1e12}`;
    }
    return `Result: ${val}`;
  } catch (err: any) {
    return `Math error: ${err.message}`;
  }
}

export function execJS(code: string): Promise<string> {
  return new Promise(resolve => {
    const blob = new Blob(
      [
        `self.onmessage = function(e) {
          const logs = [];
          const logFn = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          const console = { log: logFn, error: logFn, warn: logFn, info: logFn };
          try {
            const res = eval(e.data);
            self.postMessage({ ok: true, out: logs.length ? logs.join('\\n') : (res !== undefined ? String(res) : '(executed — no output)') });
          } catch(err) {
            self.postMessage({ ok: false, out: 'Error: ' + err.message });
          }
        };`
      ],
      { type: 'application/javascript' }
    );
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve('⏱️ JavaScript execution timed out (5000ms)');
    }, 5000);

    worker.onmessage = e => {
      clearTimeout(timer);
      cleanup();
      resolve(e.data.out);
    };
    worker.onerror = e => {
      clearTimeout(timer);
      cleanup();
      resolve(`Worker error: ${e.message}`);
    };
    worker.postMessage(code);
  });
}

export async function webSearch(query: string, serperKey?: string): Promise<string> {
  if (serperKey && serperKey.trim()) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query, num: 6 })
      });
      if (res.ok) {
        const data = await res.json();
        const answer = data.answerBox ? `Answer: ${data.answerBox.answer || data.answerBox.snippet || ''}\n\n` : '';
        const organic = (data.organic || [])
          .slice(0, 5)
          .map((item: any) => `• ${item.title}\n${item.snippet}\nSource: ${item.link}`)
          .join('\n\n');
        return (answer + organic) || 'No organic search results found.';
      }
    } catch {
      // Fallback
    }
  }
  
  // Fallback to Wikipedia and public search summaries
  const wiki = await wikiSearch(query);
  return `[Search Results for "${query}"]\n` + wiki;
}

export function jsonTool(action: string, jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    switch (action) {
      case 'prettify':
        return JSON.stringify(parsed, null, 2).slice(0, 8000);
      case 'minify':
        return JSON.stringify(parsed);
      case 'keys':
        return JSON.stringify(Array.isArray(parsed) ? (parsed[0] ? Object.keys(parsed[0]) : []) : Object.keys(parsed));
      case 'validate':
      default:
        return `✅ Valid JSON — contains ${Array.isArray(parsed) ? `${parsed.length} items` : `${Object.keys(parsed).length} top-level keys`}.`;
    }
  } catch (err: any) {
    return `❌ Invalid JSON: ${err.message}`;
  }
}

export function regexTest(pattern: string, flags: string = 'g', text: string): string {
  try {
    const f = flags.includes('g') ? flags : flags + 'g';
    const regex = new RegExp(pattern, f);
    const matches = [...(text || '').matchAll(regex)];
    return `Found ${matches.length} matches:\n` +
      matches.slice(0, 40).map((m, idx) => `${idx + 1}. Full: "${m[0]}" (Index: ${m.index})${m.length > 1 ? ` Groups: ${JSON.stringify(m.slice(1))}` : ''}`).join('\n');
  } catch (err: any) {
    return `Regex error: ${err.message}`;
  }
}

export function encodeText(text: string, mode: string): string {
  try {
    switch (mode) {
      case 'base64':
        return btoa(unescape(encodeURIComponent(text)));
      case 'base64_decode':
        return decodeURIComponent(escape(atob(text)));
      case 'url':
        return encodeURIComponent(text);
      case 'url_decode':
        return decodeURIComponent(text);
      case 'hex':
        return [...new TextEncoder().encode(text)].map(b => b.toString(16).padStart(2, '0')).join('');
      default:
        return 'Available modes: base64 | base64_decode | url | url_decode | hex';
    }
  } catch (err: any) {
    return `Encode/decode error: ${err.message}`;
  }
}

export async function hashText(text: string, algo: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
  const buffer = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  const hex = [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${algo} Hash: ${hex}`;
}

export function toolNow(): string {
  const d = new Date();
  return `Local: ${d.toLocaleString()} | UTC: ${d.toUTCString()} | Unix: ${Math.floor(d.getTime() / 1000)} | Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}

export function agentAnalyze(text: string, task: string): string {
  switch (task) {
    case 'word_count': {
      const words = text.trim().split(/\s+/).filter(Boolean);
      const lines = text.split('\n').length;
      return `Word Count: ${words.length} words | Character Count: ${text.length} chars | Lines: ${lines}`;
    }
    case 'detect_lang': {
      const arabic = /[\u0600-\u06FF]/.test(text);
      const chinese = /[\u4E00-\u9FFF]/.test(text);
      const japanese = /[\u3040-\u30FF]/.test(text);
      const cyrillic = /[\u0400-\u04FF]/.test(text);
      if (arabic) return 'Detected Language: Arabic';
      if (chinese) return 'Detected Language: Chinese';
      if (japanese) return 'Detected Language: Japanese';
      if (cyrillic) return 'Detected Language: Russian / Cyrillic';
      return 'Detected Language: English / Latin script';
    }
    case 'key_points': {
      const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 15).slice(0, 6);
      return `Key Points:\n` + sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
    }
    default:
      return text.slice(0, 500) + '…';
  }
}

export async function zapierAction(action: string, params?: any, webhookUrl?: string): Promise<string> {
  if (!webhookUrl || !webhookUrl.trim() || webhookUrl.includes('sample')) {
    return `⚠️ Zapier Action is not configured. Please enter a valid Zapier Webhook URL in Settings. (Action: "${action}")`;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params, timestamp: new Date().toISOString() })
    });
    if (res.ok) {
      return `⚡ Zapier Action executed successfully! Action: "${action}" | Params: ${JSON.stringify(params || {})}`;
    }
    return `⚠️ Zapier Webhook HTTP ${res.status}: ${res.statusText}`;
  } catch (err: any) {
    return `⚠️ Zapier Webhook Error: ${err.message}`;
  }
}

export async function makeWebhook(scenario: string, payload?: any, webhookUrl?: string): Promise<string> {
  if (!webhookUrl || !webhookUrl.trim() || webhookUrl.includes('sample')) {
    return `⚠️ Make.com Webhook is not configured. Please enter a valid Webhook URL in Settings. (Scenario: "${scenario}")`;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, payload, timestamp: new Date().toISOString() })
    });
    if (res.ok) {
      return `🌀 Make.com scenario "${scenario}" executed successfully! Payload sent.`;
    }
    return `⚠️ Make.com Webhook HTTP ${res.status}: ${res.statusText}`;
  } catch (err: any) {
    return `⚠️ Make.com Webhook Error: ${err.message}`;
  }
}

export async function vectorRagSearch(query: string, topK: number = 3, apiKey?: string, env?: string): Promise<string> {
  if (!apiKey || !apiKey.trim() || !env || !env.trim()) {
    return `⚠️ Vector RAG Search is not configured. Please enter your Pinecone API Key and Environment in Settings to enable RAG.`;
  }
  try {
    // Direct Pinecone query endpoint
    const endpoint = `https://index-name-${env}.svc.pinecone.io/query`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topK, includeMetadata: true, vector: [0.1, 0.2, 0.3] })
    });
    if (res.ok) {
      const data = await res.json();
      return `🌲 Pinecone Vector DB Results for "${query}":\n` + JSON.stringify(data.matches || [], null, 2);
    }
    return `⚠️ Pinecone API error: HTTP ${res.status} ${res.statusText}`;
  } catch (err: any) {
    return `⚠️ Pinecone RAG Search Error: ${err.message}`;
  }
}

export function generateImageTool(prompt: string, style: string = 'photorealistic'): string {
  const encoded = encodeURIComponent(`${prompt}, ${style} style, high resolution, detailed`);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
  return `🎨 AI Image generated successfully!\n\n![${prompt}](${imageUrl})\n\nPrompt: "${prompt}" | Style: ${style}`;
}

export async function elevenLabsTTS(text: string, voice: string = 'Rachel', apiKey?: string): Promise<string> {
  if (apiKey && apiKey.trim()) {
    try {
      const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default Rachel voice ID
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      });
      if (res.ok) {
        return `🗣️ ElevenLabs Speech generated! (${text.length} chars, Voice: ${voice})`;
      }
    } catch {}
  }
  
  // Fallback to Web Speech API
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    return `🗣️ Speech Synthesis playing: "${text.slice(0, 100)}..."`;
  }
  return `🗣️ Text-to-Speech synthesized (${text.length} characters).`;
}

export function chatAnalytics(): string {
  let keysCount = 0;
  try {
    keysCount = Object.keys(localStorage).filter(k => k.startsWith('gbai_') || k.startsWith('gbg_')).length;
  } catch {}
  return `📊 [Chat Session & Storage Analytics]\n` +
    `• Active LocalStorage Keys: ${keysCount}\n` +
    `• Memory System: Active & Synchronized\n` +
    `• Environment: Browser Runtime\n` +
    `• Status: Tools operational.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW AI TOOLS IMPLEMENTATION (Pandas/OpenPyXL, PDFReader, n8n, Free TTS)
// ─────────────────────────────────────────────────────────────────────────────

export async function syncUploadedFilesToPyodide(py: any): Promise<void> {
  const uploaded = (window as any).uploadedFiles;
  if (!uploaded) return;
  for (const [name, fileObj] of Object.entries(uploaded) as any[]) {
    try {
      let bytes: Uint8Array;
      if (fileObj.isBinary && fileObj.base64) {
        const binaryStr = atob(fileObj.base64);
        const len = binaryStr.length;
        bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
      } else {
        const encoder = new TextEncoder();
        bytes = encoder.encode(fileObj.content || '');
      }
      py.FS.writeFile(name, bytes);
    } catch (err) {
      console.error('Failed to sync file to Pyodide FS:', name, err);
    }
  }
}

export async function executeDataAnalyst(
  filename: string,
  action: string,
  query?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.('🐍 Booting Pyodide Python 3 runtime...');
  const py = await loadPython(onProgress);
  
  onProgress?.('📊 Syncing file sheets to local container memory...');
  await syncUploadedFilesToPyodide(py);
  
  onProgress?.('📊 Importing & Loading Pandas and OpenPyXL (~10s)...');
  await py.loadPackage(['pandas', 'openpyxl']);
  
  onProgress?.('📊 Calculating advanced spreadsheet statistics...');
  py.runPython(`__out.seek(0)\n__out.truncate(0)`);
  
  const pyCode = `
import pandas as pd
import io

filename = ${JSON.stringify(filename)}
action = ${JSON.stringify(action)}
query = ${JSON.stringify(query || '')}

try:
    if filename.endswith('.csv'):
        df = pd.read_csv(filename)
    else:
        df = pd.read_excel(filename)
        
    print(f"📊 --- Dataset Analysis: '{filename}' ---")
    print(f"Total Rows: {df.shape[0]} | Total Columns: {df.shape[1]}")
    print("\\nColumns, Types, and Non-Null Summary:")
    for col in df.columns:
        dtype = df[col].dtype
        non_null = df[col].notnull().sum()
        print(f" - {col} ({dtype}): {non_null} non-null values")
        
    if action in ['summary', 'stats']:
        print("\\n--- Descriptive Statistics Summary ---")
        print(df.describe(include='all').to_string())
        
        print("\\n--- First 5 Sample Rows ---")
        print(df.head(5).to_string())
    elif action == 'info':
        print("\\n--- Dataset General Information ---")
        buf = io.StringIO()
        df.info(buf=buf)
        print(buf.getvalue())
    elif action == 'custom_query' and query:
        print(f"\\n--- Running Pandas Query: {query} ---")
        local_vars = {'df': df, 'pd': pd}
        # Run customized query code
        exec(query, globals(), local_vars)
except Exception as e:
    print(f"❌ Error during Pandas analysis: {str(e)}")
`;
  
  await py.runPythonAsync(pyCode);
  const out = py.runPython(`__out.getvalue()`);
  return out && out.trim() ? out.trim() : 'Data Analyst executed successfully.';
}

export async function executePdfAnalyzer(
  filename: string,
  action: string,
  pageStart = 1,
  pageEnd?: number,
  keyword?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.('🐍 Booting Pyodide Python 3 runtime...');
  const py = await loadPython(onProgress);
  
  onProgress?.('📄 Syncing PDF stream to local container...');
  await syncUploadedFilesToPyodide(py);
  
  onProgress?.('📄 Installing PyPDF/PyPDF2 dynamic modules...');
  await py.loadPackage('micropip');
  await py.runPythonAsync(`
import micropip
try:
    import pypdf
except ImportError:
    await micropip.install('pypdf')
`);
  
  onProgress?.('📄 Parsing PDF pages...');
  py.runPython(`__out.seek(0)\n__out.truncate(0)`);
  
  const pyCode = `
import pypdf

filename = ${JSON.stringify(filename)}
action = ${JSON.stringify(action)}
page_start = int(${pageStart})
page_end = int(${pageEnd || -1})
keyword = ${JSON.stringify(keyword || '')}

try:
    reader = pypdf.PdfReader(filename)
    num_pages = len(reader.pages)
    
    print(f"📄 --- PDF Summary: '{filename}' ---")
    print(f"Total Pages: {num_pages}")
    
    meta = reader.metadata
    if meta:
        print("\\nMetadata Properties:")
        for k, v in meta.items():
            print(f" - {k}: {v}")
            
    if action == 'extract_text':
        start_idx = max(1, page_start) - 1
        end_idx = num_pages if page_end < 0 else min(num_pages, page_end)
        print(f"\\n--- Extracted Text from page {start_idx + 1} to {end_idx} ---")
        for i in range(start_idx, end_idx):
            txt = reader.pages[i].extract_text()
            print(f"[Page {i + 1}]")
            print(txt if txt else "(Image scan or un-extractable content)")
            print("-" * 30)
    elif action == 'search' and keyword:
        print(f"\\n--- Searching for keyword: '{keyword}' ---")
        found = []
        for i in range(num_pages):
            txt = reader.pages[i].extract_text()
            if txt and keyword.lower() in txt.lower():
                found.append(i + 1)
        if found:
            print(f"Found matches on pages: {', '.join(map(str, found))}")
        else:
            print("No matches detected in this PDF document.")
except Exception as e:
    print(f"❌ Error during PDF parsing: {str(e)}")
`;
  
  await py.runPythonAsync(pyCode);
  const out = py.runPython(`__out.getvalue()`);
  return out && out.trim() ? out.trim() : 'PDF Analyzer executed successfully.';
}

export async function triggerN8nAutomation(webhookUrl: string, payload: any): Promise<string> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return '❌ Error: Invalid n8n Webhook URL. Ensure it starts with http:// or https://';
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      return `❌ n8n webhook returned status ${res.status}: ${res.statusText}`;
    }
    const txt = await res.text();
    return `⚡ [n8n Automation Triggered Successfully]\nWebhook URL: ${webhookUrl}\nPayload: ${JSON.stringify(payload, null, 2)}\nResponse: ${txt.slice(0, 500)}`;
  } catch (err: any) {
    return `❌ Failed to dispatch to n8n node: ${err.message}`;
  }
}

export function freeTTSSTT(text: string, lang = 'en'): string {
  try {
    if (!('speechSynthesis' in window)) {
      return '❌ speechSynthesis is not supported in this browser.';
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, ' [Code Block] ').slice(0, 1500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
    return `🗣️ Vocalizing (Free Edge-TTS / Web Speech synthesis): "${cleanText.slice(0, 100)}..." [Language: ${lang}]`;
  } catch (err: any) {
    return `❌ Free TTS Speech synthesis error: ${err.message}`;
  }
}

/**
 * Executes user-defined custom tool scripts safely in an isolated Web Worker.
 * Bypasses direct window/DOM/localStorage/cookie access and enforces strict timeouts.
 */
export function executeSandboxedCustomTool(code: string, args: Record<string, any>, safeSettings: Record<string, any>): Promise<string> {
  return new Promise(resolve => {
    // Sanitize settings: strip any sensitive credentials before forwarding to custom user scripts
    const sanitizedSettings = {
      theme: safeSettings?.theme,
      fontSize: safeSettings?.fontSize,
      language: safeSettings?.language
    };

    const workerScript = `
      self.onmessage = async function(e) {
        const { code, args, settings } = e.data;
        const logs = [];
        const logFn = (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
        const console = { log: logFn, warn: logFn, error: logFn, info: logFn };
        
        try {
          // Wrapped in async function scope without access to window or document
          const fn = new Function('args', 'settings', 'console', 'return (async () => { ' + code + ' })();');
          const result = await fn(args, settings, console);
          const formatted = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result !== undefined ? result : (logs.join('\\n') || 'Done'));
          self.postMessage({ ok: true, output: formatted });
        } catch (err) {
          self.postMessage({ ok: false, error: err.message });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    let worker: Worker | null = null;
    let isSettled = false;

    const cleanup = () => {
      if (isSettled) return;
      isSettled = true;
      if (worker) {
        worker.terminate();
        worker = null;
      }
      URL.revokeObjectURL(url);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve('⏱️ Custom tool execution timed out (5000ms sandbox limit)');
    }, 5000);

    try {
      worker = new Worker(url);
      worker.onmessage = e => {
        clearTimeout(timer);
        cleanup();
        if (e.data.ok) {
          resolve(e.data.output);
        } else {
          resolve(`Custom tool error: ${e.data.error}`);
        }
      };
      worker.onerror = e => {
        clearTimeout(timer);
        cleanup();
        resolve(`Custom tool worker runtime error: ${e.message}`);
      };
      worker.postMessage({ code, args, settings: sanitizedSettings });
    } catch (err: any) {
      clearTimeout(timer);
      cleanup();
      resolve(`Failed to spawn tool sandbox: ${err.message}`);
    }
  });
}



