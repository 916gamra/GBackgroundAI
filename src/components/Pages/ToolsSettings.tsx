import React, { useMemo, useState } from 'react';
import { Activity, Atom, BarChart3, Binary, BookOpen, Bot, Box, Braces, Brain, Calculator, Check, ChevronDown, ChevronUp, Clock, CloudUpload, Code, Cpu, Database, Edit2, Eye, FileCode, FilePlus, Fingerprint, FolderGit2, GitBranch, Globe, Hammer, HardDrive, HeartPulse, Info, Layers, Link, MicVocal, Network, Plus, Ruler, ScanSearch, ScanText, Search, SearchCode, ShieldCheck, Smartphone, Sparkles, SpellCheck, Terminal, Trash2, Users, Workflow, Wrench, X, Zap } from 'lucide-react';
import { AppSettings, CustomToolConfig } from '../../types';
import { BUILTIN_TOOL_CATALOG } from '../../services/agentTools';
import { isToolEnabled, isToolSimulated } from '../../services/toolPolicy';

interface ToolsSettingsProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onApplyChanges: () => void;
  triggerToast: (msg: string) => void;
}

// Icon mapper for catalog icons
const TOOL_ICON_MAP: Record<string, React.ReactNode> = {
  Globe: <Globe size={18} className="text-sky-400" />,
  Link: <Link size={18} className="text-cyan-400" />,
  Terminal: <Terminal size={18} className="text-emerald-400" />,
  Code: <Code size={18} className="text-amber-400" />,
  BarChart3: <BarChart3 size={18} className="text-indigo-400" />,
  FilePlus: <FilePlus size={18} className="text-rose-400" />,
  Calculator: <Calculator size={18} className="text-green-400" />,
  BookOpen: <BookOpen size={18} className="text-blue-400" />,
  Braces: <Braces size={18} className="text-orange-400" />,
  SpellCheck: <SpellCheck size={18} className="text-purple-400" />,
  Binary: <Binary size={18} className="text-pink-400" />,
  Fingerprint: <Fingerprint size={18} className="text-teal-400" />,
  Clock: <Clock size={18} className="text-yellow-400" />,
  Brain: <Brain size={18} className="text-violet-400" />,
  Database: <Database size={18} className="text-fuchsia-400" />,
  ScanText: <ScanText size={18} className="text-lime-400" />,
  Cpu: <Cpu size={18} className="text-amber-400" />,
  Smartphone: <Smartphone size={18} className="text-emerald-400" />,
  FolderGit2: <FolderGit2 size={18} className="text-purple-400" />,
  FileCode: <FileCode size={18} className="text-blue-400" />,
  Search: <Search size={18} className="text-cyan-400" />,
  CloudUpload: <CloudUpload size={18} className="text-emerald-400" />,
  ScanSearch: <ScanSearch size={18} className="text-amber-400" />,
  Layers: <Layers size={18} className="text-indigo-400" />,
  Hammer: <Hammer size={18} className="text-fuchsia-400" />,
  HeartPulse: <HeartPulse size={18} className="text-rose-400" />,
  Bot: <Bot size={18} className="text-cyan-400" />,
  HardDrive: <HardDrive size={18} className="text-blue-400" />,
  GitBranch: <GitBranch size={18} className="text-purple-400" />,
  Box: <Box size={18} className="text-emerald-400" />,
  Network: <Network size={18} className="text-amber-400" />,
  Wrench: <Wrench size={18} className="text-teal-400" />,
  Ruler: <Ruler size={18} className="text-lime-400" />,
  Eye: <Eye size={18} className="text-sky-400" />,
  SearchCode: <SearchCode size={18} className="text-cyan-400" />,
  MicVocal: <MicVocal size={18} className="text-pink-400" />,
  Users: <Users size={18} className="text-violet-400" />,
  Workflow: <Workflow size={18} className="text-fuchsia-400" />,
  Activity: <Activity size={18} className="text-green-400" />,
  Zap: <Zap size={18} className="text-yellow-400" />,
  Atom: <Atom size={18} className="text-indigo-400" />
};

export const ToolsSettings: React.FC<ToolsSettingsProps> = ({
  localSettings,
  setLocalSettings,
  triggerToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  // Custom tool creation & edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customId, setCustomId] = useState('');
  const [customCategory, setCustomCategory] = useState<'web' | 'code' | 'data' | 'system' | 'custom'>('custom');
  const [customDesc, setCustomDesc] = useState('');
  const [customParamsJson, setCustomParamsJson] = useState('{\n  "type": "object",\n  "properties": {\n    "input": {\n      "type": "string",\n      "description": "Input text to process"\n    }\n  },\n  "required": ["input"]\n}');
  const [customCode, setCustomCode] = useState('// JavaScript execution body. Receives (args, settings)\n// Example:\nconst result = "Processed: " + (args.input || "");\nreturn result;');

  // Toggle individual built-in tool status
  const handleToggleBuiltin = (toolId: string) => {
    setLocalSettings(prev => {
      const currentMap = { ...(prev.enabledTools || {}) };
      // Effective default comes from the tool policy (real tools on, simulated off).
      const currentVal = isToolEnabled(toolId, currentMap);
      currentMap[toolId] = !currentVal;
      return {
        ...prev,
        enabledTools: currentMap
      };
    });
  };

  // Toggle custom tool status
  const handleToggleCustom = (toolId: string) => {
    setLocalSettings(prev => {
      const updatedCustoms = (prev.customTools || []).map(ct => {
        if (ct.id === toolId) {
          return { ...ct, enabled: !ct.enabled };
        }
        return ct;
      });
      return {
        ...prev,
        customTools: updatedCustoms
      };
    });
  };

  // Enable all *real* tools. Simulated/demo tools stay opt-in so the model is
  // never handed 60 schemas of which ~25 fabricate their own "success" output.
  const handleEnableAll = () => {
    const newMap: Record<string, boolean> = {};
    let simulatedCount = 0;
    BUILTIN_TOOL_CATALOG.forEach(t => {
      if (isToolSimulated(t.id)) {
        simulatedCount++;
        return;
      }
      newMap[t.id] = true;
    });
    setLocalSettings(prev => ({
      ...prev,
      enabledTools: { ...(prev.enabledTools || {}), ...newMap },
      customTools: (prev.customTools || []).map(ct => ({ ...ct, enabled: true }))
    }));
    triggerToast(
      simulatedCount
        ? `All ${Object.keys(newMap).length} real tools enabled — ${simulatedCount} simulated ones stay opt-in.`
        : 'All AI Tools enabled successfully! 🚀'
    );
  };

  // Disable all tools
  const handleDisableAll = () => {
    const newMap: Record<string, boolean> = {};
    BUILTIN_TOOL_CATALOG.forEach(t => {
      newMap[t.id] = false;
    });
    setLocalSettings(prev => ({
      ...prev,
      enabledTools: newMap,
      customTools: (prev.customTools || []).map(ct => ({ ...ct, enabled: false }))
    }));
    triggerToast('All AI Tools disabled (Raw Model mode)');
  };

  // Open modal to add new custom tool
  const handleOpenAddCustom = () => {
    setEditingToolId(null);
    setCustomName('');
    setCustomId('');
    setCustomCategory('custom');
    setCustomDesc('');
    setCustomParamsJson('{\n  "type": "object",\n  "properties": {\n    "text": {\n      "type": "string",\n      "description": "Input text or query"\n    }\n  },\n  "required": ["text"]\n}');
    setCustomCode('// Custom tool runtime. Receives (args, settings)\n// Example return string or JSON:\nreturn `Processed: ${args.text.toUpperCase()}`;');
    setIsModalOpen(true);
  };

  // Open modal to edit existing custom tool
  const handleOpenEditCustom = (tool: CustomToolConfig) => {
    setEditingToolId(tool.id);
    setCustomName(tool.name);
    setCustomId(tool.id);
    setCustomCategory(tool.category || 'custom');
    setCustomDesc(tool.description);
    setCustomParamsJson(tool.parametersJson);
    setCustomCode(tool.code);
    setIsModalOpen(true);
  };

  // Delete custom tool
  const handleDeleteCustom = (toolId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      customTools: (prev.customTools || []).filter(ct => ct.id !== toolId)
    }));
    triggerToast(`Custom tool deleted.`);
  };

  // Save custom tool (add or update)
  const handleSaveCustomTool = () => {
    if (!customName.trim()) {
      triggerToast('Please provide a Tool Name');
      return;
    }
    const slugId = customId.trim() || customName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    try {
      JSON.parse(customParamsJson);
    } catch {
      triggerToast('Invalid JSON schema format in parameters');
      return;
    }

    const newTool: CustomToolConfig = {
      id: slugId,
      name: customName.trim(),
      description: customDesc.trim() || customName.trim(),
      category: customCategory,
      parametersJson: customParamsJson,
      code: customCode,
      enabled: true
    };

    setLocalSettings(prev => {
      const existing = prev.customTools || [];
      if (editingToolId) {
        return {
          ...prev,
          customTools: existing.map(ct => (ct.id === editingToolId ? newTool : ct))
        };
      }
      // Check if id already exists
      const filtered = existing.filter(ct => ct.id !== slugId);
      return {
        ...prev,
        customTools: [...filtered, newTool]
      };
    });

    setIsModalOpen(false);
    triggerToast(editingToolId ? 'Custom tool updated!' : 'New custom tool created! ✨');
  };

  // Filtered built-in tools
  const filteredBuiltins = useMemo(() => {
    return BUILTIN_TOOL_CATALOG.filter(tool => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  // Filtered custom tools
  const customToolsList = localSettings.customTools || [];
  const filteredCustoms = useMemo(() => {
    return customToolsList.filter(ct => {
      const matchesSearch =
        ct.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ct.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ct.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || selectedCategory === 'custom';
      return matchesSearch && matchesCat;
    });
  }, [customToolsList, searchQuery, selectedCategory]);

  // Stats
  const totalBuiltins = BUILTIN_TOOL_CATALOG.length;
  const activeBuiltinsCount = BUILTIN_TOOL_CATALOG.filter(t => isToolEnabled(t.id, localSettings.enabledTools)).length;
  const activeCustomsCount = customToolsList.filter(ct => ct.enabled).length;
  const totalActive = activeBuiltinsCount + activeCustomsCount;
  const totalCount = totalBuiltins + customToolsList.length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* Header & Overview */}
      <div className="pb-4 border-b border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
              <Wrench size={20} />
            </div>
            <span>AI Autonomous Agent Tools & Capabilities</span>
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Browse the comprehensive tool manual, toggle specific functions, and define custom JavaScript tools for the agent.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnableAll}
            className="px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#27272a] border border-[#27272a] text-xs font-semibold text-[#38bdf8] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Enable all tools"
          >
            <Check size={14} />
            <span>Enable All</span>
          </button>
          <button
            onClick={handleDisableAll}
            className="px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#27272a] border border-[#27272a] text-xs font-semibold text-[#f43f5e] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Disable all tools"
          >
            <X size={14} />
            <span>Disable All</span>
          </button>
          <button
            onClick={handleOpenAddCustom}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all shadow-md shadow-[var(--accent-light)] cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Custom Tool</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-1">
          <span className="text-[11px] text-[#71717a] font-medium">Active Agent Tools</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-white font-mono">{totalActive}</span>
            <span className="text-xs text-[#52525b] font-mono">/ {totalCount} total</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-1">
          <span className="text-[11px] text-[#71717a] font-medium">Built-in Suite</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-[#38bdf8] font-mono">{activeBuiltinsCount}</span>
            <span className="text-xs text-[#52525b] font-mono">/ {totalBuiltins} active</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-1">
          <span className="text-[11px] text-[#71717a] font-medium">Custom User Tools</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-[#c084fc] font-mono">{customToolsList.length}</span>
            <span className="text-xs text-[#52525b] font-mono">registered</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-1">
          <span className="text-[11px] text-[#71717a] font-medium">Execution Engine</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#4ade80] mt-1">
            <ShieldCheck size={14} />
            <span>Sandboxed & WASM</span>
          </div>
        </div>
      </div>

      {/* External Integration Plugins Settings */}
      <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8]">
              <Globe size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Plugins & Integration Credentials</h3>
              <p className="text-[11px] text-[#71717a]">Configure API keys and webhooks for search, vector databases, automation, and media tools.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* GitHub Personal Access Token */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <label className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
              <span>GitHub Personal Access Token (PAT)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">Vault</span>
            </label>
            <input
              type="password"
              value={localSettings.githubPat || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, githubPat: e.target.value }))}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded-lg text-white text-xs outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>

          {/* Google Search / Serper */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <label className="text-[11px] font-semibold text-[#a1a1aa]">Google Serper Search API Key</label>
            <input
              type="password"
              value={localSettings.serper || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, serper: e.target.value }))}
              placeholder="Paste Serper.dev API key..."
              className="px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded-lg text-white text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Pinecone Vector DB */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <label className="text-[11px] font-semibold text-[#a1a1aa]">Pinecone Vector DB API Key</label>
            <input
              type="password"
              value={localSettings.pineconeKey || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, pineconeKey: e.target.value }))}
              placeholder="Pinecone API key..."
              className="px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded-lg text-white text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Zapier AI Action Webhook */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <label className="text-[11px] font-semibold text-[#a1a1aa]">Zapier AI Action Webhook URL</label>
            <input
              type="text"
              value={localSettings.zapierWebhook || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, zapierWebhook: e.target.value }))}
              placeholder="https://hooks.zapier.com/..."
              className="px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded-lg text-white text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Make.com Webhook */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <label className="text-[11px] font-semibold text-[#a1a1aa]">Make.com Scenario Webhook URL</label>
            <input
              type="text"
              value={localSettings.makeWebhook || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, makeWebhook: e.target.value }))}
              placeholder="https://hook.eu1.make.com/..."
              className="px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded-lg text-white text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* ElevenLabs TTS */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <label className="text-[11px] font-semibold text-[#a1a1aa]">ElevenLabs TTS API Key</label>
            <input
              type="password"
              value={localSettings.elevenlabsKey || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, elevenlabsKey: e.target.value }))}
              placeholder="ElevenLabs API key..."
              className="px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded-lg text-white text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#121215] border border-[#27272a]">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, parameter, category or capability..."
            className="w-full pl-9 pr-4 py-2 bg-[#18181c] border border-[#27272a] rounded-xl text-xs text-white placeholder-[#52525b] outline-none focus:border-[var(--accent)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white text-xs"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All Tools' },
            { id: 'web', label: 'Web & Search' },
            { id: 'code', label: 'Code & WASM' },
            { id: 'data', label: 'Data & Charts' },
            { id: 'system', label: 'Memory & Time' },
            { id: 'crypto', label: 'Crypto & Hash' },
            { id: 'custom', label: `Custom (${customToolsList.length})` }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[#18181c] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Built-in Tools Section */}
      {filteredBuiltins.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1.5">
              <span>Standard Agent Tool Catalogue</span>
              <span className="text-[10px] text-[#71717a] font-normal">({filteredBuiltins.length} available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBuiltins.map(tool => {
              const isEnabled = isToolEnabled(tool.id, localSettings.enabledTools);
              const simulated = isToolSimulated(tool.id);
              const isExpanded = expandedToolId === tool.id;

              return (
                <div
                  key={tool.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                    isEnabled
                      ? 'bg-[#121215] border-[#27272a] hover:border-[#3f3f46]'
                      : 'bg-[#0f0f12] border-[#202025] opacity-60'
                  }`}
                >
                  {/* Tool Header: Icon, Name, Badge, Toggle Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center shrink-0">
                        {TOOL_ICON_MAP[tool.icon] || <Wrench size={18} className="text-sky-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white">{tool.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#1c1c22] border border-[#2c2c36] text-[#a1a1aa]">
                            {tool.badge}
                          </span>
                          {simulated && (
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400"
                              title="This tool returns canned demo data - it does not contact a PLC, shell, camera or network. Disabled by default so the model never presents it as real."
                            >
                              ⚠ SIMULATED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--accent)]">{tool.id}()</span>
                      </div>
                    </div>

                    {/* Activation Switch */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggleBuiltin(tool.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#27272a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    {tool.shortDesc}
                  </p>

                  {/* Capability Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tool.capabilities.map((cap, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-[#18181c] border border-[#27272a] text-[10px] text-[#71717a] font-medium"
                      >
                        ✓ {cap}
                      </span>
                    ))}
                  </div>

                  {/* Expandable Manual / Parameters Guide */}
                  <div className="pt-2 border-t border-[#1f1f23]">
                    <button
                      onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-[#71717a] hover:text-white transition-colors py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info size={13} className="text-sky-400" />
                        <span>{isExpanded ? 'Hide Documentation & Schema' : 'View Documentation & Example'}</span>
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-xl bg-[#09090b] border border-[#27272a] flex flex-col gap-2.5 text-xs animate-fadeIn">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-wider">How it works:</span>
                          <p className="text-xs text-[#d4d4d8] mt-0.5 leading-relaxed">{tool.detailedGuide}</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-wider">Example Usage Scenario:</span>
                          <p className="text-xs text-[#a1a1aa] italic mt-0.5">"{tool.exampleScenario}"</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-wider">Invocation Payload Schema:</span>
                          <pre className="mt-1 p-2 rounded-lg bg-[#121215] border border-[#222227] text-[11px] font-mono text-[#38bdf8] overflow-x-auto">
                            {tool.exampleArgs}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom User Tools Section */}
      <div className="flex flex-col gap-3.5 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>Custom User-Defined Tools</span>
            <span className="text-[10px] text-[#71717a] font-normal">({customToolsList.length} registered)</span>
          </h3>

          <button
            onClick={handleOpenAddCustom}
            className="text-xs text-[var(--accent)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Tool</span>
          </button>
        </div>

        {customToolsList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#121215] border border-dashed border-[#27272a] text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#18181c] flex items-center justify-center text-[#71717a]">
              <Code size={18} />
            </div>
            <div className="text-xs font-bold text-white">No Custom AI Tools Yet</div>
            <p className="text-xs text-[#71717a] max-w-md">
              Extend the AI agent with custom JavaScript execution functions, external webhooks, or math transformers.
            </p>
            <button
              onClick={handleOpenAddCustom}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#27272a] border border-[#27272a] text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create First Custom Tool</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCustoms.map(ct => (
              <div
                key={ct.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                  ct.enabled
                    ? 'bg-[#121215] border-[#27272a] hover:border-[#3f3f46]'
                    : 'bg-[#0f0f12] border-[#202025] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Code size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{ct.name}</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-purple-950/40 border border-purple-800/40 text-purple-300">
                          Custom
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400">{ct.id}()</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditCustom(ct)}
                      className="p-1.5 rounded-lg bg-[#18181c] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
                      title="Edit Tool"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustom(ct.id)}
                      className="p-1.5 rounded-lg bg-[#18181c] hover:bg-rose-950/40 text-[#71717a] hover:text-rose-400 transition-colors"
                      title="Delete Tool"
                    >
                      <Trash2 size={13} />
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer ml-1">
                      <input
                        type="checkbox"
                        checked={ct.enabled}
                        onChange={() => handleToggleCustom(ct.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#27272a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                    </label>
                  </div>
                </div>

                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  {ct.description}
                </p>

                <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[11px] font-mono text-[#a1a1aa] max-h-24 overflow-y-auto">
                  <pre className="text-emerald-400">{ct.code}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Creating / Editing Custom Tool */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0e0e11] border border-[#27272a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                  <Code size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingToolId ? 'Edit Custom Agent Tool' : 'Create New AI Agent Tool'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#18181c] text-[#71717a] hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white">Tool Display Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => {
                      setCustomName(e.target.value);
                      if (!editingToolId) {
                        setCustomId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                      }
                    }}
                    placeholder="e.g. Weather Query"
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white">Function Identifier (slug)</label>
                  <input
                    type="text"
                    value={customId}
                    onChange={e => setCustomId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g. weather_query"
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#38bdf8] outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white">Description for AI Model</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  placeholder="Explain when and why the model should invoke this tool..."
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Tool Parameters Schema (JSON Schema)</span>
                  <span className="text-[10px] font-normal text-[#71717a]">OpenAI / Gemini function calling spec</span>
                </label>
                <textarea
                  rows={5}
                  value={customParamsJson}
                  onChange={e => setCustomParamsJson(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs font-mono text-[#38bdf8] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Execution Code (JavaScript Async Body)</span>
                  <span className="text-[10px] font-normal text-emerald-400 font-mono">function(args, settings)</span>
                </label>
                <textarea
                  rows={6}
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs font-mono text-emerald-300 outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#27272a] flex items-center justify-end gap-2 bg-[#0c0c0e]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#18181c] hover:bg-[#27272a] text-xs font-semibold text-[#a1a1aa] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomTool}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-xs font-bold text-white transition-all shadow-md shadow-[var(--accent-light)] cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{editingToolId ? 'Update Tool' : 'Save & Register Tool'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
