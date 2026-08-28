import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Cpu,
  Smartphone,
  Brain,
  Terminal,
  Shield,
  Copy,
  Check,
  Database,
  Search,
  RefreshCw,
  Layers,
  ArrowLeft,
  Play
} from 'lucide-react';
import { gSoulEngine } from '../../services/GSoulEngine';
import { executeModbusTool } from '../../services/agentTools';
import { executeTermuxBridge } from '../../services/agentTools';

interface DeveloperDocsPageProps {
  onBack: () => void;
}

export const DeveloperDocsPage: React.FC<DeveloperDocsPageProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'soul' | 'modbus' | 'termux' | 'tools' | 'oneui' | 'testing'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Soul Metrics
  const [soulMetrics, setSoulMetrics] = useState<{
    soulCount: number;
    episodesCount: number;
    semanticCount: number;
    workingCount: number;
    storageUsageBytes: number;
  }>({ soulCount: 1, episodesCount: 0, semanticCount: 0, workingCount: 0, storageUsageBytes: 0 });

  // Interactive Live Tester state
  const [testTool, setTestTool] = useState<'modbus' | 'termux'>('modbus');
  const [modbusHost, setModbusHost] = useState('127.0.0.1');
  const [modbusAction, setModbusAction] = useState('read_holding_registers');
  const [modbusAddr, setModbusAddr] = useState(40001);
  const [modbusCount, setModbusCount] = useState(4);
  const [modbusFormat, setModbusFormat] = useState<'uint16' | 'float32_be' | 'ascii' | 'hex'>('float32_be');
  const [termuxCmd, setTermuxCmd] = useState('battery_status');
  const [testOutput, setTestOutput] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadSoulStats();
  }, []);

  const loadSoulStats = async () => {
    try {
      const stats = await gSoulEngine.getMetrics();
      setSoulMetrics(stats);
    } catch {}
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runLiveTest = async () => {
    setIsTesting(true);
    setTestOutput('⏳ Executing tool operation in secure sandbox...');
    try {
      if (testTool === 'modbus') {
        const res = await executeModbusTool({
          host: modbusHost,
          action: modbusAction,
          address: modbusAddr,
          count: modbusCount,
          decode_format: modbusFormat
        });
        setTestOutput(res);
      } else {
        const res = await executeTermuxBridge({
          command: termuxCmd,
          text: 'Test message from GBackgroundAI Developer Suite'
        });
        setTestOutput(res);
      }
      loadSoulStats();
    } catch (e: any) {
      setTestOutput(`❌ Execution Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-[#f4f4f5] overflow-y-auto overscroll-contain">
      {/* Samsung One UI Header: Top 30% Viewing Area */}
      <div className="p-6 md:p-8 bg-[#0d0d10] border-b border-zinc-800/80 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 active:scale-95 transition-all"
              title="Back to App"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Beast v14 Architecture
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Capricorn ♑ Persona
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-white">
                Developer Documentation & API Hub
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                دليل المطورين وهندسة النظام — المعمارية، السجلات، الذاكرة Dexie، وأدوات العتاد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search APIs, tools, schemas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto mt-6 pb-1 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Philosophy', icon: BookOpen },
            { id: 'soul', label: 'GSoul Engine (Dexie)', icon: Brain },
            { id: 'modbus', label: 'Modbus PLC Engine', icon: Cpu },
            { id: 'termux', label: 'Termux Android Bridge', icon: Smartphone },
            { id: 'tools', label: 'Tool Schemas', icon: Terminal },
            { id: 'oneui', label: 'One UI Design System', icon: Layers },
            { id: 'testing', label: 'Live Test Sandbox', icon: Play }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-102'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full p-6 md:p-8 space-y-8 flex-1">
        {/* SECTION 1: OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center gap-3 text-amber-400 mb-2">
                  <Brain size={22} />
                  <h3 className="font-bold text-white text-base">Capricorn ♑ Persona</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  هوية هندسية منضبطة تركز على البناء المنهجي، الحسابات الدقيقة، استخدام الأدوات الحقيقية، والحديث بالدارجة المغربية السلسة والإنجليزية التقنية الصارمة.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                  <Database size={22} />
                  <h3 className="font-bold text-white text-base">Dexie.js Persistence</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  4 طبقات ذاكرة مستمرة (Soul, Episodic, Semantic, Working) في IndexedDB مع مزامنة فورية عبر BroadcastChannel ومرآة في localStorage.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center gap-3 text-cyan-400 mb-2">
                  <Cpu size={22} />
                  <h3 className="font-bold text-white text-base">Industrial & Hardware Bridge</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  تحكم مباشر في أجهزة Modbus PLC الصناعية وفك تشفير السجلات (Float32, Uint16, Hex) وربط مع عتاد الأندرويد عبر Termux API.
                </p>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Layers size={18} className="text-amber-400" />
                System Flow & Interaction Architecture
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                تعتمد دورة العمل على حلقة ReAct الذاتية (Reasoning + Acting + Validating). عندما يُطلب من النموذج تنفيذ مهمة، يقوم بتحديد الأدوات المطلوبة، استدعاء الدوال بشكل متوازي، ثم التحقق من النتائج ذاتياً قبل تقديم الرد النهائي للمستخدم.
              </p>
              <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                {`User Prompt ──► Task Classifier ──► ReAct Orchestrator Loop
   │
   ├─► Tool Calls [WebSearch, Modbus, Termux, Python, Chart.js]
   │      │
   │      ▼
   │   Web Worker & Sandbox Validation (Timeout 5000ms / IP Whitelist)
   │      │
   │      ▼
   ├─► GSoulEngine Memory Commit (Dexie.js + BroadcastChannel)
   │
   └─► Assistant Stream Output ──► Live Artifacts & Sandbox Render`}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: GSOUL ENGINE */}
        {activeSection === 'soul' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Brain size={20} className="text-purple-400" />
                    GSoulEngine Multi-Tier Storage Schema
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    IndexedDB database name: <code className="text-amber-400">GSoul_Beast_v14</code>
                  </p>
                </div>
                <button
                  onClick={loadSoulStats}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-all"
                >
                  <RefreshCw size={13} />
                  Refresh Telemetry
                </button>
              </div>

              {/* Live Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <div className="text-xs text-zinc-500 font-medium">Soul Core Records</div>
                  <div className="text-xl font-bold text-white mt-1">{soulMetrics.soulCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <div className="text-xs text-zinc-500 font-medium">Episodic Events</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">{soulMetrics.episodesCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <div className="text-xs text-zinc-500 font-medium">Semantic Facts</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{soulMetrics.semanticCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                  <div className="text-xs text-zinc-500 font-medium">Working Memory Keys</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{soulMetrics.workingCount}</div>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="relative">
                <button
                  onClick={() => handleCopy(`import { gSoulEngine } from './services/GSoulEngine';\n\n// Store Fact\nawait gSoulEngine.storeFact({\n  category: 'preference',\n  title: 'user_stack',\n  content: 'React + TypeScript + Modbus',\n  keywords: ['react', 'modbus'],\n  confidence: 1.0\n});`, 'soul_code')}
                  className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5"
                >
                  {copiedKey === 'soul_code' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  Copy Code
                </button>
                <pre className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 text-xs font-mono text-zinc-300 overflow-x-auto">
{`// 1. Store Fact to Persistent Semantic Memory
await gSoulEngine.storeFact({
  category: 'preference',
  title: 'user_preferred_stack',
  content: 'React 19, Tailwind CSS v4, Dexie.js, Modbus TCP',
  keywords: ['react', 'tailwind', 'dexie', 'modbus'],
  confidence: 1.0
});

// 2. Query Semantic Memory with Keyword Scored Ranking
const matches = await gSoulEngine.searchSemantic('Modbus registers', 3);

// 3. Log Episodic Milestone Event
await gSoulEngine.addEpisode({
  sessionId: 's-12345',
  type: 'milestone',
  summary: 'Completed Modbus register calibration for PLC Unit 1',
  tags: ['modbus', 'plc', 'calibration']
});`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: MODBUS PLC */}
        {activeSection === 'modbus' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Cpu size={20} className="text-amber-400" />
                Industrial Modbus TCP/RTU Controller Specification
              </h2>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                محرك Modbus المدمج يتيح قراءة وكتابة السجلات في وحدات التحكم الصناعية (PLCs) مع حماية أمنية عبر حجب عناوين IP الخارجية (IP Whitelist Enforced).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Supported Function Codes</h4>
                  <ul className="text-xs text-zinc-300 space-y-1.5 font-mono">
                    <li>• FC01: read_coils (1-bit discrete outputs)</li>
                    <li>• FC02: read_discrete_inputs (1-bit inputs)</li>
                    <li>• FC03: read_holding_registers (16-bit registers)</li>
                    <li>• FC04: read_input_registers (16-bit read-only)</li>
                    <li>• FC05: write_single_coil (Force 1-bit coil)</li>
                    <li>• FC06: write_single_register (Preset single register)</li>
                    <li>• FC16: write_multiple_registers (Preset multiple)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Supported Decoding Formats</h4>
                  <ul className="text-xs text-zinc-300 space-y-1.5 font-mono">
                    <li>• uint16: Standard 16-bit unsigned (0..65535)</li>
                    <li>• int16: Signed 16-bit two's complement</li>
                    <li>• float32_be: IEEE 754 Big-Endian 32-bit Float</li>
                    <li>• float32_le: IEEE 754 Little-Endian 32-bit Float</li>
                    <li>• ascii: High/Low byte ASCII character string</li>
                    <li>• hex: Hexadecimal raw word dump</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
                <Shield size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Whitelist Policy:</strong> All connections are strictly restricted to local and private IP subnets (<code>127.0.0.1</code>, <code>10.0.0.0/8</code>, <code>192.168.0.0/16</code>, <code>172.16.0.0/12</code>). Connections to public or cloud metadata servers are immediately rejected.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: TERMUX ANDROID BRIDGE */}
        {activeSection === 'termux' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone size={20} className="text-emerald-400" />
                Termux Android Bridge & Mobile Hardware Interface
              </h2>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                يربط بين بيئة الذكاء الاصطناعي وعتاد هاتف الأندرويد مباشرة، مع دعم كامل للتبديل التلقائي إلى Web APIs عند التشغيل في متصفحات الجوال.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { cmd: 'battery_status', desc: 'Battery level %, health status, voltage, temperature, and charging state.' },
                  { cmd: 'tts_speak', desc: 'Hardware-accelerated text-to-speech audio synthesis.' },
                  { cmd: 'vibrate', desc: 'Haptic feedback pulses with custom millisecond durations.' },
                  { cmd: 'location', desc: 'Precise GPS latitude, longitude, altitude, and accuracy.' },
                  { cmd: 'torch', desc: 'Hardware camera flashlight toggle (state: on/off).' },
                  { cmd: 'clipboard_get/set', desc: 'Bidirectional Android system clipboard buffer access.' },
                  { cmd: 'notification', desc: 'Push native system notifications to Android notification bar.' },
                  { cmd: 'sms_send', desc: 'Dispatch SMS messages directly via cellular network.' },
                  { cmd: 'wifi_info', desc: 'WiFi SSID, BSSID, RSSI signal strength, and local IP.' }
                ].map(item => (
                  <div key={item.cmd} className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
                    <div className="text-xs font-mono font-bold text-emerald-400">{item.cmd}</div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ONE UI DESIGN SYSTEM */}
        {activeSection === 'oneui' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Layers size={20} className="text-sky-400" />
                Samsung One UI 6 & 7 Design System & Stylesheet
              </h2>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                تم ضبط الواجهة ومحددات CSS لتقديم تجربة تحكم مطابقة لبيئة One UI 6 & 7 المريحة لإبهام اليد الواحدة.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-200 mb-2">1. Visual & Viewing Area Architecture</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    تم تقسيم الشاشة بحيث يشغل الجزء العلوي مساحة العرض الرئيسية بنصوص كبيرة وواضحة، بينما تتمركز كافة أزرار التحكم والقوائم السفلية في النصف السفلي القريب من إبهام اليد.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-200 mb-2">2. Squircle Card Radii Math</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                    Outer Container Radius: 24px (rounded-3xl) | Inner Card Radius: 18px (rounded-2xl) | Button Pills: 9999px (rounded-full)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-200 mb-2">3. Haptic Scale Responses</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    جميع الأزرار والبطاقات التفاعلية تستجيب بنسبة انكماش مرنة <code className="text-amber-400">active:scale-97</code> مع انتقال سلس بزمن 100ms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: LIVE TEST SANDBOX */}
        {activeSection === 'testing' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Play size={20} className="text-emerald-400" />
                Live Tool Execution & Hardware Sandbox
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                اختبر استدعاء أدوات Modbus و Termux مباشرة وشاهد استجابة السجلات وفك التشفير الحقيقي.
              </p>

              {/* Tool Selector */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setTestTool('modbus')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    testTool === 'modbus'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Cpu size={16} />
                  Modbus PLC Test
                </button>
                <button
                  onClick={() => setTestTool('termux')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    testTool === 'termux'
                      ? 'bg-emerald-500 text-black border-emerald-500'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone size={16} />
                  Termux Bridge Test
                </button>
              </div>

              {/* Form Controls */}
              {testTool === 'modbus' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Target Host IP</label>
                    <input
                      type="text"
                      value={modbusHost}
                      onChange={e => setModbusHost(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Action</label>
                    <select
                      value={modbusAction}
                      onChange={e => setModbusAction(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    >
                      <option value="read_holding_registers">read_holding_registers (FC03)</option>
                      <option value="read_input_registers">read_input_registers (FC04)</option>
                      <option value="read_coils">read_coils (FC01)</option>
                      <option value="read_discrete_inputs">read_discrete_inputs (FC02)</option>
                      <option value="write_single_coil">write_single_coil (FC05)</option>
                      <option value="write_single_register">write_single_register (FC06)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Address & Count</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={modbusAddr}
                        onChange={e => setModbusAddr(Number(e.target.value))}
                        className="w-2/3 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                        placeholder="Address"
                      />
                      <input
                        type="number"
                        value={modbusCount}
                        onChange={e => setModbusCount(Number(e.target.value))}
                        className="w-1/3 px-2 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                        placeholder="Count"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Decoding Format</label>
                    <select
                      value={modbusFormat}
                      onChange={e => setModbusFormat(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    >
                      <option value="float32_be">float32_be (Big-Endian)</option>
                      <option value="uint16">uint16 (Unsigned)</option>
                      <option value="ascii">ascii string</option>
                      <option value="hex">hex dump</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="text-xs text-zinc-400 block mb-1">Termux Command</label>
                  <select
                    value={termuxCmd}
                    onChange={e => setTermuxCmd(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  >
                    <option value="battery_status">battery_status (Battery level & temperature)</option>
                    <option value="location">location (GPS coordinates)</option>
                    <option value="vibrate">vibrate (Haptic vibration pulse)</option>
                    <option value="tts_speak">tts_speak (Text to speech output)</option>
                    <option value="torch">torch (Flashlight toggle)</option>
                    <option value="wifi_info">wifi_info (WiFi connection details)</option>
                    <option value="clipboard_get">clipboard_get (Read system clipboard)</option>
                  </select>
                </div>
              )}

              <button
                onClick={runLiveTest}
                disabled={isTesting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/10"
              >
                <Play size={15} />
                {isTesting ? 'Executing Sandbox Request...' : 'Run Real Hardware Test'}
              </button>

              {/* Output Console */}
              {testOutput && (
                <div className="mt-4">
                  <div className="text-xs text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
                    <Terminal size={14} className="text-amber-400" />
                    Execution Output Console:
                  </div>
                  <pre className="p-4 rounded-2xl bg-black/90 border border-zinc-800 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {testOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
