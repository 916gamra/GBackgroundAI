import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  ArrowUp,
  Square,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Cpu,
  Globe,
  FolderOpen,
  Bookmark,
  Volume2,
  MonitorPlay,
  Settings2,
  ChevronDown,
  Server,
  X,
  Terminal,
  Sparkles
} from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { MODELS, countTokens } from '../services/aiService';

interface InputAreaProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeProvider: Provider | undefined;
  onOpenModelPicker: () => void;
  onOpenProviderPicker: () => void;
  onOpenProjectModal: () => void;
  onOpenSnippetsModal: () => void;
  onOpenSettingsModal: () => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
  onSend: (text: string, visionFile?: { name: string; url: string }) => void;
  onStop: () => void;
  isBusy: boolean;
  totalSessionTokens: number;
  projectCount: number;
}

export const InputArea: React.FC<InputAreaProps> = ({
  settings,
  onUpdateSettings,
  activeProvider,
  onOpenModelPicker,
  onOpenProviderPicker,
  onOpenProjectModal,
  onOpenSnippetsModal,
  onOpenSettingsModal,
  onTogglePreview,
  isPreviewOpen,
  onSend,
  onStop,
  isBusy,
  totalSessionTokens,
  projectCount
}) => {
  const [text, setText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [attachedVision, setAttachedVision] = useState<{ name: string; url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [viewportBottomOffset, setViewportBottomOffset] = useState(0);

  // Dynamic viewport bottom offset for mobile virtual keyboard
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const offset = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
      setViewportBottomOffset(Math.max(0, offset));
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const currentTokens = useMemo(() => {
    return Math.round((text.length + (attachedFile?.content.length || 0)) / 4);
  }, [text, attachedFile]);

  // Close plus menu on outside click (desktop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlusMenuOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const slashCommands = [
    { cmd: '/analyze_excel', label: 'Analyze Spreadsheet / Excel / CSV data with Pandas', icon: Terminal },
    { cmd: '/read_pdf', label: 'Extract text & search keywords in PDF documents', icon: Sparkles },
    { cmd: '/n8n', label: 'Trigger n8n automation workflow via webhook', icon: Globe },
    { cmd: '/tts', label: 'Vocalize text aloud using Free TTS', icon: Volume2 },
    { cmd: '/help', label: 'List all active tools and capabilities', icon: Cpu }
  ];

  const filteredSlashCommands = text.startsWith('/')
    ? slashCommands.filter(c => c.cmd.toLowerCase().includes(text.toLowerCase()))
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    let fullText = text.trim();
    if (!fullText && !attachedFile && !attachedVision) return;

    if (attachedFile) {
      fullText = `[Attached File: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n` + (fullText || 'Please analyze this file.');
      setAttachedFile(null);
    }

    const vision = attachedVision || undefined;
    setAttachedVision(null);
    setText('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSend(fullText, vision);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setAttachedFile({
        name: file.name,
        content: ev.target?.result as string
      });
      setIsPlusMenuOpen(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setAttachedVision({
        name: file.name,
        url: ev.target?.result as string
      });
      setIsPlusMenuOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    if (isRecording) {
      setIsRecording(false);
      recognition.stop();
      return;
    }

    setIsRecording(true);
    recognition.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        interim += e.results[i][0].transcript;
      }
      setText(prev => (prev ? `${prev} ${interim}` : interim));
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.start();
  };

  const allModelsMap: Record<string, any> = { ...MODELS, ...(settings.customModels || {}) };
  const currentModel = settings.mod === 'auto'
    ? { name: 'Auto (Task Router)' }
    : allModelsMap[settings.mod] || { name: settings.mod };

  return (
    <footer
      style={{ bottom: `${viewportBottomOffset}px` }}
      className="fixed left-0 right-0 bg-[#0c0c0e]/95 border-t border-[#27272a] z-40 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom,0px),6px)] transition-all duration-150"
    >
      {/* Top Quick Bar for Samsung One UI */}
      <div className="h-8 border-b border-[#27272a]/60 px-3 md:px-5 flex items-center justify-between text-[11px] font-mono select-none overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenModelPicker}
            className="flex items-center gap-1.5 text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity bg-[#18181b] px-2 py-0.5 rounded-lg border border-[#27272a]"
            title={activeProvider && activeProvider.status === 'error' ? 'Model disconnected / Error' : 'Model working & active'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${!activeProvider || activeProvider.status !== 'error' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'}`} />
            <span className="truncate max-w-[110px] sm:max-w-[160px]">{currentModel?.name || settings.mod}</span>
            <ChevronDown size={11} className="opacity-60 shrink-0" />
          </button>

          <button
            onClick={() => onUpdateSettings({ agent: !settings.agent })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all ${
              settings.agent
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-[#18181b] border-[#27272a] text-[#71717a]'
            }`}
          >
            <Cpu size={11} />
            <span>Agent</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ webSearch: !settings.webSearch })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all ${
              settings.webSearch
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#18181b] border-[#27272a] text-[#71717a]'
            }`}
          >
            <Globe size={11} />
            <span>Search</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[#71717a]">
          <button
            onClick={onOpenProviderPicker}
            className="flex items-center gap-1 hover:text-white transition-colors bg-[#18181b] px-2 py-0.5 rounded-lg border border-[#27272a]"
          >
            <Server size={10} />
            <span className="truncate max-w-[80px]">{activeProvider?.name || 'Provider'}</span>
          </button>
        </div>
      </div>

      {/* Input container */}
      <div className="p-2.5 sm:p-3 max-w-4xl mx-auto flex flex-col gap-1.5">
        {/* Attachments preview */}
        {(attachedFile || attachedVision) && (
          <div className="flex items-center gap-2 mb-1 overflow-x-auto no-scrollbar">
            {attachedFile && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#18181b] border border-amber-500/40 text-amber-300 text-xs font-mono shrink-0">
                <Paperclip size={12} />
                <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="hover:text-white p-0.5 ml-1"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {attachedVision && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#18181b] border border-sky-500/40 text-sky-300 text-xs font-mono shrink-0">
                <ImageIcon size={12} />
                <span className="truncate max-w-[180px]">{attachedVision.name}</span>
                <button
                  onClick={() => setAttachedVision(null)}
                  className="hover:text-white p-0.5 ml-1"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative flex items-end gap-1.5 sm:gap-2 bg-[#141417] border border-[#27272a] focus-within:border-[var(--accent)] rounded-2xl p-1.5 shadow-inner transition-colors">
          {/* Plus action menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setIsPlusMenuOpen(prev => !prev)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all cursor-pointer ${
                isPlusMenuOpen ? 'rotate-45 text-white bg-[var(--accent-light)]' : ''
              }`}
              title="Add tools and attachments"
              aria-label="Add tools"
            >
              <Plus size={20} />
            </button>

            {/* Mobile Bottom Sheet & Desktop Menu */}
            {isPlusMenuOpen && (
              <>
                {/* Backdrop for mobile */}
                <div
                  onClick={() => setIsPlusMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
                />

                <div className="fixed bottom-0 left-0 right-0 max-sm:w-full max-sm:rounded-t-3xl max-sm:border-t max-sm:border-[#27272a] max-sm:bg-[#121215] max-sm:p-4 max-sm:shadow-2xl sm:absolute sm:bottom-12 sm:left-0 sm:w-64 sm:bg-[#141418] sm:border sm:border-[#27272a] sm:rounded-2xl sm:p-2 sm:shadow-2xl flex flex-col gap-1 z-50 text-xs animate-slideUp sm:animate-fadeIn">
                  {/* Drag notch on mobile */}
                  <div className="w-12 h-1 rounded-full bg-[#3f3f46] mx-auto mb-2 sm:hidden" />

                  <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors">
                    <Paperclip size={18} className="text-amber-400" />
                    <span className="font-medium text-[13px]">Attach Document</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".txt,.js,.ts,.py,.css,.html,.json,.md,.cpp,.c,.java,.rs,.go,.sh,.yaml,.sql"
                      onChange={handleFileUpload}
                    />
                  </label>

                  <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors">
                    <ImageIcon size={18} className="text-sky-400" />
                    <span className="font-medium text-[13px]">Send Image (Vision)</span>
                    <input
                      ref={visionInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleVisionUpload}
                    />
                  </label>

                  <div className="w-full h-[1px] bg-[#27272a] my-1" />

                  <div
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenProjectModal();
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen size={18} className="text-yellow-400" />
                      <span className="font-medium text-[13px]">Project Files Context</span>
                    </div>
                    {projectCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                        {projectCount}
                      </span>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenSnippetsModal();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors"
                  >
                    <Bookmark size={18} className="text-pink-400" />
                    <span className="font-medium text-[13px]">Prompt Snippets</span>
                  </div>

                  <div
                    onClick={() => onUpdateSettings({ tts: !settings.tts })}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Volume2 size={18} className="text-blue-400" />
                      <span className="font-medium text-[13px]">Voice Output (TTS)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tts}
                      onChange={() => {}}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </div>

                  <div className="w-full h-[1px] bg-[#27272a] my-1" />

                  <div
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onTogglePreview();
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MonitorPlay size={18} className="text-sky-400" />
                      <span className="font-medium text-[13px]">Live Code Sandbox</span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold ${isPreviewOpen ? 'text-sky-400' : 'text-[#71717a]'}`}>
                      {isPreviewOpen ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenSettingsModal();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1f1f25] cursor-pointer text-[#e4e4e7] transition-colors"
                  >
                    <Settings2 size={18} className="text-[var(--accent)]" />
                    <span className="font-medium text-[13px]">Full Settings</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Text input container with Slash Commands Popup */}
          <div className="relative flex-1 flex flex-col">
            {filteredSlashCommands.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-xl animate-slideUp">
                <div className="px-3 py-1.5 text-[11px] font-mono text-[#a1a1aa] border-b border-[#27272a] flex items-center justify-between">
                  <span>✨ Agent Skill Shortcuts</span>
                  <span className="text-[10px]">Tab / Click to select</span>
                </div>
                {filteredSlashCommands.map((sc) => {
                  const IconComp = sc.icon;
                  return (
                    <button
                      key={sc.cmd}
                      onClick={() => {
                        setText(sc.cmd + ' ');
                        textareaRef.current?.focus();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#27272a] text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0">
                        <IconComp size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-white group-hover:text-[var(--accent)]">{sc.cmd}</span>
                        <span className="text-[11px] text-[#a1a1aa]">{sc.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask, type '/' for commands, build apps..."
              className="w-full bg-transparent text-[#f4f4f5] text-sm md:text-[14.5px] font-sans placeholder-[#71717a] outline-none resize-none py-2 px-1 max-h-[120px] leading-relaxed"
            />
          </div>

          {/* Voice input mic */}
          <button
            onClick={toggleVoiceInput}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f25]'
            }`}
            title="Speech to text"
            aria-label="Speech to text"
          >
            <Mic size={19} />
          </button>

          {/* Send / Stop button */}
          {isBusy ? (
            <button
              onClick={onStop}
              className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Stop Generation"
              aria-label="Stop Generation"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() && !attachedFile && !attachedVision}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                text.trim() || attachedFile || attachedVision
                  ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-md shadow-[var(--accent-light)]'
                  : 'bg-[#18181b] text-[#52525b] cursor-not-allowed'
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp size={19} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Token info */}
        <div className="flex justify-between items-center px-1 text-[10px] font-mono text-[#71717a]">
          <span>{currentTokens > 0 ? `~${currentTokens} tokens` : ''}</span>
          <span>{totalSessionTokens > 0 ? `session: ~${Math.round(totalSessionTokens / 1000)}k tok` : ''}</span>
        </div>
      </div>
    </footer>
  );
};
