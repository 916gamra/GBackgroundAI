import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Trash2,
  Download,
  Play,
  Brain,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// 'highlight.js/lib/common' ships the ~40 most used languages instead of the
// full 190+ language set (which alone was ~1 MB of the shipped bundle).
import hljs from 'highlight.js/lib/common';
import { ChatMessage } from '../../types';
import { MODELS, parseThink } from '../../services/aiService';
import { PremiumAvatar } from '../PremiumAvatar';
import { resolveAgentBehavior } from '../../bot';

interface AgentBubbleProps {
  msg?: ChatMessage;
  index?: number;
  currentModelId: string;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onPreviewCode: (code: string) => void;
  onRetry?: () => void;
  onDeleteMessage?: (index: number) => void;
  onSpeak?: (text: string) => void;

  // Streaming props if used in active streaming mode
  isStreamingMode?: boolean;
  streamingContent?: string;
  streamingThinking?: string;
  typingStatus?: string;
  typingElapsed?: number;
}

export const AgentBubble: React.FC<AgentBubbleProps> = React.memo(({
  msg,
  index = 0,
  currentModelId,
  onCopy,
  copiedId,
  onPreviewCode,
  onRetry,
  onDeleteMessage,
  onSpeak,
  isStreamingMode = false,
  streamingContent = '',
  streamingThinking = '',
  typingStatus = '',
  typingElapsed = 0
}) => {
  const [isThoughtCollapsed, setIsThoughtCollapsed] = useState(true);

  // Prepare display content and thinking text
  const rawContent = isStreamingMode ? streamingContent : (msg?.content || '');
  const parsed = useMemo(() => {
    if (msg?.content) return parseThink(msg.content);
    return { display: rawContent, thinking: msg?.think || '' };
  }, [msg?.content, msg?.think, rawContent]);

  const displayContent = isStreamingMode ? streamingContent : (parsed.display || msg?.content || '');
  const thinkingText = isStreamingMode ? streamingThinking : (msg?.think || parsed.thinking);

  const msgId = isStreamingMode ? 'streaming-msg' : `agent-msg-${index}`;
  const isCopied = copiedId === msgId;

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime = ext === 'html' ? 'text/html' : ext === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMarkdown = (text: string) => {
    try {
      const parsedHtml = marked.parse(text || '', { async: false }) as string;
      return DOMPurify.sanitize(parsedHtml);
    } catch {
      return DOMPurify.sanitize(text || '');
    }
  };

  // Enhance code blocks with preview and copy buttons with memoization
  const renderedMessageParts = useMemo(() => {
    const content = displayContent;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <div
            key={`text-${lastIndex}`}
            dir="auto"
            className="markdown-body text-[#e4e4e7] leading-relaxed text-start"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(textBefore) }}
          />
        );
      }

      const lang = (match[1] || 'code').toLowerCase();
      const code = match[2];
      const isWeb = ['html', 'htm', 'jsx', 'tsx', 'js', 'javascript', 'css', 'svg', 'vue'].includes(lang);
      const codeId = `code-${match.index}`;
      const isCodeCopied = copiedId === codeId;

      let highlighted = code;
      try {
        if (hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(code, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(code).value;
        }
      } catch {
        highlighted = code;
      }

      parts.push(
        <div key={codeId} className="my-3.5 rounded-xl overflow-hidden border border-[#27272a] bg-[#09090b] shadow-md">
          <div className="h-8 bg-[#141417] px-3 border-b border-[#27272a] flex items-center justify-between font-mono text-[11px] text-[#a1a1aa] select-none">
            <span className="font-bold text-[var(--accent)] uppercase tracking-wider">{lang}</span>
            <div className="flex items-center gap-1.5">
              {isWeb && (
                <button
                  onClick={() => onPreviewCode(code)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-[10px] font-sans font-medium transition-colors cursor-pointer"
                >
                  <Play size={11} />
                  <span>Preview</span>
                </button>
              )}
              <button
                onClick={() => onCopy(code, codeId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1f1f23] border border-[#27272a] text-[#d4d4d8] hover:text-white text-[10px] font-sans font-medium transition-colors cursor-pointer"
              >
                {isCodeCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{isCodeCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownloadFile(code, `code.${lang === 'javascript' ? 'js' : lang}`)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-sans font-medium transition-colors cursor-pointer"
              >
                <Download size={11} />
                <span>Save</span>
              </button>
            </div>
          </div>
          <pre className="p-3.5 overflow-x-auto text-[12px] font-mono leading-relaxed text-[#e4e4e7] bg-[#08080a]">
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <div
          key={`text-${lastIndex}`}
          dir="auto"
          className="markdown-body text-[#e4e4e7] leading-relaxed text-start"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(remainingText) }}
        />
      );
    }

    return parts;
  }, [displayContent, copiedId, onPreviewCode, onCopy]);

  const modelKey = msg?.mod || currentModelId;
  const modelInfo = MODELS[modelKey];

  // Resolve dynamic avatar behavior
  const bubbleBehavior = resolveAgentBehavior({
    isStreaming: isStreamingMode,
    isBusy: isStreamingMode,
    typingStatus,
    hasError: !!msg?.error,
    isAgentRunning: msg?.ag || typingStatus?.includes('tool') || typingStatus?.includes('exec')
  });

  return (
    <div className="flex flex-col gap-1.5 w-full items-start group my-2 animate-fadeIn">
      {/* Header Info */}
      <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-[#71717a] select-none">
        <PremiumAvatar
          behaviorState={bubbleBehavior.state}
          interactive={true}
          className="w-5 h-5 !rounded-lg"
        />
        <span className="font-semibold text-[#f4f4f5]">
          {modelInfo?.name || 'AI Assistant'}
        </span>
        {msg?.ag && (
          <span className="px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[9px] font-bold">
            AGENT
          </span>
        )}
        {modelInfo?.pv && (
          <span className="px-1.5 py-0.2 rounded bg-[#1f1f23] border border-[#27272a] text-[#a1a1aa] text-[9px] font-mono">
            {modelInfo.pv.toUpperCase()}
          </span>
        )}
        {isStreamingMode && (
          <span className="text-[var(--accent)] font-medium">({typingStatus || bubbleBehavior.labelAr}) {typingElapsed > 0 ? `${typingElapsed.toFixed(1)}s` : ''}</span>
        )}
        {msg?.ts && !isStreamingMode && (
          <span className="text-[10px] text-[#52525b]">
            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Main Bubble Container - Strict Left Alignment */}
      <div className={`w-full max-w-[98%] md:max-w-[92%] rounded-2xl rounded-tl-xs bg-[#121215] border ${
        isStreamingMode ? 'border-[var(--accent)]/50 shadow-lg shadow-[var(--accent)]/10' : 'border-[#27272a] shadow-md'
      } p-4 md:p-5 transition-all`}>
        
        {/* Thinking / Reasoning Accordion */}
        {thinkingText && (
          <div className="mb-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 border-l-4 border-l-purple-400 overflow-hidden">
            <div
              onClick={() => setIsThoughtCollapsed(!isThoughtCollapsed)}
              className="px-3 py-2 flex items-center justify-between cursor-pointer select-none text-purple-300 text-xs font-semibold hover:bg-purple-500/10 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Brain size={14} className="text-purple-400" />
                <span>Chain-of-Thought Reasoning</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onCopy(thinkingText, `think-${msgId}`);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors cursor-pointer"
                >
                  {copiedId === `think-${msgId}` ? 'Copied' : 'Copy'}
                </button>
                {isThoughtCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>
            {!isThoughtCollapsed && (
              <div className="px-3.5 py-2.5 border-t border-purple-500/10 font-mono text-[11.5px] leading-relaxed text-purple-200/90 whitespace-pre-wrap bg-purple-950/20 max-h-96 overflow-y-auto">
                {thinkingText}
              </div>
            )}
          </div>
        )}

        {/* Inline media produced by tools during this turn (charts…) */}
        {msg?.images && msg.images.length > 0 && (
          <div className="mb-3.5 flex flex-col gap-2" dir="auto">
            {msg.images.map((img, i) => (
              <figure key={`img-${i}`} className="rounded-xl overflow-hidden border border-[#27272a] bg-[#09090b]">
                <img
                  src={img.url}
                  alt={img.alt || 'Generated chart'}
                  loading="lazy"
                  className="w-full max-h-[420px] object-contain bg-[#121214]"
                />
                <figcaption className="px-3 py-1.5 text-[11px] font-mono text-[#a1a1aa] border-t border-[#27272a] flex items-center justify-between gap-2">
                  <span className="truncate">{img.alt || 'Generated chart'}</span>
                  <button
                    onClick={() => downloadDataUrl(img.url, `${(img.alt || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`)}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-sans transition-colors cursor-pointer"
                    title="Download PNG"
                  >
                    <Download size={11} />
                    <span>PNG</span>
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* Error State or Custom Markdown Render */}
        {msg?.error ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 whitespace-pre-wrap">{msg.content}</div>
          </div>
        ) : (
          <div className={isStreamingMode ? 'streaming-cursor' : ''} dir="auto">
            {renderedMessageParts}
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar for Agent - Always Visible */}
      {!isStreamingMode && msg && (
        <div className="flex items-center gap-1.5 ml-1 mt-1 select-none text-xs">
          <button
            onClick={() => onCopy(displayContent, msgId)}
            className="px-2.5 py-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
            title="Copy response"
          >
            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
          
          {onSpeak && (
            <button
              onClick={() => onSpeak(displayContent)}
              className="px-2.5 py-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
              title="Read aloud"
            >
              <Volume2 size={12} />
              <span>Read</span>
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2.5 py-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
              title="Retry generation"
            >
              <RotateCcw size={12} />
              <span>Retry</span>
            </button>
          )}

          {onDeleteMessage && index !== undefined && (
            <button
              onClick={() => onDeleteMessage(index)}
              className="p-1.5 rounded-lg text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-[11px] cursor-pointer"
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
