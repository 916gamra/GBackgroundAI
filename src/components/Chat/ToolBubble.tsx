import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Globe, Code, Calculator, CheckCircle2, AlertTriangle, FileText, Zap, BookOpen, BarChart3 } from 'lucide-react';
import { ChatMessage, ToolCall } from '../../types';

interface ToolBubbleProps {
  msg: ChatMessage;
  toolCall?: ToolCall;
}

export const ToolBubble: React.FC<ToolBubbleProps> = ({ msg, toolCall }) => {
  const [expanded, setExpanded] = useState(false);

  const getToolIcon = (fn: string) => {
    switch (fn) {
      case 'web_search': return <Globe size={14} className="text-emerald-400" />;
      case 'run_python': return <Terminal size={14} className="text-amber-400" />;
      case 'exec_js': return <Code size={14} className="text-blue-400" />;
      case 'make_chart': return <BarChart3 size={14} className="text-purple-400" />;
      case 'math_eval': return <Calculator size={14} className="text-pink-400" />;
      case 'wiki_search': return <BookOpen size={14} className="text-cyan-400" />;
      case 'create_file': return <FileText size={14} className="text-emerald-300" />;
      default: return <Zap size={14} className="text-[var(--accent)]" />;
    }
  };

  const name = toolCall?.function?.name || 'unknown_tool';
  const isError = msg.content?.includes('error:') || msg.content?.includes('SYSTEM VALIDATOR');
  let resultPreview = msg.content?.substring(0, 80) || '';
  if (resultPreview.length === 80) resultPreview += '...';
  
  if (isError) {
    resultPreview = 'Tool execution failed or was intercepted by validator.';
  }

  return (
    <div className="flex flex-col gap-1.5 w-full items-start group pl-3 md:pl-7 animate-fadeIn">
      <div 
        className={`w-full max-w-[98%] md:max-w-[92%] rounded-xl border transition-all cursor-pointer select-none overflow-hidden ${
          expanded ? 'bg-[#121215] border-[#27272a]' : 'bg-[#09090b]/50 border-[#18181b] hover:border-[#27272a]'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 px-3.5 py-2">
          {isError ? <AlertTriangle size={14} className="text-rose-400 shrink-0" /> : getToolIcon(name)}
          <span className={`font-mono text-xs font-bold ${isError ? 'text-rose-300' : 'text-[#d4d4d8]'}`}>
            {name}
          </span>
          {!expanded && (
            <span className="text-[11px] text-[#71717a] font-mono truncate hidden sm:inline-block max-w-[40%]">
              {resultPreview}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {!expanded && !isError && <CheckCircle2 size={13} className="text-emerald-500/50" />}
            {expanded ? <ChevronUp size={14} className="text-[#71717a]" /> : <ChevronDown size={14} className="text-[#71717a]" />}
          </div>
        </div>
        
        {expanded && (
          <div className="px-3.5 pb-3 pt-1 border-t border-[#18181b] mt-1">
            <div className="mb-2">
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider mb-1 block">Arguments</span>
              <pre className="text-[11px] text-sky-200/80 font-mono bg-[#09090b] p-2 rounded-lg border border-[#18181b] overflow-x-auto">
                {toolCall?.function?.arguments || '{}'}
              </pre>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider mb-1 block">Result</span>
              <pre className={`text-[11px] font-mono p-2 rounded-lg border overflow-x-auto whitespace-pre-wrap ${
                isError ? 'bg-rose-950/20 text-rose-300 border-rose-900/30' : 'bg-[#09090b] text-[#a1a1aa] border-[#18181b]'
              }`}>
                {msg.content || '(no output)'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
