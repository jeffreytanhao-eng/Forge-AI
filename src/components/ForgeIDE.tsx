/**
 * ForgeIDE.tsx - Codex Vibe Coding 集成版
 */

import React, { useState, useEffect } from 'react';
import { 
  Folder, File, Code, Terminal, Play, Check, X, Sparkles, Send, 
  Loader, Shield, Search, GitBranch, Settings 
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Agent, WorkspaceFile, DiffSuggestion } from '../types';
import { MOCK_WORKSPACES } from '../data/mockData';
import { VibeComposer } from './VibeIDE/VibeComposer';

interface ForgeIDEProps {
  agents: Agent[];
  activeAgentId: string;
  onChangeActiveAgent: (id: string) => void;
  workspaceName: 'python_api' | 'ts_utils' | 'forge_platform';
  onChangeWorkspace: (name: 'python_api' | 'ts_utils' | 'forge_platform') => void;
  onUpdateGraph: () => void;
  workspaceFiles: WorkspaceFile[];
  onUpdateFiles: (files: WorkspaceFile[]) => void;
}

export default function ForgeIDE({ 
  agents, 
  activeAgentId, 
  onChangeActiveAgent, 
  workspaceName, 
  onChangeWorkspace, 
  onUpdateGraph, 
  workspaceFiles, 
  onUpdateFiles 
}: ForgeIDEProps) {
  
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [isApplyingDiff, setIsApplyingDiff] = useState(false);

  // 同步工作区文件
  useEffect(() => {
    if (workspaceFiles.length > 0) {
      const primaryFile = workspaceFiles.find(f => 
        f.name.toLowerCase().includes('main') || 
        f.name.toLowerCase().includes('app') || 
        f.name.toLowerCase().includes('index')
      ) || workspaceFiles[0];
      
      setActiveFile(primaryFile);
      setOpenTabs([primaryFile.path]);
    }
  }, [workspaceName, workspaceFiles]);

  // ==================== Vibe Coding 核心闭环 ====================
  const handleApplyDiff = async (diffs: any[]) => {
    if (!diffs || diffs.length === 0) return;

    setIsApplyingDiff(true);

    try {
      let updatedFiles = [...workspaceFiles];

      for (const diff of diffs) {
        const fileIndex = updatedFiles.findIndex(f => f.path === diff.file || f.name === diff.file);
        
        if (fileIndex !== -1) {
          // 应用代码变更
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            content: diff.content
          };

          // 如果当前正在编辑该文件，立即刷新
          if (activeFile?.path === diff.file) {
            setActiveFile(updatedFiles[fileIndex]);
          }
        } else if (diff.file) {
          // 新建文件
          updatedFiles.push({
            path: diff.file,
            name: diff.file.split('/').pop() || 'new-file',
            content: diff.content,
            language: diff.file.endsWith('.ts') || diff.file.endsWith('.tsx') ? 'typescript' : 'python'
          });
        }
      }

      // 更新全局文件状态
      onUpdateFiles(updatedFiles);

      // 触发知识图谱刷新
      setTimeout(() => {
        onUpdateGraph();
      }, 300);

      console.log('✅ Vibe Coding 变更已应用并刷新图谱');
    } catch (error) {
      console.error('Apply diff failed:', error);
    } finally {
      setIsApplyingDiff(false);
    }
  };

  const handleFileClick = (file: WorkspaceFile) => {
    setActiveFile(file);
    if (!openTabs.includes(file.path)) {
      setOpenTabs([...openTabs, file.path]);
    }
  };

  const handleCloseTab = (path: string) => {
    setOpenTabs(openTabs.filter(p => p !== path));
    if (activeFile?.path === path) {
      setActiveFile(openTabs.length > 1 ? 
        workspaceFiles.find(f => f.path === openTabs[0]) || null : null);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    
    const updatedFiles = workspaceFiles.map(file =>
      file.path === activeFile.path ? { ...file, content: value } : file
    );
    onUpdateFiles(updatedFiles);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* 左侧：文件浏览器 + 图谱 */}
      <div className="w-72 border-r border-zinc-800 flex-shrink-0 overflow-auto">
        {/* 保留你原来的左侧文件树代码 */}
        {/* ... 你的原有 sidebar 内容 ... */}
      </div>

      {/* 中央：Monaco 编辑器 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="h-10 border-b border-zinc-800 flex items-center px-3 overflow-x-auto bg-zinc-900">
          {openTabs.map(path => {
            const file = workspaceFiles.find(f => f.path === path);
            return (
              <div 
                key={path}
                className={`group flex items-center px-4 h-full border-r border-zinc-700 cursor-pointer hover:bg-zinc-800 ${activeFile?.path === path ? 'bg-zinc-800' : ''}`}
                onClick={() => handleFileClick(file!)}
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

        {/* Monaco 编辑器 */}
        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="100%"
              language={activeFile.language || "typescript"}
              value={activeFile.content || ''}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: "on"
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              请选择文件开始编辑
            </div>
          )}
        </div>
      </div>

      {/* 右侧：Vibe Coding Agent 面板 */}
      <div className="w-96 border-l border-zinc-800 flex-shrink-0 flex flex-col bg-zinc-950">
        <VibeComposer 
          workspaceFiles={workspaceFiles} 
          onApplyDiff={handleApplyDiff} 
        />
      </div>
    </div>
  );
}