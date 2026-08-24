import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  ArrowUp,
  Square,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Cpu,
  FolderOpen,
  Bookmark,
  ChevronDown,
  Server,
  X,
  Sparkles,
  MonitorPlay,
  Settings2
} from 'lucide-react';
import { AppSettings, Provider } from '../../types';
import { MODELS } from '../../services/aiService';

interface ChatInputBarProps {
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

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dynamic token estimation
  const currentTokens = useMemo(() => {
    return Math.round((text.length + (attachedFile?.content.length || 0)) / 4);
  }, [text, attachedFile]);

  // Adjust for Mobile Virtual Keyboard using VisualViewport API
  const [viewportBottomOffset, setViewportBottomOffset] = useState(0);

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

  // Close plus menu on outside click
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
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

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

  const currentModel = MODELS[settings.mod];

  return (
    <div
      style={{ bottom: `${viewportBottomOffset}px` }}
      className="sticky bottom-0 z-30 w-full bg-[#08080a]/95 backdrop-blur-md border-t border-[#1a1a1e] p-2 md:p-3 transition-all duration-150"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.js,.ts,.tsx,.py,.json,.html,.css,.md"
        />
        <input
          type="file"
          ref={visionInputRef}
          onChange={handleVisionUpload}
          className="hidden"
          accept="image/*"
        />

        {/* Attachment Badges */}
        {(attachedFile || attachedVision) && (
          <div className="flex items-center gap-2 px-1 animate-fadeIn">
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#18181b] border border-[var(--accent)]/50 text-xs text-[#e4e4e7]">
                <Paperclip size={13} className="text-[var(--accent)]" />
                <span className="truncate max-w-[200px] font-mono">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-[#71717a] hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {attachedVision && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#18181b] border border-purple-500/50 text-xs text-purple-300">
                <ImageIcon size={13} className="text-purple-400" />
                <span className="truncate max-w-[200px] font-mono">{attachedVision.name}</span>
                <button
                  onClick={() => setAttachedVision(null)}
                  className="text-[#71717a] hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Card Container */}
        <div className="relative flex flex-col rounded-2xl bg-[#121215] border border-[#27272a] focus-within:border-[var(--accent)]/80 focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all shadow-xl">
          {/* Main Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your prompt, ask code, or request execution... (Enter to send, Shift+Enter for newline)"
            className="w-full bg-transparent p-3.5 text-sm text-[#f4f4f5] placeholder-[#52525b] outline-none resize-none min-h-[48px] max-h-[160px] leading-relaxed font-sans"
            rows={1}
          />

          {/* Controls Bar inside Input Box */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#1e1e24] bg-[#0c0c0e]/60 rounded-b-2xl">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Plus Button Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className="p-1.5 rounded-lg bg-[#1c1c20] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title="Attach file or media"
                >
                  <Plus size={16} />
                </button>

                {/* Plus Menu Dropdown */}
                {isPlusMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl bg-[#141417] border border-[#27272a] shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-fadeIn font-sans">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d4d4d8] hover:bg-[#222226] hover:text-white transition-colors cursor-pointer"
                    >
                      <Paperclip size={14} className="text-sky-400" />
                      <span>Upload Document/Code</span>
                    </button>

                    <button
                      onClick={() => visionInputRef.current?.click()}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d4d4d8] hover:bg-[#222226] hover:text-white transition-colors cursor-pointer"
                    >
                      <ImageIcon size={14} className="text-purple-400" />
                      <span>Attach Vision Image</span>
                    </button>

                    <button
                      onClick={onOpenSnippetsModal}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d4d4d8] hover:bg-[#222226] hover:text-white transition-colors cursor-pointer"
                    >
                      <Bookmark size={14} className="text-amber-400" />
                      <span>Prompt Library</span>
                    </button>

                    <button
                      onClick={onOpenProjectModal}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d4d4d8] hover:bg-[#222226] hover:text-white transition-colors cursor-pointer"
                    >
                      <FolderOpen size={14} className="text-emerald-400" />
                      <span>Project Context ({projectCount})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Model Picker Chip */}
              <button
                onClick={onOpenModelPicker}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-[var(--accent)] text-xs text-[#d4d4d8] transition-colors cursor-pointer"
              >
                <Cpu size={13} className="text-[var(--accent)]" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate font-medium">
                  {currentModel?.name || 'Model'}
                </span>
                <ChevronDown size={12} className="text-[#71717a]" />
              </button>

              {/* Provider Picker Chip */}
              <button
                onClick={onOpenProviderPicker}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-purple-500/50 text-xs text-[#a1a1aa] transition-colors cursor-pointer"
              >
                <Server size={12} className="text-purple-400" />
                <span className="truncate max-w-[100px] font-mono">
                  {activeProvider?.name || 'Provider'}
                </span>
              </button>

              {/* Agent Mode Toggle Chip */}
              <button
                onClick={() => onUpdateSettings({ agent: !settings.agent })}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  settings.agent
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                    : 'bg-[#18181c] border-[#27272a] text-[#71717a] hover:text-[#a1a1aa]'
                }`}
                title="Toggle Autonomous Multi-Tool Agent"
              >
                <Sparkles size={12} />
                <span className="hidden md:inline">Agent</span>
              </button>

              {/* Live Preview Toggle Button */}
              <button
                onClick={onTogglePreview}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isPreviewOpen
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'bg-[#18181c] border-[#27272a] text-[#71717a] hover:text-white'
                }`}
                title="Toggle Sandbox Preview Window"
              >
                <MonitorPlay size={14} />
              </button>

              {/* Token Counter */}
              <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-[#52525b]">
                <span>{currentTokens} tokens</span>
              </div>
            </div>

            {/* Send or Stop Button */}
            <div className="flex items-center gap-2">
              {isBusy ? (
                <button
                  onClick={onStop}
                  className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer flex items-center justify-center animate-pulse"
                  title="Stop AI Generation"
                >
                  <Square size={16} className="fill-rose-300" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!text.trim() && !attachedFile && !attachedVision}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg ${
                    text.trim() || attachedFile || attachedVision
                      ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] scale-105'
                      : 'bg-[#1c1c20] text-[#52525b] cursor-not-allowed'
                  }`}
                  title="Send Prompt (Enter)"
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
