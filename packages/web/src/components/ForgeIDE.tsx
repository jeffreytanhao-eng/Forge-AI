/**
 * ForgeIDE.tsx - Vibe Coding 集成版 (完整功能保留)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  X, Sparkles, Folder, File, ChevronRight, ChevronDown, Check, 
  RotateCcw, Eye, Play, Sliders, Server, Cpu, Database, Info, 
  CheckCircle, FileText, Layout, CheckCircle2, History, Terminal as TerminalIcon,
  MessageSquare, ArrowUpRight, ArrowLeftRight, Wrench, Code2, ChevronLeft
} from 'lucide-react';
import { VibeComposer } from './VibeIDE/VibeComposer';
import { WorkspaceFile, Skill, Agent, VibeDiff, VibeHistoryEntry, CodeKnowledgeGraph } from '../types';
import { generateGraphifyGraph } from '../utils/graphify';

interface ForgeIDEProps {
  agents?: Agent[];
  activeAgentId?: string;
  onChangeActiveAgent?: (id: string) => void;
  workspaceName: string;
  onChangeWorkspace?: (name: string) => void;
  workspaceFiles: WorkspaceFile[];
  onUpdateFiles: (files: WorkspaceFile[]) => void;
  onUpdateGraph: () => void;
  skills?: Skill[];
}

// Visual Node representation inside Hierarchical file tree
interface VisualTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  file?: WorkspaceFile;
  children: { [key: string]: VisualTreeNode };
}

export default function ForgeIDE({
  workspaceName,
  workspaceFiles,
  onUpdateFiles,
  onUpdateGraph,
  skills = []
}: ForgeIDEProps) {

  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [collapsedFolders, setCollapsedFolders] = useState<{ [key: string]: boolean }>({});
  
  // Pending Vibe Coding Diffs for side-by-side Monaco Review
  const [vibePendingDiffs, setVibePendingDiffs] = useState<VibeDiff[]>([]);
  const [reviewingDiffIndex, setReviewingDiffIndex] = useState<number | null>(null);
  
  // Vibe changes history log for Undo mechanism
  const [vibeHistory, setVibeHistory] = useState<VibeHistoryEntry[]>([]);

  const [isApplying, setIsApplying] = useState(false);

  // Skill panel state
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState<'skills' | 'output'>('skills');
  const [skillOutput, setSkillOutput] = useState('');
  const [isExecutingSkill, setIsExecutingSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Generate Knowledge Graph (memoized)
  const knowledgeGraph = useMemo(() => {
    try {
      return generateGraphifyGraph(workspaceFiles);
    } catch (e) {
      console.warn('知识图谱生成失败', e);
      return { nodes: [], edges: [] };
    }
  }, [workspaceFiles]);

  // Initialize workspace files tree defaults
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

  // Click file from explorer tree
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
    } else if (newTabs.length === 0) {
      setActiveFile(null);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    
    const updated = workspaceFiles.map(file =>
      file.path === activeFile.path ? { ...file, content: value } : file
    );
    onUpdateFiles(updated);
  };

  // Build unified folder paths tree recursively
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

  // Renders tree nodes recursively
  const renderTreeElements = (node: VisualTreeNode) => {
    return Object.values(node.children).map(child => {
      const isDir = child.type === 'directory';
      const isCollapsed = collapsedFolders[child.path];
      const hasPendingChange = vibePendingDiffs.some(d => {
        const dPath = d.file.startsWith('/') ? d.file : '/' + d.file;
        return dPath === child.path;
      });

      return (
        <div key={child.path} className="select-none text-zinc-300 font-mono text-xs">
          <div
            onClick={() => {
              if (isDir) {
                setCollapsedFolders(prev => ({ ...prev, [child.path]: !isCollapsed }));
              } else if (child.file) {
                handleFileClick(child.file);
              }
            }}
            className={`group flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
              activeFile?.path === child.path 
                ? 'bg-zinc-850 text-violet-400 font-medium' 
                : 'hover:bg-zinc-900/60 hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {isDir ? (
                <>
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                  <Folder className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">{child.name}</span>
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" />
                  <File className={`w-3.5 h-3.5 shrink-0 ${child.name.endsWith('.py') ? 'text-blue-400' : 'text-emerald-400'}`} />
                  <span className="truncate text-zinc-300 group-hover:text-white">{child.name}</span>
                  {hasPendingChange && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-450 shrink-0 shadow-lg" title="Pending Diff Preview" />
                  )}
                </>
              )}
            </div>
          </div>

          {isDir && !isCollapsed && (
            <div className="pl-3 border-l border-zinc-800 ml-2 mt-0.5 space-y-0.5">
              {renderTreeElements(child)}
            </div>
          )}
        </div>
      );
    });
  };

  const fileTreeRootNode = buildHierarchicalTree(workspaceFiles);

  // ==================== Vibe Coding 流程闭环 2.0 ====================
  const handleApplyDiff = (diffs: VibeDiff[]) => {
    if (!diffs || diffs.length === 0) return;
    setVibePendingDiffs(diffs);
    setReviewingDiffIndex(0); // Trigger side-by-side diff review automatically
  };

  // Rollback function matching specified transaction id
  const handleUndoSession = (historyId: string) => {
    const tx = vibeHistory.find(h => h.id === historyId);
    if (!tx) return;

    let updatedFiles = [...workspaceFiles];
    tx.diffs.forEach(diff => {
      const normPath = diff.file.startsWith('/') ? diff.file : '/' + diff.file;
      const fidx = updatedFiles.findIndex(f => f.path === normPath);
      if (fidx >= 0) {
        updatedFiles[fidx] = {
          ...updatedFiles[fidx],
          content: diff.previousContent
        };
        // Reset hotspot tagging for graph highlights
        localStorage.removeItem('vibe_modified_path_' + normPath);
      }
    });

    onUpdateFiles(updatedFiles);
    
    // Update active editor state to show safe rollbacked baseline
    if (activeFile) {
      const undone = updatedFiles.find(f => f.path === activeFile.path);
      if (undone) setActiveFile(undone);
    }

    setVibeHistory(prev => prev.filter(h => h.id !== historyId));
    onUpdateGraph();
    
    // Add toast visual hint
    const undoneFiles = tx.diffs.map(d => d.file.split('/').pop()).join(', ');
    console.log(`Successfully undone vibe refactoring of files: [${undoneFiles}]`);
  };

  // Undo the very last transaction
  const handleUndoLastApplied = () => {
    if (vibeHistory.length > 0) {
      handleUndoSession(vibeHistory[0].id);
    }
  };

  // Single file diff acceptance
  const handleAcceptSingleFile = (index: number) => {
    const diff = vibePendingDiffs[index];
    const normPath = diff.file.startsWith('/') ? diff.file : '/' + diff.file;
    const existingFile = workspaceFiles.find(f => f.path === normPath);
    const previousContent = existingFile?.content || '';

    let updated = [...workspaceFiles];
    const idx = updated.findIndex(f => f.path === normPath);
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], content: diff.content };
    } else {
      updated.push({
        path: normPath,
        name: diff.file.split('/').pop() || 'new-file.ts',
        type: 'file',
        content: diff.content
      });
    }

    onUpdateFiles(updated);

    // Save transaction inside history state
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 100),
      timestamp: new Date().toLocaleTimeString(),
      description: diff.description || 'Refactored coordinates via Vibe Agent',
      diffs: [{ file: diff.file, previousContent, content: diff.content }]
    };
    setVibeHistory(prev => [newTx, ...prev].slice(0, 5));

    // Tag file path in LocalStorage for knowledge graph highlighter linkage
    localStorage.setItem('vibe_modified_path_' + normPath, 'true');

    // Proceed to next diff or finish
    const nextIdx = index + 1;
    if (nextIdx < vibePendingDiffs.length) {
      setReviewingDiffIndex(nextIdx);
    } else {
      setVibePendingDiffs([]);
      setReviewingDiffIndex(null);
      onUpdateGraph();
    }

    if (activeFile?.path === normPath) {
      const updatedMatch = updated.find(f => f.path === normPath);
      if (updatedMatch) setActiveFile(updatedMatch);
    }
  };

  const handleRejectSingleFile = (index: number) => {
    const nextIdx = index + 1;
    if (nextIdx < vibePendingDiffs.length) {
      setReviewingDiffIndex(nextIdx);
    } else {
      setVibePendingDiffs([]);
      setReviewingDiffIndex(null);
    }
  };

  const handleAcceptAllPending = () => {
    let updated = [...workspaceFiles];
    const localDiffsHistory: Array<{ file: string; previousContent: string; content: string }> = [];

    vibePendingDiffs.forEach(diff => {
      const normPath = diff.file.startsWith('/') ? diff.file : '/' + diff.file;
      const existingFile = workspaceFiles.find(f => f.path === normPath);
      const previousContent = existingFile?.content || '';

      localDiffsHistory.push({ file: diff.file, previousContent, content: diff.content });

      const idx = updated.findIndex(f => f.path === normPath);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], content: diff.content };
      } else {
        updated.push({
          path: normPath,
          name: diff.file.split('/').pop() || 'new-file.ts',
          type: 'file',
          content: diff.content
        });
      }

      localStorage.setItem('vibe_modified_path_' + normPath, 'true');
    });

    onUpdateFiles(updated);

    // Save batch transaction
    const newTxItem = {
      id: 'tx_batch_' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      description: `Refactored ${vibePendingDiffs.length} files successfully`,
      diffs: localDiffsHistory
    };
    setVibeHistory(prev => [newTxItem, ...prev].slice(0, 5));

    if (activeFile) {
      const matchedFile = updated.find(f => f.path === activeFile.path);
      if (matchedFile) setActiveFile(matchedFile);
    }

    setVibePendingDiffs([]);
    setReviewingDiffIndex(null);
    onUpdateGraph();
  };

  const handleDiscardAllPending = () => {
    setVibePendingDiffs([]);
    setReviewingDiffIndex(null);
  };

  // Execute skill function
  const handleExecuteSkill = async (skill: Skill) => {
    setSelectedSkill(skill);
    setActiveSkillTab('output');
    setSkillOutput(`Executing "${skill.name}"...\n\n`);
    setIsExecutingSkill(true);

    try {
      const response = await fetch('/api/skill/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id, skill }),
      });

      const result = await response.json();
      setSkillOutput(prev => prev + result.output);
    } catch (err) {
      setSkillOutput(prev => prev + `Error: ${err}`);
    } finally {
      setIsExecutingSkill(false);
    }
  };

  // Get current file code properties for Monaco Diff Reviewer
  const getDiffEditorProps = () => {
    if (reviewingDiffIndex === null || reviewingDiffIndex >= vibePendingDiffs.length) {
      return { original: '', modified: '', fileLabel: '', language: 'typescript' };
    }
    const diff = vibePendingDiffs[reviewingDiffIndex];
    const normPath = diff.file.startsWith('/') ? diff.file : '/' + diff.file;
    const fileObj = workspaceFiles.find(f => f.path === normPath);
    
    const ext = diff.file.split('.').pop() || 'ts';
    const language = (ext === 'py') ? 'python' : 'typescript';

    return {
      original: fileObj?.content || '',
      modified: diff.content || '',
      fileLabel: diff.file,
      language
    };
  };

  const diffProps = getDiffEditorProps();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      
      {/* 左侧：文件浏览器 + 实时图谱导览 */}
      <div className="w-72 border-r border-zinc-850 flex-shrink-0 flex flex-col bg-zinc-900/40 divide-y divide-zinc-850">
        
        {/* Workspace header */}
        <div className="p-4 flex items-center justify-between select-none shrink-0 bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-violet-400" />
            <span className="text-xs uppercase font-mono tracking-wider font-semibold text-zinc-350">
              Workspace Folder
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-450 border border-zinc-705">
            {workspaceName}
          </span>
        </div>

        {/* Dynamic Files hierarchy Explorer */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 select-none">
          {renderTreeElements(fileTreeRootNode)}
        </div>

        {/* Small live telemetries summary footer */}
        <div className="p-3 bg-zinc-950/50 backdrop-blur font-mono text-[10px] text-zinc-550 space-y-1.5 select-none shrink-0 border-t border-zinc-850">
          <div className="flex justify-between">
            <span>AST Indexes:</span>
            <span className="text-violet-400 font-bold uppercase">Synthesized</span>
          </div>
          <div className="flex justify-between">
            <span>Vibe Node:</span>
            <span className="text-emerald-400 font-bold uppercase">Ready</span>
          </div>
        </div>
      </div>

      {/* 中央: Monaco Editor / Side-by-Side Reviewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 divide-y divide-zinc-870 relative">
        
        {/* Diff Review Panel Header (if in diff review mode) */}
        {reviewingDiffIndex !== null ? (
          <div className="bg-zinc-900/90 border-b border-violet-950/40 p-3 flex flex-col gap-2 shadow-xl shrink-0 z-20 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="animate-pulse w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-xs font-mono font-bold text-violet-300">
                  DIFF REVIEW MODE: File {reviewingDiffIndex + 1} of {vibePendingDiffs.length}
                </span>
                <span className="text-[10px] bg-zinc-800 hover:bg-zinc-705 text-zinc-300 px-2 py-0.5 rounded font-mono">
                  {vibePendingDiffs[reviewingDiffIndex].file}
                </span>
              </div>
              <div className="flex gap-2.5 select-none">
                <button
                  onClick={handleDiscardAllPending}
                  className="px-3 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-450 text-xs rounded transition-all cursor-pointer font-sans"
                >
                  Discard All
                </button>
                <button
                  onClick={handleAcceptAllPending}
                  className="px-3.5 py-1 bg-violet-650 hover:bg-violet-600 text-white text-xs font-bold rounded transition-all shadow-md cursor-pointer font-sans"
                >
                  Apply All Changes
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 select-none">
              <span className="text-[11px] text-zinc-350 leading-relaxed max-w-lg truncate block font-mono italic">
                💡 {vibePendingDiffs[reviewingDiffIndex].description || 'AI Code Optimization'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRejectSingleFile(reviewingDiffIndex)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-950/40 hover:border-red-500/20 text-[11px] rounded transition-all cursor-pointer"
                >
                  Exclude File
                </button>
                <button
                  onClick={() => handleAcceptSingleFile(reviewingDiffIndex)}
                  className="px-3 py-1 bg-emerald-650 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded shadow-md transition-all cursor-pointer"
                >
                  Accept File
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Editor Tabs selection bar */
          <div className="h-10 border-b border-zinc-850 flex items-center px-1.5 overflow-x-auto bg-zinc-900/50 shrink-0">
            {openTabs.map(path => {
              const file = workspaceFiles.find(f => f.path === path);
              const isDirty = localStorage.getItem('vibe_modified_path_' + path) === 'true';
              return (
                <div 
                  key={path}
                  onClick={() => file && handleFileClick(file)}
                  className={`group flex items-center px-3.5 h-full border-r border-zinc-850 cursor-pointer text-xs font-mono select-none transition-all ${
                    activeFile?.path === path 
                      ? 'bg-zinc-950 text-violet-400 font-semibold' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  {isDirty && <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-1.5 shrink-0 animate-pulse" />}
                  <span>{file?.name}</span>
                  <X 
                    className="ml-3.5 w-3.5 h-3.5 opacity-40 hover:opacity-100 hover:bg-zinc-800 rounded p-0.5 text-zinc-300 shrink-0 select-none" 
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(path); }} 
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Monaco workspace body */}
        <div className="flex-1 min-h-0 bg-zinc-950">
          {reviewingDiffIndex !== null ? (
            <DiffEditor
              original={diffProps.original}
              modified={diffProps.modified}
              language={diffProps.language}
              height="100%"
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                readOnly: true,
                renderSideBySide: true,
                fontSize: 13.5,
                lineNumbers: 'on',
                folding: true,
                diffWordWrap: 'on'
              }}
            />
          ) : (
            activeFile ? (
              <Editor
                height="100%"
                language={"typescript"}
                value={activeFile.content || ''}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: "on",
                  lineNumbers: "on",
                  folding: true,
                  automaticLayout: true
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-550 font-mono text-center select-none space-y-4">
                <Layout className="w-10 h-10 text-zinc-700 animate-pulse" />
                <div className="max-w-xs space-y-1">
                  <header className="font-semibold text-zinc-400 text-xs uppercase tracking-wider">Empty Workspace</header>
                  <p className="text-[10.5px] leading-relaxed">Select code files in the explorer tree on the left, or send vibe coding prompts on the right side to generate components.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* 右侧：Vibe Coding Agent Tabbed Interface */}
      <div className="w-96 border-l border-zinc-850 flex-shrink-0 flex flex-col bg-zinc-950 divide-y divide-zinc-870">
        <VibeComposer 
          workspaceFiles={workspaceFiles} 
          onApplyDiff={handleApplyDiff}
          vibeHistory={vibeHistory}
          onUndoSession={handleUndoSession}
          onUndoLast={handleUndoLastApplied}
          currentFile={activeFile}
          knowledgeGraph={knowledgeGraph}
          skills={skills}
        />
      </div>

      {/* Skill Panel (Collapsible) */}
      <div className={`flex flex-col bg-zinc-950 border-l border-zinc-850 transition-all duration-300 ${
        showSkillPanel ? 'w-80' : 'w-10'
      }`}>
        {/* Toggle button */}
        <button
          onClick={() => setShowSkillPanel(!showSkillPanel)}
          className="h-10 flex items-center justify-center border-b border-zinc-850 hover:bg-zinc-900 transition-colors"
        >
          <Wrench className={`w-5 h-5 text-violet-400 transition-transform ${showSkillPanel ? 'rotate-180' : ''}`} />
        </button>

        {showSkillPanel && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab header */}
            <div className="flex border-b border-zinc-850">
              <button
                onClick={() => setActiveSkillTab('skills')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  activeSkillTab === 'skills' ? 'bg-zinc-900 text-violet-400 border-b-2 border-violet-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-4 h-4" />
                Skills
              </button>
              <button
                onClick={() => setActiveSkillTab('output')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  activeSkillTab === 'output' ? 'bg-zinc-900 text-violet-400 border-b-2 border-violet-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <TerminalIcon className="w-4 h-4" />
                Output
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeSkillTab === 'skills' ? (
                <div className="space-y-2">
                  {skills.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No skills available</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Add skills in Skill Hub</p>
                    </div>
                  ) : (
                    skills.filter(s => s.enabled).map(skill => (
                      <div
                        key={skill.id}
                        className="p-3 rounded-lg border border-zinc-850 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{skill.icon}</span>
                            <div>
                              <h4 className="text-xs font-semibold text-zinc-200">{skill.name}</h4>
                              <p className="text-[10px] text-zinc-500 line-clamp-2">{skill.description}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecuteSkill(skill)}
                          disabled={isExecutingSkill}
                          className="mt-2 w-full py-1.5 bg-violet-650 hover:bg-violet-600 disabled:opacity-50 text-white text-[10px] font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          {isExecutingSkill ? 'Running...' : 'Execute'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Skill Output</span>
                    {selectedSkill && (
                      <span className="text-violet-400">{selectedSkill.name}</span>
                    )}
                  </div>
                  <div className="bg-zinc-900 rounded-lg border border-zinc-850 p-3 h-48 overflow-auto">
                    <pre className="text-[10px] font-mono text-zinc-400 whitespace-pre-wrap">
                      {skillOutput || 'Execute a skill to see output...'}
                    </pre>
                  </div>
                  {!isExecutingSkill && skillOutput && (
                    <button
                      onClick={() => setSkillOutput('')}
                      className="w-full py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-[10px] rounded transition-colors"
                    >
                      Clear Output
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
