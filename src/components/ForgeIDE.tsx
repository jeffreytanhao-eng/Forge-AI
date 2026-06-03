/**
 * ForgeIDE.tsx - Codex Vibe Coding 集成版 (最新)
 */

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Sparkles } from 'lucide-react';
import { VibeComposer } from './VibeIDE/VibeComposer';
import { WorkspaceFile } from '../types';   // 根据你的 types 调整

interface ForgeIDEProps {
  workspaceName: string;
  workspaceFiles: WorkspaceFile[];
  onUpdateFiles: (files: WorkspaceFile[]) => void;
  onUpdateGraph: () => void;
}

export default function ForgeIDE({
  workspaceName,
  workspaceFiles,
  onUpdateFiles,
  onUpdateGraph
}: ForgeIDEProps) {

  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (workspaceFiles.length > 0) {
      const defaultFile = workspaceFiles[0];
      setActiveFile(defaultFile);
      setOpenTabs([defaultFile.path]);
    }
  }, [workspaceFiles]);

  // ==================== Vibe Coding 闭环核心 ====================
  const handleApplyDiff = async (diffs: any[]) => {
    if (!diffs?.length) return;

    setIsApplying(true);
    let updated = [...workspaceFiles];

    for (const diff of diffs) {
      const index = updated.findIndex(f => f.path === diff.file || f.name === diff.file);
      if (index !== -1) {
        updated[index] = { ...updated[index], content: diff.content };
        if (activeFile?.path === diff.file) setActiveFile(updated[index]);
      } else {
        // 新建文件
        updated.push({
          path: diff.file,
          name: diff.file.split('/').pop() || 'new.ts',
          content: diff.content,
          language: 'typescript'
        });
      }
    }

    onUpdateFiles(updated);
    onUpdateGraph();   // 刷新知识图谱

    setIsApplying(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile) return;
    const updated = workspaceFiles.map(f =>
      f.path === activeFile.path ? { ...f, content: value || '' } : f
    );
    onUpdateFiles(updated);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* 左侧文件树 - 保留你原有代码 */}

      {/* 中央 Monaco */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="h-10 border-b border-zinc-800 flex items-center px-2 overflow-x-auto">
          {openTabs.map(path => {
            const file = workspaceFiles.find(f => f.path === path);
            return (
              <div key={path} className={`px-4 h-full flex items-center border-r border-zinc-700 ${activeFile?.path === path ? 'bg-zinc-900' : ''}`}>
                {file?.name}
                <X className="ml-2 w-4 h-4 cursor-pointer" onClick={() => {/* close tab */}} />
              </div>
            );
          })}
        </div>

        <div className="flex-1">
          {activeFile && (
            <Editor
              height="100%"
              language={activeFile.language || "typescript"}
              value={activeFile.content || ''}
              onChange={handleEditorChange}
              theme="vs-dark"
            />
          )}
        </div>
      </div>

      {/* 右侧 Vibe 面板 */}
      <div className="w-96 border-l border-zinc-800">
        <VibeComposer 
          workspaceFiles={workspaceFiles} 
          onApplyDiff={handleApplyDiff} 
        />
      </div>
    </div>
  );
}