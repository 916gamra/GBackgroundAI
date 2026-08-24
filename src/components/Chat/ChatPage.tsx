import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Zap, Globe, Terminal, Code, BarChart3, Calculator, BookOpen } from 'lucide-react';
import { UserBubble } from './UserBubble';
import { AgentBubble } from './AgentBubble';
import { ToolBubble } from './ToolBubble';
import { ChatMessage, AgentStepEvent, AppSettings, Provider } from '../../types';

interface ChatPageProps {
  history: ChatMessage[];
  streamingContent: string;
  streamingThinking: string;
  isStreaming: boolean;
  agentSteps: AgentStepEvent[];
  isAgentRunning: boolean;
  typingStatus: string;
  typingElapsed: number;
  currentModelId: string;
  onQuickPrompt: (text: string) => void;
  onPreviewCode: (code: string) => void;
  onRetry: () => void;
  onEditResend: (index: number, newText: string) => void;
  onDeleteMessage: (index: number) => void;
  onSpeak: (text: string) => void;
  searchQuery: string;
  isPreviewOpen: boolean;

  // InputBar props
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeProvider: Provider | undefined;
  onOpenModelPicker: () => void;
  onOpenProviderPicker: () => void;
  onOpenProjectModal: () => void;
  onOpenSnippetsModal: () => void;
  onOpenSettingsModal: () => void;
  onTogglePreview: () => void;
  onSend: (text: string, visionFile?: { name: string; url: string }) => void;
  onStop: () => void;
  isBusy: boolean;
  totalSessionTokens: number;
  projectCount: number;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  history,
  streamingContent,
  streamingThinking,
  isStreaming,
  agentSteps,
  isAgentRunning,
  typingStatus,
  typingElapsed,
  currentModelId,
  onQuickPrompt,
  onPreviewCode,
  onRetry,
  onEditResend,
  onDeleteMessage,
  onSpeak,
  searchQuery,
  isPreviewOpen,
  settings,
  onUpdateSettings,
  activeProvider,
  onOpenModelPicker,
  onOpenProviderPicker,
  onOpenProjectModal,
  onOpenSnippetsModal,
  onOpenSettingsModal,
  onTogglePreview,
  onSend,
  onStop,
  isBusy,
  totalSessionTokens,
  projectCount
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Smooth Auto Scroll to Bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Detect Scroll position for floating "Scroll to Bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isFarFromBottom);
  };

  // Auto scroll on new messages, streaming updates, or agent steps
  useEffect(() => {
    scrollToBottom(true);
  }, [history, streamingContent, streamingThinking, agentSteps.length, isStreaming, isAgentRunning, scrollToBottom]);

  const getToolIcon = (fn: string) => {
    switch (fn) {
      case 'web_search': return <Globe size={13} className="text-emerald-400" />;
      case 'run_python': return <Terminal size={13} className="text-amber-400" />;
      case 'exec_js': return <Code size={13} className="text-blue-400" />;
      case 'make_chart': return <BarChart3 size={13} className="text-purple-400" />;
      case 'math_eval': return <Calculator size={13} className="text-pink-400" />;
      case 'wiki_search': return <BookOpen size={13} className="text-cyan-400" />;
      default: return <Zap size={13} className="text-[var(--accent)]" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-[#050505]">
      {/* Scrollable Chat Message Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-3 py-4 md:px-8 md:py-6 flex flex-col gap-3 transition-all duration-300 scroll-smooth ${
          isPreviewOpen ? 'lg:mr-[48%] xl:mr-[50%]' : ''
        }`}
      >
        {/* Render Chat History */}
        {history.map((msg, index) => {
          if (msg.role === 'system') return null;

          if (msg.role === 'tool') {
            // Find corresponding tool_call in previous messages
            let matchedToolCall = undefined;
            for (let i = index - 1; i >= 0; i--) {
              const prevMsg = history[i];
              if (prevMsg.role === 'assistant' && prevMsg.tool_calls) {
                const found = prevMsg.tool_calls.find(tc => tc.id === msg.tool_call_id);
                if (found) {
                  matchedToolCall = found;
                  break;
                }
              }
            }
            return <ToolBubble key={`msg-${index}`} msg={msg} toolCall={matchedToolCall} />;
          }

          const isUser = msg.role === 'user';

          if (isUser) {
            return (
              <UserBubble
                key={`msg-${index}`}
                msg={msg}
                index={index}
                onCopy={handleCopy}
                copiedId={copiedId}
                onEditResend={onEditResend}
              />
            );
          } else {
            return (
              <AgentBubble
                key={`msg-${index}`}
                msg={msg}
                index={index}
                currentModelId={currentModelId}
                onCopy={handleCopy}
                copiedId={copiedId}
                onPreviewCode={onPreviewCode}
                onRetry={onRetry}
                onDeleteMessage={onDeleteMessage}
                onSpeak={onSpeak}
              />
            );
          }
        })}

        {/* Live Agent Tool Steps Stream */}
        {agentSteps.length > 0 && (
          <div className="flex flex-col gap-2 w-full max-w-[98%] md:max-w-[92%] my-2 animate-fadeIn">
            {agentSteps.map(step => (
              <div
                key={step.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all ${
                  step.status === 'running'
                    ? 'bg-[#18181c] border-purple-500/40 border-l-4 border-l-purple-500 text-purple-300 animate-pulse'
                    : step.status === 'done'
                    ? 'bg-[#121214] border-[#27272a] border-l-4 border-l-emerald-500 text-[#a1a1aa]'
                    : 'bg-rose-950/20 border-rose-500/40 border-l-4 border-l-rose-500 text-rose-300'
                }`}
              >
                {getToolIcon(step.fn)}
                <span className="font-bold text-[var(--accent)]">{step.fn}</span>
                <span className="text-[#71717a] truncate max-w-md">{step.label}</span>
                {step.status === 'running' && (
                  <div className="ml-auto w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {step.status === 'done' && (
                  <Check size={14} className="ml-auto text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active Streaming Response Bubble */}
        {isStreaming && (
          <AgentBubble
            isStreamingMode={true}
            streamingContent={streamingContent}
            streamingThinking={streamingThinking}
            typingStatus={typingStatus}
            typingElapsed={typingElapsed}
            currentModelId={currentModelId}
            onCopy={handleCopy}
            copiedId={copiedId}
            onPreviewCode={onPreviewCode}
          />
        )}

        {/* Bottom Scroll Anchor */}
        <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
      </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-6 right-6 z-40 p-2.5 rounded-full bg-[var(--accent)] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-white/20"
          title="Scroll to latest messages"
        >
          <ChevronDown size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
