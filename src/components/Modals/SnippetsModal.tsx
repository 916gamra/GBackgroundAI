import React, { useState } from 'react';
import { Bookmark, X, Plus, Trash2 } from 'lucide-react';
import { Snippet } from '../../types';

interface SnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippets: Snippet[];
  onAddSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (index: number) => void;
  onUseSnippet: (code: string) => void;
}

export const SnippetsModal: React.FC<SnippetsModalProps> = ({
  isOpen,
  onClose,
  snippets,
  onAddSnippet,
  onDeleteSnippet,
  onUseSnippet
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !code.trim()) return;
    onAddSnippet({ title: title.trim(), code: code.trim() });
    setTitle('');
    setCode('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#121215] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] animate-slideUp sm:animate-fadeIn">
        {/* Mobile handle */}
        <div className="w-12 h-1 rounded-full bg-[#3f3f46] mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <Bookmark size={18} className="text-pink-400" />
            <span>Prompt Snippets</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Add snippet form */}
        {isAdding ? (
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#18181c] border border-[#27272a] mb-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Snippet title (e.g. React Component Template)"
              className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent)]"
            />
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Prompt or code content..."
              rows={3}
              className="w-full bg-[#121214] border border-[#27272a] rounded-xl p-2.5 text-xs font-mono text-white outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 rounded-lg text-xs text-[#a1a1aa] hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-[#f4f4f5] hover:border-[var(--accent)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mb-3 cursor-pointer"
          >
            <Plus size={14} />
            <span>Create New Snippet</span>
          </button>
        )}

        {/* Snippets list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {snippets.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#71717a]">No custom snippets yet.</div>
          ) : (
            snippets.map((s, index) => (
              <div
                key={index}
                onClick={() => {
                  onUseSnippet(s.code);
                  onClose();
                }}
                className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="font-semibold text-xs text-white truncate">{s.title}</div>
                  <div className="text-[10px] text-[#71717a] font-mono truncate mt-0.5">{s.code}</div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteSnippet(index);
                  }}
                  className="p-1 rounded text-[#71717a] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
