import React, { useState, useRef, useEffect } from 'react';
import { GeneratedFile } from '../../types';
import {
  FileCode,
  FileImage,
  FileText,
  Download,
  Trash2,
  X,
  Copy,
  Check,
  Terminal,
  Play,
  Eye,
  Code,
  RotateCcw,
  ExternalLink,
  Search,
  ArrowLeft,
  Sparkles,
  Layers,
  Loader2
} from 'lucide-react';
import { runPython } from '../../services/agentTools';

interface ArtifactsPanelProps {
  files: GeneratedFile[];
  activeFile: GeneratedFile | null;
  onSelectFile: (file: GeneratedFile | null) => void;
  onDeleteFile: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({
  files,
  activeFile,
  onSelectFile,
  onDeleteFile,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewerMode, setViewerMode] = useState<'code' | 'preview'>('code');
  const [pythonOutput, setPythonOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Filter files
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.language || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isRunnable = (file: GeneratedFile | null) => {
    if (!file) return false;
    const lang = (file.language || '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase();
    return (
      lang === 'html' ||
      lang === 'svg' ||
      lang === 'javascript' ||
      lang === 'jsx' ||
      lang === 'python' ||
      lang === 'py' ||
      ext === 'html' ||
      ext === 'svg' ||
      ext === 'js' ||
      ext === 'py'
    );
  };

  const getLanguageBadge = (file: GeneratedFile) => {
    const lang = (file.language || file.name.split('.').pop() || 'txt').toLowerCase();
    switch (lang) {
      case 'html':
        return { label: 'HTML', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
      case 'python':
      case 'py':
        return { label: 'PYTHON', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'javascript':
      case 'js':
      case 'jsx':
        return { label: 'JAVASCRIPT', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' };
      case 'typescript':
      case 'ts':
      case 'tsx':
        return { label: 'TYPESCRIPT', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'css':
        return { label: 'CSS', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
      case 'json':
        return { label: 'JSON', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: lang.toUpperCase(), color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    }
  };

  const downloadFile = (file: GeneratedFile) => {
    const mimeType = file.name.endsWith('.html')
      ? 'text/html;charset=utf-8'
      : file.name.endsWith('.json')
      ? 'application/json;charset=utf-8'
      : 'text/plain;charset=utf-8';

    const blob = new Blob([file.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleRunArtifact = async () => {
    if (!activeFile) return;
    setViewerMode('preview');

    const lang = (activeFile.language || activeFile.name.split('.').pop() || '').toLowerCase();
    if (lang === 'python' || lang === 'py') {
      setIsExecuting(true);
      setPythonOutput('⏳ Executing Python script via Pyodide sandbox...');
      const startTime = performance.now();
      try {
        const out = await runPython(activeFile.content);
        setExecutionTime(Math.round(performance.now() - startTime));
        setPythonOutput(out || '✅ Program finished with return code 0 (no stdout output).');
      } catch (err: any) {
        setExecutionTime(Math.round(performance.now() - startTime));
        setPythonOutput(`❌ Execution Error:\n${err.message || String(err)}`);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  // Update HTML preview iframe when in preview mode
  useEffect(() => {
    if (viewerMode === 'preview' && activeFile && iframeRef.current) {
      const lang = (activeFile.language || activeFile.name.split('.').pop() || '').toLowerCase();
      if (lang === 'html' || lang === 'svg') {
        iframeRef.current.srcdoc = activeFile.content;
      } else if (lang === 'javascript' || lang === 'js' || lang === 'jsx') {
        iframeRef.current.srcdoc = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>body { background: #09090b; color: #fff; font-family: system-ui, sans-serif; padding: 16px; }</style>
            </head>
            <body>
              <div id="root"></div>
              <script>
                try {
                  ${activeFile.content}
                } catch (err) {
                  document.body.innerHTML = '<div style="color:#f43f5e;font-family:monospace;padding:12px;background:#271216;border-radius:12px;border:1px solid #f43f5e55;"><strong>Script Error:</strong> ' + err.message + '</div>';
                }
              </script>
            </body>
          </html>
        `;
      }
    }
  }, [viewerMode, activeFile]);

  // If user selected a file to view, display the Floating Viewer Card
  if (activeFile) {
    const badge = getLanguageBadge(activeFile);
    const runnable = isRunnable(activeFile);
    const isPython = (activeFile.language || activeFile.name.split('.').pop() || '').toLowerCase().includes('py');

    return (
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
        onClick={() => onSelectFile(null)}
      >
        <div
          className="w-full max-w-2xl bg-[#121215] border border-[#27272a] rounded-[24px] shadow-2xl flex flex-col max-h-[92dvh] h-[85dvh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Header Controls Bar */}
          <div className="h-14 bg-[#18181c] border-b border-[#27272a] px-3.5 flex items-center justify-between gap-2 shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => onSelectFile(null)}
                className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors shrink-0"
                title="Back to Artifacts list"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white truncate">{activeFile.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Code vs Run/Preview Mode Toggle (if runnable) */}
              {runnable && (
                <div className="flex items-center bg-[#0e0e11] p-0.5 rounded-xl border border-[#27272a]">
                  <button
                    onClick={() => setViewerMode('code')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      viewerMode === 'code'
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Code size={13} />
                    <span className="hidden xs:inline">Code</span>
                  </button>
                  <button
                    onClick={handleRunArtifact}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      viewerMode === 'preview'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Play size={12} className="fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              )}

              {/* Copy Button */}
              <button
                onClick={() => handleCopyCode(activeFile.content)}
                className="p-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-[#d4d4d8] hover:text-white border border-[#2e2e38] transition-all flex items-center justify-center"
                title="Copy Code"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              {/* Download Button */}
              <button
                onClick={() => downloadFile(activeFile)}
                className="p-2 rounded-xl bg-[var(--accent-light)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white border border-[var(--accent)]/40 transition-all flex items-center justify-center shadow-sm"
                title="Download file"
              >
                <Download size={14} />
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  onSelectFile(null);
                  onClose();
                }}
                className="p-2 rounded-xl text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 overflow-hidden bg-[#0a0a0c] flex flex-col relative">
            {viewerMode === 'code' ? (
              <div className="flex-1 overflow-auto p-4 custom-scrollbar" dir="ltr">
                <pre className="font-mono text-xs leading-relaxed text-[#e4e4e7] select-text">
                  <code>{activeFile.content}</code>
                </pre>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d11]">
                {isPython ? (
                  /* Python Output Terminal Console */
                  <div className="flex-1 flex flex-col p-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#24242c] text-xs font-mono text-[#a1a1aa]">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-amber-400" />
                        <span className="text-white font-semibold">Pyodide Sandbox Terminal</span>
                        {isExecuting && <Loader2 size={13} className="animate-spin text-amber-400 ml-1" />}
                      </div>
                      {executionTime !== null && (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {executionTime}ms
                        </span>
                      )}
                    </div>
                    <div className="flex-1 overflow-auto bg-[#08080a] p-3 rounded-xl border border-[#222228] font-mono text-xs text-[#e4e4e7] whitespace-pre-wrap select-text custom-scrollbar">
                      {pythonOutput}
                    </div>
                  </div>
                ) : (
                  /* Interactive Web Preview Sandbox Iframe */
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-none bg-[#09090b]"
                    title="Artifact Live Preview"
                    sandbox="allow-scripts allow-modals allow-forms"
                  />
                )}
              </div>
            )}
          </div>

          {/* Floating Card Footer Info */}
          <div className="h-8 bg-[#141418] border-t border-[#24242c] px-4 flex items-center justify-between text-[10px] font-mono text-[#71717a]">
            <span>{activeFile.content.split('\n').length} lines • {activeFile.content.length} bytes</span>
            <span>{activeFile.createdAt || 'Generated in session'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the Mobile Bottom Sheet showing all Artifacts
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#121215] border-t border-[#27272a] rounded-t-[28px] p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85dvh] animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Bottom sheet drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-[#3f3f46] mx-auto mb-3 shrink-0 cursor-grab" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
              <Terminal size={17} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Generated Artifacts & Files</span>
                <span className="px-2 py-0.5 rounded-full bg-[#18181c] border border-[#27272a] text-[10px] text-[var(--accent)] font-mono">
                  {files.length}
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            title="Close Sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input if files exist */}
        {files.length > 2 && (
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search artifacts by name or language..."
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-[#71717a] outline-none focus:border-[var(--accent)] font-sans"
            />
          </div>
        )}

        {/* Artifacts List View */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[160px] max-h-[55dvh]">
          {filteredFiles.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-[#71717a] space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#71717a]">
                <FileCode size={22} />
              </div>
              <p className="text-xs text-[#a1a1aa] font-medium">No artifacts or files created yet.</p>
              <p className="text-[11px] text-[#71717a] max-w-xs">
                Ask the AI agent to write code, generate HTML widgets, or write scripts to view them here.
              </p>
            </div>
          ) : (
            filteredFiles.map(file => {
              const badge = getLanguageBadge(file);
              const runnable = isRunnable(file);

              return (
                <div
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file);
                    setViewerMode('code');
                  }}
                  className="group p-3 rounded-2xl bg-[#18181c] hover:bg-[#202026] active:scale-[0.99] border border-[#27272a] hover:border-[var(--accent)]/50 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#121215] border border-[#25252d] flex items-center justify-center text-[var(--accent)] shrink-0">
                      {file.type === 'code' ? <FileCode size={18} /> : <FileImage size={18} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-[var(--accent)] transition-colors truncate">
                          {file.name}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {runnable && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            RUNNABLE
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#71717a] font-mono mt-0.5 flex items-center gap-2">
                        <span>{file.content.split('\n').length} lines</span>
                        <span>•</span>
                        <span>{file.createdAt || 'Generated'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                      className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                      title="Download file"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={e => onDeleteFile(file.id, e)}
                      className="p-2 rounded-xl text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
