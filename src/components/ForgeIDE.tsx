/**
 * ForgeIDE.tsx - Codex Vibe Coding 集成版 (最新完整版)
 */

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Sparkles } from 'lucide-react';
import { VibeComposer } from './VibeIDE/VibeComposer';
import { WorkspaceFile } from '../types';

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

  // 初始化默认打开文件
  useEffect(() => {
    if (workspaceFiles.length > 0) {
      const defaultFile = workspaceFiles.find(f => 
        f.name.toLowerCase().includes('main') || 
        f.name.toLowerCase().includes('app') || 
        f.name.toLowerCase().includes('index')
      ) || workspaceFiles[0];
      
      setActiveFile(defaultFile);
      setOpenTabs([defaultFile.path]);
    }
  }, [workspaceFiles, workspaceName]);

  // ==================== Vibe Coding 核心闭环 ====================
  const handleApplyDiff = async (diffs: any[]) => {
    if (!diffs?.length) return;

    setIsApplying(true);
    let updatedFiles = [...workspaceFiles];

    for (const diff of diffs) {
      const index = updatedFiles.findIndex(f => 
        f.path === diff.file || f.name === diff.file
      );

      if (index !== -1) {
        // 更新已有文件
        updatedFiles[index] = { 
          ...updatedFiles[index], 
          content: diff.content 
        };

        if (activeFile?.path === diff.file) {
          setActiveFile(updatedFiles[index]);
        }
      } else {
        // 新建文件
        updatedFiles.push({
          path: diff.file,
          name: diff.file.split('/').pop() || 'new-file',
          content: diff.content,
          language: diff.file.endsWith('.py') ? 'python' : 'typescript'
        });
      }
    }

    // 更新父组件状态
    onUpdateFiles(updatedFiles);
    
    // 刷新知识图谱
    setTimeout(() => {
      onUpdateGraph();
    }, 500);

    setIsApplying(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    
    const updated = workspaceFiles.map(file =>
      file.path === activeFile.path ? { ...file, content: value } : file
    );
    onUpdateFiles(updated);
  };

  const handleFileClick = (file: WorkspaceFile) => {
    setActiveFile(file);
    if (!openTabs.includes(file.path)) {
      setOpenTabs([...openTabs, file.path]);
    }
  };

  const handleCloseTab = (path: string) => {
    const newTabs = openTabs.filter(p => p !== path);
    setOpenTabs(newTabs);
    if (activeFile?.path === path && newTabs.length > 0) {
      const nextFile = workspaceFiles.find(f => f.path === newTabs[0]);
      setActiveFile(nextFile || null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* 左侧文件树 - 请保留您原来的左侧代码 */}
      <div className="w-72 border-r border-zinc-800 overflow-auto">
        {/* ... 您的原有文件树代码 ... */}
      </div>

      {/* 中央 Monaco 编辑器 */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <div className="h-10 border-b border-zinc-800 flex items-center px-2 overflow-x-auto bg-zinc-900">
          {openTabs.map(path => {
            const file = workspaceFiles.find(f => f.path === path);
            return (
              <div
                key={path}
                className={`group flex items-center px-4 h-full border-r border-zinc-700 cursor-pointer hover:bg-zinc-800 ${activeFile?.path === path ? 'bg-zinc-800' : ''}`}
                onClick={() => file && handleFileClick(file)}
              >
                {file?.name}
                <X 
                  className="ml-3 w-4 h-4 opacity-60 hover:opacity-100" 
                  onClick={(e) => { e.stopPropagation(); handleCloseTab(path); }} 
                />
              </div>
            );
          })}
        </div>

        {/* 编辑器主体 */}
        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="100%"
              language={activeFile.language || "typescript"}
              value={activeFile.content || ''}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{ minimap: { enabled: true }, fontSize: 14 }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              请选择一个文件开始 Vibe Coding
            </div>
          )}
        </div>
      </div>

      {/* 右侧 Vibe Coding 面板 */}
      <div className="w-96 border-l border-zinc-800 flex-shrink-0 flex flex-col">
        <div className="p-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="font-medium">Codex Vibe Agent</span>
          {isApplying && <span className="text-xs text-violet-400 ml-auto">Applying changes...</span>}
        </div>
        <VibeComposer 
          workspaceFiles={workspaceFiles} 
          onApplyDiff={handleApplyDiff} 
        />
      </div>
    </div>
  );
}