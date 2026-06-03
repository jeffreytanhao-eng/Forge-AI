/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Folder, File, Code, Terminal, Play, Check, X, Sparkles, Send, Box, 
  ChevronRight, ChevronDown, CheckSquare, RefreshCw, RefreshCcw, Loader, 
  Shield, Search, GitBranch, Settings, Plus, Trash, Edit3, Save, 
  PlayCircle, Eye, Sliders, Server, Cpu, Database, Info, FileText, CheckCircle
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Agent, WorkspaceFile, SessionMessage, DiffSuggestion, CodeKnowledgeGraph } from '../types';
import { MOCK_WORKSPACES } from '../data/mockData';
import VibeArchitectureViewer from './VibeArchitectureViewer';
import { VibeComposer } from './VibeIDE/VibeComposer';   // ← 新增导入

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

interface FileBaseline {
  [path: string]: string;
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
  
  // VS Code left side utility bar state
  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'search' | 'git' | 'settings'>('explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active open file states
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  
  // Baseline loaded snapshot to calculate dirty/modified Git files
  const [baselineFiles, setBaselineFiles] = useState<FileBaseline>({});
  const [commitHistory, setCommitHistory] = useState<Array<{ sha: string; message: string; date: string }>>([
    { sha: '8c9fb23', message: 'chore: initial workspace commit', date: 'Just now' }
  ]);
  const [commitMessage, setCommitMessage] = useState('');

  // Search input and result arrays
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom dialog / modals for interactive file operations
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'directory'>('file');

  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [renameTargetName, setRenameTargetName] = useState('');

  // Terminal compilation and testing console log outputs
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'ci_cd' | 'playground'>('playground');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM] Booting IDE compiler node...',
    '[SRE] Terminal ready. Execute compiler tests or launch code sandbox below.'
  ]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Vibe Composer thinking elements
  const [composerMessages, setComposerMessages] = useState<SessionMessage[]>([]);
  const [composerInput, setComposerInput] = useState('');
  const [isComposerThinking, setIsComposerThinking] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DiffSuggestion | null>(null);

  // Collapsed folder metadata
  const [collapsedFolders, setCollapsedFolders] = useState<{ [key: string]: boolean }>({});

  // ---------------- TS / PYTHON PLAYGROUND STATES (保持原有) ----------------
  const [tsTestInput, setTsTestInput] = useState('{"name":"john_doe", "status_level":"active_admin", "user_city":"San Francisco"}');
  const [tsExecutionOutput, setTsExecutionOutput] = useState('');
  const [isEvaluatingTs, setIsEvaluatingTs] = useState(false);

  const [apiConsoleLogs, setApiConsoleLogs] = useState<string[]>(['REST client API simulator inactive. Click "Run Server Playground" to spin up uvicorn.']);
  const [isPythonServerRunning, setIsPythonServerRunning] = useState(false);
  const [dbItems, setDbItems] = useState([
    { name: 'Relational SqlAlchemy Module', description: 'Core SQL mapping configuration', price: 49.99, is_available: true },
    { name: 'Pytest CI Runner', description: 'Continuous integration regression suites', price: 19.50, is_available: true }
  ]);
  const [apiPostName, setApiPostName] = useState('GraphQL Adapter');
  const [apiPostDesc, setApiPostDesc] = useState('Resolves flexible dynamic endpoints');
  const [apiPostPrice, setApiPostPrice] = useState('35.00');

  // Sync workspace and auto-initialize baseline file metrics
  useEffect(() => {
    if (workspaceFiles && workspaceFiles.length > 0) {
      const initialBaseline: FileBaseline = {};
      workspaceFiles.forEach(f => {
        initialBaseline[f.path] = f.content || '';
      });
      setBaselineFiles(initialBaseline);

      const primaryIndex = workspaceFiles.findIndex(f => 
        f.name.toLowerCase().includes('main') || 
        f.name.toLowerCase().includes('index') || 
        f.name.toLowerCase().includes('app')
      );
      const defaultToOpen = primaryIndex >= 0 ? workspaceFiles[primaryIndex] : workspaceFiles[0];
      
      setActiveFile(defaultToOpen);
      setOpenTabs([defaultToOpen.path]);
    }

    setComposerMessages([
      {
        id: 'greet_init',
        role: 'system',
        content: `Agentic Workspace: Loaded project [${workspaceName.toUpperCase()}]. Submit vibe programming commands...`,
        timestamp: new Date().toTimeString().split(' ')[0]
      }
    ]);

    setActiveDiff(null);
    setIsPythonServerRunning(false);
  }, [workspaceName]);

  // Click file from tree
  const handleFileClick = (file: WorkspaceFile) => {
    if (file.type === 'directory') {
      setCollapsedFolders(prev => ({ ...prev, [file.path]: !prev[file.path] }));
      return;
    }
    setActiveFile(file);
    if (!openTabs.includes(file.path)) {
      setOpenTabs(prev => [...prev, file.path]);
    }
  };

  // Close tab
  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTabs = openTabs.filter(t => t !== path);
    setOpenTabs(updatedTabs);
    
    if (activeFile?.path === path) {
      if (updatedTabs.length > 0) {
        const correspondingFile = workspaceFiles.find(f => f.path === updatedTabs[0]);
        if (correspondingFile) setActiveFile(correspondingFile);
      } else {
        setActiveFile(null);
      }
    }
  };

  // Safe callback updates
  const handleEditorChange = (newVal: string) => {
    if (!activeFile) return;
    
    const updatedFiles = workspaceFiles.map(f => {
      if (f.path === activeFile.path) {
        return { ...f, content: newVal };
      }
      return f;
    });
    onUpdateFiles(updatedFiles);
    setActiveFile(prev => prev ? { ...prev, content: newVal } : null);
  };

  // Check if file is dirty or modified
  const isFileModified = (path: string): boolean => {
    const currentContent = workspaceFiles.find(f => f.path === path)?.content || '';
    const baseline = baselineFiles[path] || '';
    return currentContent !== baseline;
  };

  interface VisualTreeNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    file?: WorkspaceFile;
    children: { [key: string]: VisualTreeNode };
  }

  // Track and build unified, clean folder paths tree recursively
  const buildHierarchicalTree = (files: WorkspaceFile[]): VisualTreeNode => {
    const root: VisualTreeNode = { name: 'root', path: '', type: 'directory', children: {} };
    
    files.forEach(f => {
      const parts = f.path.split('/').filter(Boolean);
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLastPathSegment = i === parts.length - 1;
        const currentPath = '/' + parts.slice(0, i + 1).join('/');
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: currentPath,
            type: (isLastPathSegment && f.type === 'file') ? 'file' : 'directory',
            file: (isLastPathSegment && f.type === 'file') ? f : undefined,
            children: {}
          };
        }
        current = current.children[part];
      }
    });
    
    return root;
  };

  const recursiveTreeElements = (node: VisualTreeNode) => {
    return Object.values(node.children).map(child => {
      const isDir = child.type === 'directory';
      const isCollapsed = collapsedFolders[child.path];
      const isDirty = child.file ? isFileModified(child.file.path) : false;

      return (
        <div key={child.path} className="select-none text-zinc-350">
          <div
            onClick={() => {
              if (isDir) {
                setCollapsedFolders(prev => ({ ...prev, [child.path]: !isCollapsed }));
              } else if (child.file) {
                handleFileClick(child.file);
              }
            }}
            className={`group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-all ${
              activeFile?.path === child.path 
                ? 'bg-zinc-800 text-violet-400 font-medium' 
                : 'hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {isDir ? (
                <>
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                  <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                  <span className="truncate">{child.name}</span>
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" />
                  <File className={`w-3.5 h-3.5 shrink-0 ${child.name.endsWith('.py') ? 'text-blue-400' : 'text-emerald-400'}`} />
                  <span className="truncate text-zinc-300 group-hover:text-white">{child.name}</span>
                  {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-sm" title="Modified" />}
                </>
              )}
            </div>
          </div>

          {isDir && !isCollapsed && (
            <div className="pl-3 border-l border-zinc-800 ml-2 mt-0.5 space-y-0.5">
              {recursiveTreeElements(child)}
            </div>
          )}
        </div>
      );
    });
  };

  const fileTreeRootNode = buildHierarchicalTree(workspaceFiles);

  // 主渲染 - 已改为 Codex 风格三栏布局
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* 左侧：文件浏览器 + 图谱 */}
      <div className="w-72 border-r border-zinc-800 flex-shrink-0 overflow-auto p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-mono tracking-wider font-semibold text-zinc-400">Workspace Files</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 font-mono">
          {recursiveTreeElements(fileTreeRootNode)}
        </div>
      </div>

      {/* 中央：Monaco 编辑器 + Tabs */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="h-10 border-b border-zinc-800 flex items-center px-2 overflow-x-auto">
          {openTabs.map(path => {
            const file = workspaceFiles.find(f => f.path === path);
            return (
              <div key={path} className={`flex items-center px-4 h-full border-r border-zinc-800 cursor-pointer hover:bg-zinc-900 ${activeFile?.path === path ? 'bg-zinc-900' : ''}`}>
                {file?.name}
                <X className="ml-2 w-4 h-4" onClick={(e) => handleCloseTab(path, e)} />
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
              onChange={(value) => handleEditorChange(value || '')}
              theme="vs-dark"
              options={{ minimap: { enabled: true }, fontSize: 14 }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              请选择或新建一个文件
            </div>
          )}
        </div>
      </div>

      {/* 右侧：Codex 风格 Vibe Coding 面板 */}
      <div className="w-96 border-l border-zinc-800 flex-shrink-0 flex flex-col bg-zinc-950">
        <div className="p-3 border-b border-zinc-800 font-medium flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          Codex Vibe Agent
        </div>
        
        <VibeComposer workspaceFiles={workspaceFiles} />
      </div>
    </div>
  );
}