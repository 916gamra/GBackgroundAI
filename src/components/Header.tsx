import React from 'react';
import {
  Layers,
  Search,
  Monitor,
  Download,
  Trash2,
  Settings,
  FolderOpen,
  Home
} from 'lucide-react';

interface HeaderProps {
  onToggleSessions: () => void;
  onGoWelcome: () => void;
  onToggleSearch: () => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
  onExportChat: () => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  onOpenProject: () => void;
  projectCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSessions,
  onGoWelcome,
  onToggleSearch,
  onTogglePreview,
  isPreviewOpen,
  onExportChat,
  onClearChat,
  onOpenSettings,
  onOpenProject,
  projectCount
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-[#27272a] pt-[env(safe-area-inset-top,0px)]">
      <div className="h-[54px] px-3 md:px-5 flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSessions}
            className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Chat History"
            aria-label="Chat History"
          >
            <Layers size={18} />
          </button>

          <button
            onClick={onGoWelcome}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group text-left"
            title="Go to Welcome Screen"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#1c1c1f] to-[#09090b] border border-[#27272a] group-hover:border-[var(--accent)] flex items-center justify-center shadow-[0_0_12px_var(--accent-light)] shrink-0 transition-colors">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]" />
                  <div className="w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]" />
                </div>
                <div className="w-2.5 h-0.5 rounded-full bg-[var(--accent)]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="font-extrabold text-[14px] md:text-[15px] tracking-tight leading-tight text-white flex items-center gap-1">
                <span><span className="text-[var(--accent)]">G</span>BG AI</span>
                <span className="text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.2 rounded-md border border-[var(--accent)]/30">
                  v13
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={onGoWelcome}
            className="w-8 h-8 rounded-xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-all cursor-pointer ml-1 hidden sm:flex"
            title="Welcome / Home Screen"
          >
            <Home size={15} />
          </button>

          {projectCount > 0 && (
            <button
              onClick={onOpenProject}
              className="hidden sm:flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium hover:bg-amber-500/20 transition-all cursor-pointer"
              title="Project Context Active"
            >
              <FolderOpen size={13} />
              <span>{projectCount}</span>
            </button>
          )}
        </div>

        {/* Header action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSearch}
            className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[var(--accent)] flex items-center justify-center transition-all cursor-pointer"
            title="Search"
            aria-label="Search"
          >
            <Search size={17} />
          </button>

          <button
            onClick={onTogglePreview}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
              isPreviewOpen
                ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-sky-400'
            }`}
            title="Live Preview"
            aria-label="Live Preview"
          >
            <Monitor size={17} />
          </button>

          <button
            onClick={onExportChat}
            className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer hidden xs:flex"
            title="Export chat"
            aria-label="Export chat"
          >
            <Download size={17} />
          </button>

          <button
            onClick={onClearChat}
            className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={17} />
          </button>

          <div className="w-[1px] h-5 bg-[#27272a] mx-0.5" />

          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-all cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
