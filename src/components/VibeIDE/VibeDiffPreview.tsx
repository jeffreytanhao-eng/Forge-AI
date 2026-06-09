import React from 'react';
import { Check, X, CheckCheck, XCircle } from 'lucide-react';

interface DiffItem {
  file: string;
  content: string;
  description?: string;
}

interface VibeDiffPreviewProps {
  diffs: DiffItem[];
  onAccept: (diff: DiffItem) => void;
  onReject: (diff: DiffItem) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose?: () => void;
}

export const VibeDiffPreview: React.FC<VibeDiffPreviewProps> = ({
  diffs,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onClose,
}) => {
  if (!diffs || diffs.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-medium">变更预览</span>
          <span className="ml-2 text-xs text-zinc-400">共 {diffs.length} 个文件</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAcceptAll}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 rounded"
          >
            <CheckCheck className="w-3.5 h-3.5" /> 全部接受
          </button>
          <button
            onClick={onRejectAll}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
          >
            <XCircle className="w-3.5 h-3.5" /> 全部拒绝
          </button>
          {onClose && (
            <button onClick={onClose} className="text-xs px-2 text-zinc-400 hover:text-white">
              关闭
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
        {diffs.map((diff, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="font-mono text-violet-400 truncate">{diff.file}</div>
              {diff.description && (
                <div className="text-xs text-zinc-500 mt-0.5">{diff.description}</div>
              )}
            </div>

            <div className="flex gap-1 ml-3 flex-shrink-0">
              <button
                onClick={() => onAccept(diff)}
                className="p-1.5 hover:bg-emerald-900/30 rounded text-emerald-400"
                title="接受此文件"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReject(diff)}
                className="p-1.5 hover:bg-red-900/30 rounded text-red-400"
                title="拒绝此文件"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
