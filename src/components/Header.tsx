import React from 'react';
import {
  Layers,
  Search,
  Monitor,
  Download,
  Trash2,
  Settings,
  FolderOpen,
  Home,
  Files,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { PremiumAvatar, AvatarStatus } from './PremiumAvatar';
import { BEHAVIOR_CONFIGS, AgentBehaviorState } from '../bot';

interface HeaderProps {
  onToggleSessions: () => void;
  onGoWelcome: () => void;
  onToggleSearch: () => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
  onToggleArtifacts: () => void;
  isArtifactsOpen: boolean;
  artifactCount: number;
  onExportChat: () => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  onOpenDocs?: () => void;
  onOpenProject: () => void;
  projectCount: number;
  agentStatus?: AvatarStatus;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSessions,
  onGoWelcome,
  onToggleSearch,
  onTogglePreview,
  isPreviewOpen,
  onToggleArtifacts,
  isArtifactsOpen,
  artifactCount,
  onExportChat,
  onClearChat,
  onOpenSettings,
  onOpenDocs,
  onOpenProject,
  projectCount,
  agentStatus = 'idle'
}) => {
  const behavior = BEHAVIOR_CONFIGS[agentStatus as AgentBehaviorState] || BEHAVIOR_CONFIGS.idle;

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
            title={`${behavior.labelAr} - ${behavior.descriptionAr}`}
          >
            <PremiumAvatar
              status={agentStatus}
              interactive={true}
              className="w-8 h-8"
              showStatusBadge={agentStatus !== 'idle'}
            />
            <div className="flex flex-col">
              <div className="font-extrabold text-[14px] md:text-[15px] tracking-tight leading-tight text-white flex items-center gap-1.5">
                <span><span className="text-[var(--accent)]">G</span>BG AI</span>
                <span className="text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.2 rounded-md border border-[var(--accent)]/30">
                  v14
                </span>
                {agentStatus !== 'idle' && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-sans font-medium bg-[#18181c] border border-[#27272a] text-[#a1a1aa] animate-fadeIn">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: behavior.glowColor.startsWith('var') ? 'var(--accent)' : behavior.glowColor }}
                    />
                    <span>{behavior.labelAr}</span>
                  </span>
                )}
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
          {onOpenDocs && (
            <button
              onClick={onOpenDocs}
              className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-amber-400 hover:border-amber-500/50 flex items-center justify-center transition-all cursor-pointer"
              title="Developer Documentation & API Hub"
              aria-label="Developer Docs"
            >
              <BookOpen size={17} />
            </button>
          )}

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
            onClick={onToggleArtifacts}
            className={`relative w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
              isArtifactsOpen
                ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-purple-400'
            }`}
            title="Artifacts & File Manager"
            aria-label="Artifacts & File Manager"
          >
            <Files size={17} />
            {artifactCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {artifactCount}
              </span>
            )}
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
