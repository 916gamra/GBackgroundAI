import React, { useRef } from 'react';
import { FolderOpen, X, UploadCloud, Trash2, FileText, Download } from 'lucide-react';
import { ProjectFile } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectFiles: ProjectFile[];
  onAddFiles: (files: FileList) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
  onExportProject?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectFiles,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onExportProject
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const totalBytes = projectFiles.reduce((acc, f) => acc + f.size, 0);
  const formattedSize =
    totalBytes < 1024
      ? `${totalBytes} B`
      : totalBytes < 1048576
      ? `${(totalBytes / 1024).toFixed(1)} KB`
      : `${(totalBytes / 1048576).toFixed(2)} MB`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#121215] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] animate-slideUp sm:animate-fadeIn">
        {/* Mobile handle */}
        <div className="w-12 h-1 rounded-full bg-[#3f3f46] mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <FolderOpen size={18} className="text-amber-400" />
            <span>Project File Context</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <p className="text-xs text-[#a1a1aa] mb-3 leading-relaxed">
          Upload codebase files (HTML, CSS, JS, Python, JSON, SQL, etc.). The AI receives their content in its system context to write exact compatible code.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#3f3f46] hover:border-amber-400/60 rounded-2xl p-6 text-center cursor-pointer bg-[#16161a] hover:bg-[#1a1a20] transition-all mb-4 flex flex-col items-center justify-center gap-2"
        >
          <UploadCloud size={28} className="text-[#71717a]" />
          <div className="text-xs font-semibold text-white">Drop project files here or click to browse</div>
          <div className="text-[10px] text-[#71717a]">Accepts .js, .ts, .py, .html, .css, .json, .md, .sql, .yaml</div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".html,.css,.js,.ts,.py,.json,.md,.txt,.jsx,.tsx,.vue,.php,.java,.cpp,.c,.rs,.go,.sql,.yaml,.xml"
            onChange={e => e.target.files && onAddFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-56">
          {projectFiles.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#71717a]">No project files uploaded yet.</div>
          ) : (
            projectFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs font-mono text-[#e4e4e7]"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[#71717a] text-[10px]">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="hover:text-rose-400 p-1"
                    title="Remove file"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#27272a] text-xs font-mono text-[#a1a1aa]">
          <span>
            {projectFiles.length} file{projectFiles.length !== 1 ? 's' : ''} • {formattedSize}
          </span>
          {projectFiles.length > 0 && (
            <div className="flex items-center gap-3">
              {onExportProject && (
                <button
                  onClick={onExportProject}
                  className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Download size={12} />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={onClearFiles}
                className="text-rose-400 hover:underline flex items-center gap-1 cursor-pointer text-xs"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
