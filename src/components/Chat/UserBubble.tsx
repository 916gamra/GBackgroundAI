import React, { useState } from 'react';
import { User, Copy, Pencil, Check } from 'lucide-react';
import { ChatMessage } from '../../types';

interface UserBubbleProps {
  msg: ChatMessage;
  index: number;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onEditResend: (index: number, newText: string) => void;
}

export const UserBubble: React.FC<UserBubbleProps> = ({
  msg,
  index,
  onCopy,
  copiedId,
  onEditResend
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content || '');

  const msgId = `user-msg-${index}`;
  const isCopied = copiedId === msgId;

  return (
    <div className="flex flex-col gap-1 w-full items-end group my-1.5 animate-fadeIn">
      {/* Header Info */}
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-mono text-[#a1a1aa] select-none">
        {msg.ts && (
          <span className="text-[10px] text-[#71717a]">
            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <span className="font-medium text-[#e4e4e7]">You</span>
        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0">
          <User size={12} />
        </div>
      </div>

      {/* Main Bubble Box - Strict Right Alignment */}
      <div className="max-w-[90%] md:max-w-[80%] rounded-2xl rounded-tr-xs bg-gradient-to-br from-[#1e1e24] to-[#141418] border border-[#2f2f38] px-4 py-3 text-[14px] text-white shadow-md">
        {/* Vision Image Attachment if present */}
        {msg.vi && (
          <div className="mb-2.5 overflow-hidden rounded-xl border border-white/10 max-w-sm">
            <img
              src={msg.vi}
              alt="User Attachment"
              className="max-h-60 w-full object-cover rounded-xl hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Inline Edit Form or Message Text */}
        {isEditing ? (
          <div className="flex flex-col gap-2 min-w-[280px] sm:min-w-[360px]">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[var(--accent)] rounded-xl p-2.5 text-sm text-white font-sans outline-none resize-none min-h-[70px] focus:ring-2 focus:ring-[var(--accent)]/30"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(msg.content || '');
                }}
                className="px-3 py-1 rounded-lg text-xs font-mono text-[#a1a1aa] hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editText.trim()) {
                    onEditResend(index, editText.trim());
                    setIsEditing(false);
                  }
                }}
                className="px-3.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm cursor-pointer"
              >
                Resend
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed text-[#f4f4f5] break-words">
            {msg.content}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-1 select-none">
          <button
            onClick={() => onCopy(msg.content || '', msgId)}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors text-[10px] flex items-center gap-1 cursor-pointer"
            title="Copy text"
          >
            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => {
              setIsEditing(true);
              setEditText(msg.content || '');
            }}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors text-[10px] flex items-center gap-1 cursor-pointer"
            title="Edit message & resend"
          >
            <Pencil size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
