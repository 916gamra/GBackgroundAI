import React from 'react';
import { Plus, X, Trash2, RotateCcw, MessageSquare, Home } from 'lucide-react';
import { Session } from '../../types';
import { PremiumAvatar } from '../PremiumAvatar';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRestoreTrash: () => void;
  onGoWelcome?: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRestoreTrash,
  onGoWelcome
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end justify-center p-0 animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0d0d10] border-t border-x border-[#27272a] rounded-t-[32px] p-6 shadow-2xl flex flex-col max-h-[85dvh] animate-slideUp cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Samsung One UI Native Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-[#3f3f46] mx-auto mb-4 shrink-0" />

        {/* Samsung Style Sheet Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5 font-extrabold text-base text-white tracking-wide">
            <PremiumAvatar status="idle" className="w-9 h-9 !rounded-2xl shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">المحادثات والجلسات</div>
              <div className="text-[10px] text-[#a1a1aa] font-sans font-normal">سجل المحادثات المخزنة</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#18181c] text-[#a1a1aa] hover:text-white hover:bg-[#222228] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button
            onClick={() => {
              onCreateSession();
              onClose();
            }}
            className="py-3 px-4 rounded-2xl bg-[var(--accent)] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent-light)] cursor-pointer"
          >
            <Plus size={16} />
            <span>محادثة جديدة</span>
          </button>
          {onGoWelcome && (
            <button
              onClick={() => {
                onGoWelcome();
                onClose();
              }}
              className="py-3 px-4 rounded-2xl bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home size={16} className="text-[var(--accent)]" />
              <span>الرئيسية</span>
            </button>
          )}
        </div>

        {/* Restore deleted */}
        <button
          onClick={onRestoreTrash}
          className="w-full py-2 px-3 rounded-xl bg-[#141418] border border-dashed border-[#27272a] text-[#a1a1aa] hover:text-amber-300 hover:border-amber-500/40 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors mb-3 cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>استعادة آخر محادثة محذوفة</span>
        </button>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
          {sessions.map(s => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#181820] border-[var(--accent)] text-white shadow-md'
                    : 'bg-[#121215] border-[#27272a] text-[#a1a1aa] hover:bg-[#1a1a20] hover:text-[#f4f4f5]'
                }`}
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="font-bold text-xs text-white truncate">{s.title || 'محادثة جديدة'}</div>
                  <div className="text-[10px] text-[#71717a] mt-0.5 font-mono">
                    {new Date(s.date).toLocaleDateString()} • {s.history.length} رسالة
                  </div>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="p-1.5 rounded-xl text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="حذف المحادثة"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
