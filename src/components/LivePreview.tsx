import React, { useRef, useEffect } from 'react';
import { ExternalLink, RotateCcw, X, Download, Code2, Sparkles } from 'lucide-react';

interface LivePreviewProps {
  htmlCode: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  htmlCode,
  isOpen,
  onClose,
  onRefresh
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && isOpen) {
      if (htmlCode && htmlCode.trim()) {
        iframeRef.current.srcdoc = htmlCode;
      } else {
        iframeRef.current.srcdoc = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  margin: 0;
                  background: #09090b;
                  color: #71717a;
                  font-family: system-ui, -apple-system, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  text-align: center;
                  padding: 20px;
                  box-sizing: border-box;
                }
                .icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; color: #38bdf8; }
                h3 { color: #d4d4d8; margin: 0 0 6px 0; font-size: 15px; }
                p { font-size: 13px; max-width: 320px; line-height: 1.5; margin: 0; }
              </style>
            </head>
            <body>
              <div class="icon">◉</div>
              <h3>Live Sandbox Waiting</h3>
              <p>Ask the AI to generate an HTML, CSS, JavaScript, or React widget to preview it in real-time here.</p>
            </body>
          </html>
        `;
      }
    }
  }, [htmlCode, isOpen]);

  const handleOpenNewTab = () => {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownload = () => {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preview-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121215] border border-[#27272a] rounded-[24px] shadow-2xl flex flex-col max-h-[92dvh] h-[85dvh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="h-14 bg-[#18181c] border-b border-[#27272a] px-3.5 flex items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Code2 size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Live App Sandbox</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-[#71717a] font-mono">Interactive Web Runtime</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              disabled={!htmlCode}
              className="p-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-[#d4d4d8] hover:text-white border border-[#2e2e38] disabled:opacity-30 transition-colors"
              title="Download HTML"
            >
              <Download size={14} />
            </button>
            <button
              onClick={handleOpenNewTab}
              disabled={!htmlCode}
              className="p-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-[#d4d4d8] hover:text-white border border-[#2e2e38] disabled:opacity-30 transition-colors"
              title="Open in new window"
            >
              <ExternalLink size={14} />
            </button>
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-[#d4d4d8] hover:text-white border border-[#2e2e38] transition-colors"
              title="Reload sandbox"
            >
              <RotateCcw size={14} />
            </button>
            <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Close preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sandboxed iframe */}
        <div className="flex-1 bg-[#09090b] relative overflow-hidden">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-none bg-white"
            title="Applet Sandbox"
            sandbox="allow-scripts allow-modals allow-forms"
          />
        </div>
      </div>
    </div>
  );
};
