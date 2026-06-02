/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Folder, File, Code, Terminal, Play, Check, X, Sparkles, Send, Box, ChevronRight, ChevronDown, CheckSquare, RefreshCw, RefreshCcw, Loader, Shield } from 'lucide-react';
import { Agent, WorkspaceFile, SessionMessage, DiffSuggestion, CodeKnowledgeGraph } from '../types';
import { MOCK_WORKSPACES } from '../data/mockData';

interface ForgeIDEProps {
  agents: Agent[];
  activeAgentId: string;
  onChangeActiveAgent: (id: string) => void;
  workspaceName: 'python_api' | 'ts_utils';
  onChangeWorkspace: (name: 'python_api' | 'ts_utils') => void;
  onUpdateGraph: () => void;
}

export default function ForgeIDE({ agents, activeAgentId, onChangeActiveAgent, workspaceName, onChangeWorkspace, onUpdateGraph }: ForgeIDEProps) {
  // Loaded Workspace Files
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  
  // Terminal commands and output states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'ForgeIDE integrated SRE terminal ready.',
    'Execute compiler or trigger unit tests.'
  ]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Vibe Coding / Composer Sidebar states
  const [composerMessages, setComposerMessages] = useState<SessionMessage[]>([]);
  const [composerInput, setComposerInput] = useState('');
  const [isComposerThinking, setIsComposerThinking] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DiffSuggestion | null>(null);

  // Folders collapsed metadata toggles
  const [collapsedFolders, setCollapsedFolders] = useState<{ [key: string]: boolean }>({});

  // Sync workspace on change
  useEffect(() => {
    const rawFiles = MOCK_WORKSPACES[workspaceName];
    setWorkspaceFiles(rawFiles);
    
    // Auto-open primary entry files
    if (rawFiles && rawFiles.length > 0) {
      const primaryIndex = rawFiles.findIndex(f => f.name.includes('main') || f.name.includes('index'));
      const defaultToOpen = primaryIndex >= 0 ? rawFiles[primaryIndex] : rawFiles[0];
      
      setActiveFile(defaultToOpen);
      setOpenTabs([defaultToOpen.path]);
    }

    // Load initial greeting matching the chosen project
    setComposerMessages([
      {
        id: 'initial_greet',
        role: 'system',
        content: `Workspace loaded: ${workspaceName === 'python_api' ? 'Python REST FastAPI' : 'TypeScript Utilities Library'}. Select an executive agent to query instructions or submit 'vibe coding' directives.`,
        timestamp: new Date().toTimeString().split(' ')[0]
      }
    ]);
    setActiveDiff(null);
  }, [workspaceName]);

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

  const handleEditorChange = (newVal: string) => {
    if (!activeFile) return;
    
    // Save updated local state values
    const updatedFiles = workspaceFiles.map(f => {
      if (f.path === activeFile.path) {
        return { ...f, content: newVal };
      }
      return f;
    });
    setWorkspaceFiles(updatedFiles);
    setActiveFile(prev => prev ? { ...prev, content: newVal } : null);
  };

  // Run Project tests based on structure
  const handleExecuteTests = () => {
    setIsRunningTest(true);
    setTerminalLogs(prev => [...prev, `[SRE] Initiating workspace compilation sequence...`]);
    
    setTimeout(() => {
      let resultLogs = [];
      if (workspaceName === 'python_api') {
        resultLogs = [
          '============================= test session starts =============================',
          'platform linux -- Python 3.11.2, pytest-7.4.0',
          'rootdir: /sandbox/folders/python_api',
          'collected 3 items',
          '',
          'test_main.py::test_read_root PASSED                                      [ 33%]',
          'test_main.py::test_get_items PASSED                                      [ 66%]',
          'test_main.py::test_create_item_unauthorized PASSED                       [100%]',
          '',
          '============================== 3 passed in 0.85s ==============================',
          '[COMPILER] Status verified. API bindings healthy!'
        ];
      } else {
        resultLogs = [
          '> ts-utils-demolib@1.0.0 test',
          '> jest --verbose',
          '',
          ' PASS  src/__tests__/strings.test.ts',
          '  ✓ capitalize should handle standard characters (4 ms)',
          '  ✓ slugify should normalize dirty URI tags (1 ms)',
          ' PASS  src/__tests__/parser.test.ts',
          '  ✓ parseString should ingest comma-delimited pairs (1 ms)',
          '',
          'Test Suites: 2 passed, 2 total',
          'Tests:       3 passed, 3 total',
          'Snapshots:   0 total',
          'Time:        1.42s, estimated 2s',
          'Ran all test suites. Status: verified'
        ];
      }
      
      setTerminalLogs(prev => [...prev, ...resultLogs]);
      setIsRunningTest(false);
    }, 1500);
  };

  // Vibe Coding: Query refactor diffs from Gemini or local model
  const handleComposerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerInput || !activeFile) return;

    const currentAgent = agents.find(a => a.id === activeAgentId);
    const instruction = composerInput;
    setComposerMessages(prev => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        role: 'user',
        content: instruction,
        timestamp: new Date().toTimeString().split(' ')[0]
      }
    ]);
    setComposerInput('');
    setIsComposerThinking(true);

    try {
      const response = await fetch('/api/vibe/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          fileName: activeFile.name,
          fileContent: activeFile.content,
          workspaceFiles
        })
      });

      if (!response.ok) {
        throw new Error("Composer action failed");
      }

      const resObj = await response.json();
      
      // Setup live DIFF session
      const suggestedDiff: DiffSuggestion = {
        originalPath: activeFile.path,
        originalCode: activeFile.content || '',
        modifiedCode: resObj.modifiedCode,
        explanation: resObj.explanation,
        applied: false
      };

      setActiveDiff(suggestedDiff);

      setComposerMessages(prev => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: `${resObj.explanation}\n\nI have generated a suggested code diff. Review the red/green discrepancies in the Monaco visualizer.`,
          timestamp: new Date().toTimeString().split(' ')[0],
          diff: suggestedDiff
        }
      ]);
    } catch (err) {
      console.error("Composer logic error", err);
      setComposerMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: "Failed to evaluate coding changes. Re-check provider key connections or workspace targets.",
          timestamp: new Date().toTimeString().split(' ')[0]
        }
      ]);
    } finally {
      setIsComposerThinking(false);
    }
  };

  // Discard suggestions
  const handleRejectDiff = () => {
    setActiveDiff(null);
    setTerminalLogs(prev => [...prev, `[SRE] Vibe coding modification discarded by operator.`]);
  };

  // Confirm and integrate suggestions
  const handleAcceptDiff = () => {
    if (!activeDiff || !activeFile) return;

    // Apply code replace
    handleEditorChange(activeDiff.modifiedCode);
    setActiveDiff(null);
    onUpdateGraph(); // Update dependencies structures
    
    setTerminalLogs(prev => [
      ...prev,
      `[SRE] Code changes accepted! Committed into ${activeFile.name} successfully.`
    ]);
  };

  // Quick recursive renderer for Directories Tree
  const renderWorkspaceExplorer = (files: WorkspaceFile[]) => {
    return files.map(file => {
      const isDir = file.type === 'directory';
      const isCollapsed = collapsedFolders[file.path];
      const itemsCount = file.children?.length;

      return (
        <div key={file.path} className="select-none">
          <div
            onClick={() => handleFileClick(file)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer text-slate-350 transition-all ${
              activeFile?.path === file.path 
                ? 'bg-slate-800 text-indigo-400 font-medium' 
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            {isDir ? (
              <>
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                <Folder className="w-4 h-4 text-amber-500" />
                <span className="truncate">{file.name}</span>
                <span className="text-[10px] text-slate-650">({itemsCount})</span>
              </>
            ) : (
              <>
                <span className="w-3.5" />
                <File className={`w-4 h-4 ${file.name.endsWith('.py') ? 'text-blue-400' : 'text-emerald-400'}`} />
                <span className="truncate">{file.name}</span>
              </>
            )}
          </div>

          {isDir && !isCollapsed && file.children && (
            <div className="pl-4 border-l border-slate-900 mt-0.5 space-y-0.5">
              {renderWorkspaceExplorer(file.children)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div id="forge_ide_panel" className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[80vh] min-h-[580px] scale-95 animate-fade-in origin-top duration-300">
      
      {/* COLUMN 1: WORKSPACE RAIL & DEPENDENCIES (3 COLS) */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        
        {/* WORKSPACE DROPDOWN */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-semibold">Active Project</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeWorkspace('python_api')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider border transition-all ${
                workspaceName === 'python_api' 
                  ? 'bg-blue-950/40 border-blue-500 text-blue-400' 
                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'
              }`}
            >
              🐍 Python API
            </button>
            <button
              onClick={() => onChangeWorkspace('ts_utils')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider border transition-all ${
                workspaceName === 'ts_utils' 
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'
              }`}
            >
              📦 TS Utils
            </button>
          </div>
        </div>

        {/* WORKSPACE FILE TREE HEADER */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-905 mb-3 select-none">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold">Files Explorer</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono italic">Workspace: /usr/local</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {renderWorkspaceExplorer(workspaceFiles)}
          </div>
        </div>

      </div>

      {/* COLUMN 2: CUSTOM CODE COMPILER & TERMS PANEL (6 COLS) */}
      <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden">
        
        {/* TAB HEADERS MAPPED */}
        <div className="bg-slate-900/65 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-855 pb-2.5 mb-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {openTabs.map(path => {
                const tName = path.split('/').pop() || 'Untitled';
                const isActive = activeFile?.path === path;
                return (
                  <div
                    key={path}
                    onClick={() => {
                      const matched = workspaceFiles.find(f => f.path === path);
                      if (matched) setActiveFile(matched);
                    }}
                    className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer text-xs font-mono select-none transition-all ${
                      isActive 
                        ? 'bg-slate-950 text-indigo-400 border border-slate-800' 
                        : 'text-slate-500 hover:bg-slate-950/40 hover:text-slate-300'
                    }`}
                  >
                    <span>{tName}</span>
                    <button
                      onClick={(e) => handleCloseTab(path, e)}
                      className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-350"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {activeFile && (
              <span className="text-[10.5px] font-mono text-slate-550 hidden md:block uppercase tracking-wider font-semibold mr-1">
                {activeFile.name.endsWith('.py') ? 'Python 3' : 'ES Modules'}
              </span>
            )}
          </div>

          {/* DYNAMIC PANE RENDERING (MONACO CODE EDITOR OR DIFF VIEWER) */}
          <div className="flex-1 bg-slate-950 border border-slate-900 rounded-lg overflow-hidden flex flex-col relative">
            
            {activeDiff ? (
              /* DIFF VIEWER (SPLIT DUAL PANE COMPARISON) */
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
                <div className="bg-red-950/20 border-b border-amber-900/30 px-3 py-2 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-2 text-[10.5px] font-mono text-amber-400">
                    <Shield className="w-4 h-4" />
                    <span><b>DIFF SUPERVISOR ACTIVE:</b> Accept or Decline modifications proposed by agent.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRejectDiff}
                      className="px-2 py-0.5 bg-red-950/60 border border-red-900/50 hover:bg-red-950 hover:text-red-300 text-slate-300 text-[11px] font-medium rounded transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Discard
                    </button>
                    <button
                      onClick={handleAcceptDiff}
                      className="px-2.5 py-0.5 bg-emerald-600 border border-emerald-450 hover:bg-emerald-500 text-slate-950 text-[11px] font-semibold rounded shadow transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Code
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 divide-x divide-slate-900 font-mono text-xs leading-relaxed">
                  
                  {/* Left block (Original version) */}
                  <div className="p-4 bg-slate-950">
                    <div className="text-[10.5px] font-bold text-slate-500 sticky top-0 uppercase tracking-widest bg-slate-950 pb-2 border-b border-slate-900 mb-3 select-none">Original Code</div>
                    <pre className="text-slate-400 whitespace-pre scrollbar-none">
                      {activeDiff.originalCode.split('\n').map((line, idx) => (
                        <div key={idx} className="flex hover:bg-slate-900/40">
                          <span className="w-8 inline-block select-none text-slate-650 pr-2 border-r border-slate-900 text-right mr-3">{idx + 1}</span>
                          <span className={idx > 3 && idx < 12 ? 'bg-red-950/25 text-red-305 w-full' : ''}>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>

                  {/* Right block (Modified version) */}
                  <div className="p-4 bg-slate-950">
                    <div className="text-[10.5px] font-bold text-slate-550 sticky top-0 uppercase tracking-widest bg-slate-955 pb-2 border-b border-slate-900 mb-3 select-none">Suggested Diffs</div>
                    <pre className="text-slate-300 whitespace-pre scrollbar-none animate-pulse-once">
                      {activeDiff.modifiedCode.split('\n').map((line, idx) => (
                        <div key={idx} className="flex hover:bg-slate-900/40">
                          <span className="w-8 inline-block select-none text-slate-650 pr-2 border-r border-slate-900 text-right mr-3">{idx + 1}</span>
                          <span className={idx > 3 && idx < 12 ? 'bg-emerald-950/30 text-emerald-350 font-medium w-full block' : ''}>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>

                </div>
              </div>

            ) : activeFile ? (
              /* MONACO EDITOR COMPONENT SIMULATION */
              <div className="flex-1 flex flex-col font-mono text-[12px] overflow-hidden">
                <textarea
                  value={activeFile.content || ''}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  className="flex-1 bg-slate-950 border-none resize-none p-4 text-slate-300 leading-relaxed outline-none focus:ring-0 font-mono scrollbar-thin overflow-y-auto"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Code className="w-10 h-10 text-slate-700 mb-2" />
                <span className="text-xs text-slate-500">Workspace empty. Select a source file in explorer to initialize Monaco edits.</span>
              </div>
            )}
            
          </div>

        </div>

        {/* TERMINAL COMPILATION SCREEN */}
        <div id="terminal_sec" className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl h-44 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-855 mb-2 select-none shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold">Automation Terminal Panel</span>
            </div>
            
            <button
              onClick={handleExecuteTests}
              disabled={isRunningTest}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 disabled:opacity-50 text-emerald-450 hover:text-emerald-400 text-[10.5px] font-mono font-bold rounded border border-slate-800 transition-all flex items-center gap-1.5 active:scale-95 shadow"
            >
              {isRunningTest ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  compiling...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-450" />
                  Run Compiler tests
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-900 rounded p-3 font-mono text-[10.5px] text-slate-400 overflow-y-auto leading-relaxed scrollbar-thin">
            {terminalLogs.map((log, index) => (
              <div key={index} className={`${
                log.includes('PASSED') || log.includes('passed') || log.includes('✓') ? 'text-emerald-400 font-semibold' :
                log.includes('FAILED') || log.includes('error') ? 'text-red-400 font-semibold' :
                log.includes('[SRE]') ? 'text-indigo-400' : 'text-slate-450'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COLUMN 3: COMPOSER AGENTIC CHAT SIDEBAR (3 COLS) */}
      <div className="lg:col-span-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl h-full flex flex-col justify-between overflow-hidden">
          
          <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
            
            {/* Top selectors for Composer mode */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold">Interactive Composer</span>
              </div>
              <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/20 py-0.5 px-2 rounded border border-emerald-900/40 uppercase">VIBE MODE</span>
            </div>

            {/* Selector box */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Active Agent</label>
              <select
                value={activeAgentId}
                onChange={(e) => onChangeActiveAgent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-505"
              >
                {agents.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.avatar} {ag.name}</option>
                ))}
              </select>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs scrollbar-none">
              {composerMessages.map((msg, midx) => (
                <div key={midx} className={`p-2.5 rounded-lg leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-850 text-slate-200' 
                    : msg.role === 'system'
                    ? 'bg-indigo-950/15 text-slate-400 text-center font-mono text-[10.5px] border border-indigo-950/30'
                    : 'bg-slate-950/70 border border-slate-900 text-slate-300'
                }`}>
                  {msg.role !== 'system' && (
                    <span className="font-semibold text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-1">
                      {msg.role === 'user' ? 'Directives' : 'Composer Reply'}
                    </span>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              {isComposerThinking && (
                <div className="bg-slate-950 p-3 italic text-indigo-400/80 rounded animate-pulse text-[11px] font-mono border border-indigo-950/20">
                  Processing file structures & resolving code dependencies...
                </div>
              )}
            </div>

          </div>

          {/* Active bottom input */}
          <form onSubmit={handleComposerSubmit} className="border-t border-slate-800 pt-3 mt-4 shrink-0">
            <div className="bg-slate-950 rounded-lg p-1.5 border border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={composerInput}
                disabled={isComposerThinking || !activeFile}
                onChange={(e) => setComposerInput(e.target.value)}
                placeholder={activeFile ? `Ask agent to write or refactor...` : "Open a file to run vibe edits..."}
                className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-200 focus:outline-none font-sans"
              />
              <button
                type="submit"
                disabled={isComposerThinking || !composerInput || !activeFile}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-950 rounded-md transition-colors"
              >
                <Send className="w-3.5 h-3.5 fill-black text-black" />
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
