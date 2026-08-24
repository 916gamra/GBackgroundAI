import React, { useRef, useEffect } from 'react';
import { ExternalLink, RotateCcw, X, Download, Code2 } from 'lucide-react';

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
                .icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; }
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
    <aside className="w-full lg:w-[48%] xl:w-[50%] h-[calc(100dvh-54px-114px)] fixed top-[54px] right-0 bottom-[114px] z-30 bg-[#0c0c0e] border-l border-[#27272a] flex flex-col shadow-2xl transition-all duration-300">
      {/* Header bar */}
      <div className="h-10 bg-[#121215] border-b border-[#27272a] px-3.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-semibold">
          <Code2 size={15} />
          <span>Live App Sandbox</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            disabled={!htmlCode}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Download HTML"
          >
            <Download size={15} />
          </button>
          <button
            onClick={handleOpenNewTab}
            disabled={!htmlCode}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Open in new window"
          >
            <ExternalLink size={15} />
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            title="Reload sandbox"
          >
            <RotateCcw size={15} />
          </button>
          <div className="w-[1px] h-3.5 bg-[#27272a] mx-1" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Close preview"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Sandboxed iframe */}
      <div className="flex-1 bg-[#18181b] relative overflow-hidden">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none bg-white"
          title="Applet Sandbox"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        />
      </div>
    </aside>
  );
};
