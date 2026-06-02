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

// Global baseline to track Code Git diffs across files
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

  const [showRenameModal, setShowRenameModal] = useState<string | null>(null); // holds old path
  const [renameTargetName, setRenameTargetName] = useState('');

  // Terminal compilation and testing console log outputs
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

  // ---------------- TS PLAYGROUND STATE ----------------
  const [tsTestInput, setTsTestInput] = useState('{"name":"john_doe", "status_level":"active_admin", "user_city":"San Francisco"}');
  const [tsExecutionOutput, setTsExecutionOutput] = useState('');
  const [isEvaluatingTs, setIsEvaluatingTs] = useState(false);

  // ---------------- PYTHON API PLAYGROUND STATE ----------------
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
      // Build a local baseline of code files to verify modified statuses later
      const initialBaseline: FileBaseline = {};
      workspaceFiles.forEach(f => {
        initialBaseline[f.path] = f.content || '';
      });
      setBaselineFiles(initialBaseline);

      // Open primary entry file by default
      const primaryIndex = workspaceFiles.findIndex(f => 
        f.name.toLowerCase().includes('main') || 
        f.name.toLowerCase().includes('index') || 
        f.name.toLowerCase().includes('app')
      );
      const defaultToOpen = primaryIndex >= 0 ? workspaceFiles[primaryIndex] : workspaceFiles[0];
      
      setActiveFile(defaultToOpen);
      setOpenTabs([defaultToOpen.path]);
    }

    // Refresh interactive logs matching workspace type
    setComposerMessages([
      {
        id: 'greet_init',
        role: 'system',
        content: `Agentic Workspace: Loaded project [${workspaceName.toUpperCase()}]. Submit vibe programming commands, create supporting assets, or execute direct code sandbox simulations.`,
        timestamp: new Date().toTimeString().split(' ')[0]
      }
    ]);

    setActiveDiff(null);
    setIsPythonServerRunning(false);
    setApiConsoleLogs([
      `[UVICORN] Python server offline. Ready to deploy ${workspaceName === 'python_api' ? '/main.py' : 'TS core engine'}.`
    ]);
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

  // Check if file is dirty/modified
  const isFileModified = (path: string): boolean => {
    const currentFileContent = workspaceFiles.find(f => f.path === path)?.content || '';
    const baselineContent = baselineFiles[path] || '';
    return currentFileContent !== baselineContent;
  };

  // Compute total dirty files count
  const modifiedFilesCount = workspaceFiles.filter(f => f.type === 'file' && isFileModified(f.path)).length;

  // Track and build unified, clean folder paths tree recursively
  interface VisualTreeNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    file?: WorkspaceFile;
    children: { [key: string]: VisualTreeNode };
  }

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

  // Sidebar toggler
  const handleToggleSidebar = (tab: 'explorer' | 'search' | 'git' | 'settings') => {
    if (sidebarTab === tab) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setSidebarTab(tab);
      setIsSidebarOpen(true);
    }
  };

  // ---------------- FILE CREATION OPERATIONS ----------------
  const handleCreateFileOrDir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    let targetPath = newFilePath.trim();
    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }

    // Check conflict
    const conflict = workspaceFiles.some(f => f.path.toLowerCase() === targetPath.toLowerCase());
    if (conflict) {
      alert(`Conflict: A code file with the path '${targetPath}' already exists in workspace.`);
      return;
    }

    const fileName = targetPath.split('/').pop() || 'untitled';
    const isDir = newFileType === 'directory';

    // File boilerplates
    let content = '';
    if (!isDir) {
      if (fileName.endsWith('.py')) {
        content = `"""\n * Module: ${fileName}\n * Generated inside ForgeAI workspace\n """\n\ndef run_utility():\n    print("Executing dynamic helper inside python core")\n    return {"status": "ok"}\n`;
      } else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
        content = `/**\n * ${fileName}\n * Generated in ForgeAI Space workspace\n */\n\nexport function setupHelper() {\n  console.log("TS helper initialized");\n  return true;\n}\n`;
      } else if (fileName.endsWith('.json')) {
        content = `{\n  "name": "${fileName.replace('.json', '')}",\n  "status": "active"\n}\n`;
      } else {
        content = `# New workspace file ${fileName}\n`;
      }
    }

    const createdObject: WorkspaceFile = {
      path: targetPath,
      name: fileName,
      type: isDir ? 'directory' : 'file',
      ...(isDir ? { children: [] } : { content })
    };

    const nextFiles = [...workspaceFiles, createdObject];
    onUpdateFiles(nextFiles);

    // Update git baseline
    setBaselineFiles(prev => ({
      ...prev,
      [targetPath]: content
    }));

    // Trigger tab open immediately
    if (!isDir) {
      setActiveFile(createdObject);
      if (!openTabs.includes(targetPath)) {
        setOpenTabs(p => [...p, targetPath]);
      }
    }

    setTerminalLogs(prev => [
      ...prev,
      `[SRE] Successfully created ${isDir ? 'directory' : 'file'} at path ${targetPath}`
    ]);

    setNewFilePath('');
    setShowNewFileModal(false);
    onUpdateGraph(); // refresh AST map
  };

  // ---------------- FILE RENAMED / DELETED ACTIONS ----------------
  const handleRenameFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRenameModal || !renameTargetName.trim()) return;

    const oldPath = showRenameModal;
    const pathParts = oldPath.split('/');
    pathParts.pop(); // remove last element (old name)
    const folderPrefix = pathParts.join('/');
    const newPath = (folderPrefix === '' ? '/' : folderPrefix === '/' ? '/' : folderPrefix + '/') + renameTargetName.trim();

    // Check conflicts
    const conflict = workspaceFiles.some(f => f.path === newPath);
    if (conflict) {
      alert(`Conflict: Path '${newPath}' is already used by another file asset.`);
      return;
    }

    const nextFiles = workspaceFiles.map(f => {
      if (f.path === oldPath) {
        return {
          ...f,
          path: newPath,
          name: renameTargetName.trim()
        };
      }
      return f;
    });

    onUpdateFiles(nextFiles);

    // Update open tabs list
    const updatedTabs = openTabs.map(t => t === oldPath ? newPath : t);
    setOpenTabs(updatedTabs);

    if (activeFile?.path === oldPath) {
      const activeMatch = nextFiles.find(f => f.path === newPath);
      if (activeMatch) setActiveFile(activeMatch);
    }

    // Sync baseline
    const baselineVal = baselineFiles[oldPath] || '';
    setBaselineFiles(prev => {
      const copy = { ...prev };
      delete copy[oldPath];
      copy[newPath] = baselineVal;
      return copy;
    });

    setTerminalLogs(prev => [
      ...prev,
      `[SRE] File path updated from ${oldPath} to ${newPath}`
    ]);

    setShowRenameModal(null);
    setRenameTargetName('');
    onUpdateGraph();
  };

  const handleDeleteFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete file path ${path}?`)) return;

    const filtered = workspaceFiles.filter(f => f.path !== path);
    onUpdateFiles(filtered);

    // Close tabs
    const nextTabs = openTabs.filter(t => t !== path);
    setOpenTabs(nextTabs);

    if (activeFile?.path === path) {
      if (nextTabs.length > 0) {
        const nextActive = filtered.find(f => f.path === nextTabs[0]);
        if (nextActive) setActiveFile(nextActive);
      } else {
        setActiveFile(null);
      }
    }

    // Baseline clean up
    setBaselineFiles(prev => {
      const copy = { ...prev };
      delete copy[path];
      return copy;
    });

    setTerminalLogs(prev => [
      ...prev,
      `[SRE] Removed ${path} from actively compiled modules.`
    ]);
    onUpdateGraph();
  };

  // Reset entire files workspace to loaded mock presets
  const handleResetWorkspace = () => {
    if (!confirm("Caution: This will clear all custom file edits and restore initial pre-loaded technical templates. Proceed?")) return;
    const restoredPreset = MOCK_WORKSPACES[workspaceName] || [];
    onUpdateFiles(restoredPreset);

    // reset active and tab
    if (restoredPreset.length > 0) {
      setActiveFile(restoredPreset[0]);
      setOpenTabs([restoredPreset[0].path]);
    } else {
      setActiveFile(null);
      setOpenTabs([]);
    }

    // Reset snap baselines
    const baseline: FileBaseline = {};
    restoredPreset.forEach(f => {
      baseline[f.path] = f.content || '';
    });
    setBaselineFiles(baseline);

    setTerminalLogs(prev => [
      ...prev,
      `[SRE] Workspace reset command executed successfully.`
    ]);
    onUpdateGraph();
  };

  // ---------------- GIT VIRTUAL COMMIT TRIGGERS ----------------
  const handleCommitGitChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || modifiedFilesCount === 0) return;

    const commitSha = Math.random().toString(16).substring(2, 9);
    const newCommit = {
      sha: commitSha,
      message: commitMessage.trim(),
      date: 'Just now'
    };

    setCommitHistory(prev => [newCommit, ...prev]);

    // Snapshot current codes to be the baseline
    const snapshot: { [path: string]: string } = {};
    workspaceFiles.forEach(f => {
      snapshot[f.path] = f.content || '';
    });
    setBaselineFiles(snapshot);

    setTerminalLogs(prev => [
      ...prev,
      `[GIT] Successfully committed ${modifiedFilesCount} files: ${newCommit.message} (${commitSha})`,
      `[CI/CD] Triggering build and integration checks for index hash...`,
      `[CI/CD] Hash verification: verified`
    ]);

    setCommitMessage('');
    onUpdateGraph(); // force symbols rebuild
  };

  // ---------------- TS CONSOLE UTILS EXPERIMENT INTERPRETER ----------------
  const handleRunTsExecutionPlayground = () => {
    setIsEvaluatingTs(true);
    setTsExecutionOutput('Evaluating and tokenizing TS libraries...');

    setTimeout(() => {
      // Pull modules
      const stringsFile = workspaceFiles.find(f => f.path.includes('strings'));
      const parserFile = workspaceFiles.find(f => f.path.includes('parser'));
      const indexFile = workspaceFiles.find(f => f.path.includes('index'));
      
      if (!indexFile) {
        setTsExecutionOutput('Runtime Error: Code execution entrypoint "index.ts" not found in active workspace. Create "index.ts" to evaluate.');
        setIsEvaluatingTs(false);
        return;
      }

      // Concat JS Code
      let runJs = `
        ${stringsFile?.content || ''}
        ${parserFile?.content || ''}
        ${indexFile?.content || ''}
      `;

      // JS conversion - Strip TS types, imports, and exports
      runJs = runJs.replace(/import\s*[\s\S]*?from\s*['"].*?['"];?/g, '');
      runJs = runJs.replace(/\bexport\s+const\b/g, 'const');
      runJs = runJs.replace(/\bexport\s+function\b/g, 'function');
      runJs = runJs.replace(/\bexport\b/g, '');
      runJs = runJs.replace(/:\s*(string|number|boolean|any|Record<[^>]*>|string\[\]|void|null)/g, '');
      runJs = runJs.replace(/as\s+Record<[^>]*>/g, '');
      runJs = runJs.replace(/as\s+\w+/g, '');

      try {
        const executeCode = `
          ${runJs}
          return transformPayload(payload);
        `;
        
        const evaluator = new Function('payload', executeCode);
        const stdout = evaluator(tsTestInput);
        
        setTsExecutionOutput(
          `[JS INTERPRETER ENGINE] TS successfully compiled to ES5!\n` +
          `[EXECUTION LOG] Called transformPayload() with custom sample parameters.\n` +
          `==================================================\n` +
          `STDOUT RESULT:\n` +
          `${typeof stdout === 'string' ? stdout : JSON.stringify(stdout, null, 2)}`
        );
      } catch (err: any) {
        setTsExecutionOutput(
          `[SANDBOX INTERPRTER CRASH] Evaluator returned a fatal compile exception:\n` +
          `❌ ${err.message}\n\n` +
          `Verify syntactic brackets, types structure, or custom regex formatting.`
        );
      } finally {
        setIsEvaluatingTs(false);
      }
    }, 850);
  };

  // ---------------- PYTHON FASTAPI LOCAL SERVER PLAYGROUND ----------------
  const handleTogglePythonServer = () => {
    if (isPythonServerRunning) {
      setIsPythonServerRunning(false);
      setApiConsoleLogs(p => [...p, '[UVICORN] Server shut down. Process killed.']);
    } else {
      setIsPythonServerRunning(true);
      setApiConsoleLogs([
        'INFO:     Loading active FastAPI router variables...',
        'INFO:     SQLite DB adapter registered at "sqlite:///./sql_app.db"',
        'INFO:     Started server process [67184]',
        'INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)',
        'INFO:     127.0.0.1:49272 - Connection tunnel active.',
        '[UVICORN] Backend simulated API online! Use interactive REST interface below.'
      ]);
    }
  };

  // Trigger simulated endpoints matching user logic inside main.py
  const handleTriggerSimulatedApiRequest = (route: string, method: string, customBody?: any) => {
    if (!isPythonServerRunning) {
      alert("Error: Python web service is offline. Click 'Run Server Playground' to deploy the FastAPI framework.");
      return;
    }

    const mainPy = workspaceFiles.find(f => f.path.includes('main.py'));
    const content = mainPy?.content || '';

    // Extractor helpers
    let responseBody: any = null;
    let status = 200;

    setApiConsoleLogs(p => [...p, `INFO:     127.0.0.1:49272 - "${method} ${route} HTTP/1.1"`]);

    if (route === '/' && method === 'GET') {
      // Find read_root() python dictionary return values
      const match = content.match(/def\s+read_root\(\s*\):[\s\S]*?return\s*(\{[\s\S]*?\})/);
      if (match) {
        try {
          const cleanObj = match[1].replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false');
          responseBody = JSON.parse(cleanObj);
        } catch {
          responseBody = { "message": "Welcome to ForgeAI Fast API Server" };
        }
      } else {
        responseBody = { "message": "Welcome to ForgeAI Fast API Server" };
      }
    } else if (route === '/health' && method === 'GET') {
      const match = content.match(/def\s+health_check\(\s*\):[\s\S]*?return\s*(\{[\s\S]*?\})/);
      if (match) {
        try {
          const cleanObj = match[1].replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false');
          responseBody = JSON.parse(cleanObj);
        } catch {
          responseBody = { "status": "healthy", "database": "connected" };
        }
      } else {
        responseBody = { "status": "healthy", "database": "connected" };
      }
    } else if (route === '/items' && method === 'GET') {
      responseBody = dbItems;
    } else if (route === '/items' && method === 'POST') {
      if (!customBody || !customBody.name) {
        status = 422;
        responseBody = { "detail": "ValidationError: missing required field 'name'" };
      } else {
        const itemObj = {
          name: customBody.name,
          description: customBody.description || "N/A",
          price: parseFloat(customBody.price) || 0.0,
          is_available: true
        };
        setDbItems(prev => [...prev, itemObj]);
        responseBody = itemObj;
      }
    } else {
      status = 404;
      responseBody = { "detail": "Not Found" };
    }

    setApiConsoleLogs(p => [...p, `INFO:     Response Code: ${status}`]);
    
    // Alert payload in console
    const formattedResponse = 
      `HTTP/1.1 ${status} OK\n` +
      `Content-Type: application/json\n\n` +
      JSON.stringify(responseBody, null, 2);

    setApiConsoleLogs(p => [...p, formattedResponse]);
  };

  // Add Item via REST input trigger
  const handlePostNewItemSimulator = (e: React.FormEvent) => {
    e.preventDefault();
    handleTriggerSimulatedApiRequest('/items', 'POST', {
      name: apiPostName,
      description: apiPostDesc,
      price: apiPostPrice
    });
    setApiPostName('GraphQL Adapter');
    setApiPostDesc('');
    setApiPostPrice('35.00');
  };

  // ---------------- GLOBAL WORKSPACE SEARCH FINDER ----------------
  const findMatchesInFiles = (): Array<{ file: WorkspaceFile; lineNo: number; lineText: string }> => {
    if (!searchQuery.trim()) return [];
    
    const results: Array<{ file: WorkspaceFile; lineNo: number; lineText: string }> = [];
    const query = searchQuery.toLowerCase();

    workspaceFiles.forEach(f => {
      if (f.type !== 'file' || !f.content) return;
      
      const lines = f.content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          results.push({
            file: f,
            lineNo: index + 1,
            lineText: line.trim()
          });
        }
      });
    });

    return results;
  };

  const searchResults = findMatchesInFiles();

  // ---------------- CI/CD PIPELINE EXECUTION ----------------
  const handleExecuteTests = () => {
    setIsRunningTest(true);
    setTerminalLogs(prev => [...prev, `[SRE] Ingesting Workspace compilation parameters...`]);
    
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
      } else if (workspaceName === 'ts_utils') {
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
          'Time:        1.42s',
          'Ran all test suites. Status: verified'
        ];
      } else {
        resultLogs = [
          '> forge-platform-webui@2.0.0 verify',
          '> vite build && tsc --noEmit',
          '',
          'vite v6.2.3 building for production...',
          '✓ 34 modules transformed.',
          'dist/index.html                  0.48 kB │ info: none',
          'dist/assets/index-Bv5r_9gD.css   12.4 kB │ info: none',
          'dist/assets/index-Cz9p_2uX.js   384.2 kB │ info: none',
          '✓ built in 1.15s',
          '',
          'Typecheck: OK.',
          'PASS  src/__tests__/App.test.tsx',
          '  ✓ App renders without crashing (8 ms)',
          '  ✓ Knowledge graph triggers dynamic re-indexing successfully (12 ms)',
          '',
          'Test Suites: 1 passed, 1 total',
          'Tests:       2 passed, 2 total',
          'Snapshots:   0 total',
          'Time:        1.34s',
          'Ran all test suites. Status: verified'
        ];
      }
      
      setTerminalLogs(prev => [...prev, ...resultLogs]);
      setIsRunningTest(false);
    }, 1200);
  };

  // ---------------- AI COMPOSER VIBE WRITER ----------------
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
          content: `${resObj.explanation}\n\nReview the generated modifications side-by-side inside SRE supervisor.`,
          timestamp: new Date().toTimeString().split(' ')[0],
          diff: suggestedDiff
        }
      ]);
    } catch (err) {
      console.error("Composer prompt exception", err);
      setComposerMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: "Failed to query code refactoring. Ensure GEMINI_API_KEY is configured correctly inside Settings panel.",
          timestamp: new Date().toTimeString().split(' ')[0]
        }
      ]);
    } finally {
      setIsComposerThinking(false);
    }
  };

  const handleRejectDiff = () => {
    setActiveDiff(null);
    setTerminalLogs(prev => [...prev, `[SRE] Git refactor discard instruction declared by workspace host.`]);
  };

  const handleAcceptDiff = () => {
    if (!activeDiff || !activeFile) return;
    handleEditorChange(activeDiff.modifiedCode);
    setActiveDiff(null);
    onUpdateGraph();
    
    setTerminalLogs(prev => [
      ...prev,
      `[SRE] Approved and integrated AI patch into file: ${activeFile.name}`
    ]);
  };

  // Recurse directories tree
  const recursiveTreeElements = (node: VisualTreeNode) => {
    return Object.values(node.children).map(child => {
      const isDir = child.type === 'directory';
      const isCollapsed = collapsedFolders[child.path];
      const directChildrenCount = Object.keys(child.children).length;
      const isDirty = child.file ? isFileModified(child.file.path) : false;

      return (
        <div key={child.path} className="select-none text-slate-350">
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
                ? 'bg-slate-800 text-indigo-400 font-medium' 
                : 'hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {isDir ? (
                <>
                  {isCollapsed ? <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />}
                  <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                  <span className="truncate">{child.name}</span>
                </>
              ) : (
                <>
                  <span className="w-3 shrink-0" />
                  <File className={`w-3.5 h-3.5 shrink-0 ${child.name.endsWith('.py') ? 'text-blue-400' : 'text-emerald-400'}`} />
                  <span className="truncate">{child.name}</span>
                  {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-sm" title="Modified" />}
                </>
              )}
            </div>

            {/* Hover actions buttons strip */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                title="Rename file entry"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRenameModal(child.path);
                  setRenameTargetName(child.name);
                }}
                className="p-1 hover:bg-slate-750 text-slate-400 hover:text-slate-100 rounded"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                title="Delete item"
                onClick={(e) => handleDeleteFile(child.path, e)}
                className="p-1 hover:bg-slate-750 text-slate-400 hover:text-red-400 rounded"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isDir && !isCollapsed && (
            <div className="pl-3.5 border-l border-slate-850 ml-2.5 mt-0.5 space-y-0.5">
              {recursiveTreeElements(child)}
              {directChildrenCount === 0 && (
                <span className="text-[10px] text-slate-650 italic pl-5 block py-0.5">Empty path node</span>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const fileTreeRootNode = buildHierarchicalTree(workspaceFiles);

  return (
    <div id="forge_ide_workspace" className="flex flex-col xl:flex-row gap-4 h-auto xl:h-[calc(100vh-140px)] xl:min-h-[680px] bg-slate-950 text-slate-300 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative p-1">
      
      {/* 1. VS CODE STYLE EXTREMEMENT PRO SYSTEM SIDE BAR ICONS (width: 48px) */}
      <div className="hidden sm:flex flex-col justify-between items-center bg-slate-900 border-r border-slate-855 py-4 w-12 select-none shrink-0">
        <div className="flex flex-col gap-5 items-center w-full">
          {/* Logo badge */}
          <span className="p-1 bgColor bg-indigo-500/10 rounded-lg border border-indigo-500/30 font-mono text-xs font-bold text-indigo-400">
            O
          </span>
          
          <div className="flex flex-col gap-4 items-center w-full">
            <button
              onClick={() => handleToggleSidebar('explorer')}
              title="File Explorer"
              className={`p-2 rounded-lg transition-colors relative ${sidebarTab === 'explorer' && isSidebarOpen ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Folder className="w-5 h-5" />
              {modifiedFilesCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 border border-slate-900" />
              )}
            </button>
            
            <button
              onClick={() => handleToggleSidebar('search')}
              title="Find in Workspace Files"
              className={`p-2 rounded-lg transition-colors ${sidebarTab === 'search' && isSidebarOpen ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleToggleSidebar('git')}
              title="Git Source Control"
              className={`p-2 rounded-lg transition-colors relative ${sidebarTab === 'git' && isSidebarOpen ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <GitBranch className="w-5 h-5" />
              {modifiedFilesCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8.5px] font-mono leading-none bg-indigo-500 text-slate-950 font-bold rounded-full border border-slate-900 scale-90">
                  {modifiedFilesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleToggleSidebar('settings')}
              title="Workspace Settings"
              className={`p-2 rounded-lg transition-colors ${sidebarTab === 'settings' && isSidebarOpen ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" title="System connected OK" />
        </div>
      </div>

      {/* 2. SYSTEM SIDEBAR INNER ACTION PANELS - (EXPANDED TO CHOSEN MODULE) */}
      {isSidebarOpen && (
        <div className="w-full xl:w-72 bg-slate-900/60 border-b xl:border-b-0 xl:border-r border-slate-855 flex flex-col h-[400px] xl:h-full overflow-hidden shrink-0">
          
          {/* TAB 1: EXPLORER VIEW PANEL */}
          {sidebarTab === 'explorer' && (
            <div className="flex flex-col h-full p-4 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-855 mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">Workspace Files</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setNewFileType('file');
                      setShowNewFileModal(true);
                    }}
                    title="New Code File"
                    className="p-1 cursor-pointer bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded text-slate-400 hover:text-emerald-450 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetWorkspace}
                    title="Hard Reset Workspace Assets"
                    className="p-1 cursor-pointer bg-slate-950 hover:bg-slate-850 border border-slate-852 rounded text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ACTIVE PROJECT SELECTION SWITCHERS */}
              <div className="mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1.5">
                <span className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 select-none">Active Sandbox Directory</span>
                
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onChangeWorkspace('python_api')}
                    className={`px-2 py-1 rounded text-[11px] font-mono text-left transition-colors flex items-center justify-between ${workspaceName === 'python_api' ? 'bg-blue-950/40 text-blue-400 font-bold border border-blue-900/50' : 'text-slate-500 hover:text-slate-3 surf'}`}
                  >
                    <span>🐍 python-api-backend</span>
                    <span className="text-[10px] opacity-70">FastAPI</span>
                  </button>
                  <button
                    onClick={() => onChangeWorkspace('ts_utils')}
                    className={`px-2 py-1 rounded text-[11px] font-mono text-left transition-colors flex items-center justify-between ${workspaceName === 'ts_utils' ? 'bg-emerald-950/30 text-emerald-450 font-bold border border-emerald-900/50' : 'text-slate-500 hover:text-slate-3 surf'}`}
                  >
                    <span>📦 ts-utility-library</span>
                    <span className="text-[10px] opacity-70">NodeJS</span>
                  </button>
                  <button
                    onClick={() => onChangeWorkspace('forge_platform')}
                    className={`px-2 py-1 rounded text-[11px] font-mono text-left transition-colors flex items-center justify-between ${workspaceName === 'forge_platform' ? 'bg-indigo-950/40 text-indigo-400 font-bold border border-indigo-900/50' : 'text-slate-500 hover:text-slate-3 surf'}`}
                  >
                    <span>🖥️ forge-web-platform</span>
                    <span className="text-[10px] opacity-70">Webpack</span>
                  </button>
                </div>
              </div>

              {/* RECURSIVE HIERARCHICAL TREE VIEWER */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-none font-mono">
                {recursiveTreeElements(fileTreeRootNode)}
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH IN FILES PANEL */}
          {sidebarTab === 'search' && (
            <div className="flex flex-col h-full p-4 overflow-hidden">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 pb-3 border-b border-slate-855 mb-3">Global Search Finder</span>
              
              <div className="relative mb-4">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Keyword find in project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-500 text-slate-300 font-mono"
                />
              </div>

              {/* Search result elements */}
              <div className="flex-1 overflow-y-auto space-y-3.5 scrollbar-none font-mono text-[11.5px]">
                {searchQuery.trim() ? (
                  searchResults.length > 0 ? (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-550 mb-2">FOUND {searchResults.length} OCCURRENCES</div>
                      <div className="space-y-2">
                        {searchResults.map((res, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              handleFileClick(res.file);
                            }}
                            className="p-2 bg-slate-950/50 border border-slate-850 hover:bg-slate-900/40 hover:border-slate-800 rounded cursor-pointer transition-all space-y-1"
                          >
                            <div className="flex items-center gap-1.5 text-blue-400 font-semibold truncate hover:underline">
                              <File className="w-3 h-3 text-emerald-400" />
                              <span>{res.file.name}</span>
                              <span className="text-[9.5px] text-slate-600 font-normal">Line {res.lineNo}</span>
                            </div>
                            <div className="text-[10px] text-slate-450 bg-slate-950 px-1.5 py-1 rounded border border-slate-905 overflow-x-auto truncate">
                              {res.lineText}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600">No matching text characters found in code files indexing.</div>
                  )
                ) : (
                  <div className="text-center py-6 text-slate-500 italic">Enter parameters above to index all full-text imports, classes, functions, and string definitions.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SOURCE CONTROL GIT PANEL */}
          {sidebarTab === 'git' && (
            <div className="flex flex-col h-full p-4 overflow-hidden">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 pb-3 border-b border-slate-855 mb-3">Git Source Code Version Control</span>
              
              {/* Dirty files list indicator */}
              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-none">
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] uppercase font-bold text-slate-500 font-mono tracking-widest select-none">
                    <span>Staged/Pending Changes</span>
                    <span className="px-1.5 py-0.5 bg-amber-950/60 text-amber-500 rounded text-[9px] font-bold border border-amber-900/30">
                      {modifiedFilesCount} files dirty
                    </span>
                  </div>

                  {modifiedFilesCount > 0 ? (
                    <div className="space-y-1.5">
                      {workspaceFiles.filter(f => f.type === 'file' && isFileModified(f.path)).map(f => (
                        <div 
                          key={f.path}
                          onClick={() => handleFileClick(f)}
                          className="p-2 rounded bg-slate-950 hover:bg-slate-950 border border-slate-850 cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <File className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-mono text-slate-300 truncate">{f.name}</span>
                          </div>
                          <span className="text-[9.5px] font-bold font-mono text-amber-500 hover:underline">modified</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950 rounded text-center text-xs text-slate-600 italic select-none">
                      No unstaged code variations in workspace. Code is up-to-date.
                    </div>
                  )}
                </div>

                {/* Commit Form */}
                <form onSubmit={handleCommitGitChanges} className="space-y-2 pb-4 border-b border-slate-855">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold select-none">Refactor Message</label>
                  <textarea
                    required
                    placeholder="e.g. feat: integrate relational ORM schemas"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    disabled={modifiedFilesCount === 0}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-indigo-500 rounded p-2 text-xs outline-none resize-none font-mono text-slate-300 h-16 placeholder:text-slate-650"
                  />
                  <button
                    type="submit"
                    disabled={modifiedFilesCount === 0 || !commitMessage.trim()}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-550 active:scale-98 disabled:opacity-40 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Commit to HEAD
                  </button>
                </form>

                {/* Local repo log history list */}
                <div className="space-y-2 select-none">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Local Commits Log History</div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {commitHistory.map((com, kidx) => (
                      <div key={kidx} className="p-2 border border-slate-900 bg-slate-955 rounded flex items-start gap-2">
                        <span className="text-indigo-400 font-bold font-mono text-[10px] bg-indigo-950/50 px-1 py-0.5 rounded border border-indigo-900/30 uppercase tracking-widest">{com.sha}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] text-slate-300 truncate font-semibold leading-tight">{com.message}</p>
                          <span className="text-[9.5px] text-slate-550">{com.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS VIEW PANEL */}
          {sidebarTab === 'settings' && (
            <div className="flex flex-col h-full p-4 overflow-hidden">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 pb-3 border-b border-slate-855 mb-3">Settings Panel</span>
              
              <div className="space-y-4 font-mono text-xs text-slate-450 leading-relaxed overflow-y-auto scrollbar-none select-none">
                <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-900">
                  <h5 className="font-bold text-slate-300 mb-2 uppercase tracking-wide text-[10px]">Autofill IntelliSense Specs</h5>
                  <p className="text-[10.5px]">Inline formatting helper executes client-side syntax code corrections using exact AST validation hashes.</p>
                </div>

                <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-900">
                  <h5 className="font-bold text-slate-300 mb-2 uppercase tracking-wide text-[10px]">Simulation Interpreter Engines</h5>
                  <p className="text-[10.5px]">Python FastAPI FastAPI uses native routing parameters mapping. JavaScript sandbox dynamically aggregates file entities to compute run loops.</p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleResetWorkspace}
                    className="w-full py-1.5 bg-red-950/50 hover:bg-red-950 border border-red-900/50 hover:border-red-800 text-slate-300 text-xs font-semibold rounded transition-colors"
                  >
                    Hard Rebuild Developer Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. CENTER / MAIN MONACO TEXT EDITOR BLOCK */}
      <div className="flex-1 min-w-0 flex flex-col h-[650px] xl:h-full overflow-hidden border-b xl:border-b-0 xl:border-r border-slate-855 bg-slate-950">
        
        {/* TABS FILE SELECTION STRIP */}
        <div className="bg-slate-900 border-b border-slate-855 px-3 py-1.5 shrink-0 flex items-center justify-between overflow-x-auto scrollbar-none select-none">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {openTabs.map(path => {
              const tName = path.split('/').pop() || 'Untitled';
              const isActive = activeFile?.path === path;
              const isDirty = isFileModified(path);

              return (
                <div
                  key={path}
                  onClick={() => {
                    const matched = workspaceFiles.find(f => f.path === path);
                    if (matched) setActiveFile(matched);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded cursor-pointer text-xs font-mono transition-all border ${
                    isActive 
                      ? 'bg-slate-950 text-indigo-400 border-slate-800 font-bold' 
                      : 'text-slate-500 hover:bg-slate-950/40 hover:text-slate-300 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <File className={`w-3.5 h-3.5 ${tName.endsWith('.py') ? 'text-blue-400' : 'text-emerald-400'}`} />
                    <span>{tName}</span>
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified since last Git commit" />}
                  </div>
                  <button
                    onClick={(e) => handleCloseTab(path, e)}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-350 shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {activeFile && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Play sandbox run utility trigger */}
              <button
                onClick={() => setActiveOutputTab('playground')}
                title="Send active code to execution sandbox panel"
                className="p-1 bgColor hover:bg-slate-800 rounded border border-slate-800 text-emerald-450 hover:text-emerald-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 font-mono text-[10px]"
              >
                <PlayCircle className="w-4 h-4 text-emerald-400 fill-emerald-450/10" />
                <span>Run Sandbox</span>
              </button>
            </div>
          )}
        </div>

        {/* EDITOR INTERACTIVE EDITOR SPACE or DIFF VISUALS */}
        <div className="flex-1 bg-slate-950 overflow-hidden flex flex-col relative">
          
          {activeDiff ? (
            /* INTERACTIVE VIS_DIFF WRAPPER */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <div className="bg-amber-950/10 border-b border-amber-900/30 px-3.5 py-2 flex items-center justify-between select-none shrink-0 font-mono text-[11px] text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span><b>CRITICAL COMPARATOR:</b> Apply modifications compiled by <b>{agents.find(a=>a.id===activeAgentId)?.name}</b>?</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleRejectDiff}
                    className="px-2 py-0.5 bg-red-950/50 border border-red-900/50 hover:bg-red-900 hover:text-slate-100 rounded text-xs transition-colors"
                  >
                    Reject Patch
                  </button>
                  <button
                    onClick={handleAcceptDiff}
                    className="px-2.5 py-0.5 bg-emerald-600 border border-emerald-450 hover:bg-emerald-500 hover:text-slate-950 rounded text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95"
                  >
                    Approve Code
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto divide-x divide-slate-900 grid grid-cols-2 font-mono text-xs">
                
                <div className="p-4 bg-slate-950 select-text overflow-y-auto scrollbar-none leading-relaxed">
                  <div className="text-[9px] uppercase font-bold text-slate-550 border-b border-slate-900 pb-1.5 mb-2 sticky top-0 bg-slate-950">Original Loaded Revision</div>
                  <pre className="text-slate-500 whitespace-pre">
                    {activeDiff.originalCode.split('\n').map((line, idx) => (
                      <div key={idx} className="flex hover:bg-slate-900/30">
                        <span className="w-8 inline-block text-slate-700 select-none text-right pr-2 mr-3 border-r border-slate-900">{idx + 1}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>

                <div className="p-4 bg-slate-950 select-text overflow-y-auto scrollbar-none leading-relaxed">
                  <div className="text-[9px] uppercase font-bold text-slate-550 border-b border-slate-900 pb-1.5 mb-2 sticky top-0 bg-slate-950">Modified Code Suggestion</div>
                  <pre className="text-slate-200 whitespace-pre">
                    {activeDiff.modifiedCode.split('\n').map((line, idx) => (
                      <div key={idx} className="flex hover:bg-slate-800/40">
                        <span className="w-8 inline-block text-slate-600 select-none text-right pr-2 mr-3 border-r border-slate-900">{idx + 1}</span>
                        <span className={idx > 2 && idx < 12 ? 'bg-emerald-950/30 text-emerald-350 border-r-2 border-emerald-500 font-semibold px-0.5 w-full' : ''}>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>

              </div>
            </div>

          ) : activeFile ? (
            /* REAL OPEN SOURCE INTEGRATED MONACO IDE WORKSPACE */
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              <div className="bg-slate-900/90 border-b border-slate-850 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">⚡ OpenIDE Monaco Core</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300 font-semibold">{activeFile.path}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-slate-500 uppercase border border-slate-850">
                    {activeFile.name.endsWith('.py') ? 'Python3' : activeFile.name.endsWith('.json') ? 'JSON' : 'TypeScript'}
                  </span>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  loading={
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-xs gap-3">
                      <Loader className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-slate-500">Loading open-source Monaco instance...</span>
                    </div>
                  }
                  language={
                    activeFile.name.endsWith('.py') 
                      ? 'python' 
                      : activeFile.name.endsWith('.json') 
                        ? 'json' 
                        : activeFile.name.endsWith('.html')
                          ? 'html'
                          : activeFile.name.endsWith('.css')
                            ? 'css'
                            : 'typescript'
                  }
                  value={activeFile.content || ''}
                  onChange={(val) => handleEditorChange(val || '')}
                  options={{
                    minimap: { enabled: true, maxColumn: 80, scale: 0.75 },
                    fontSize: 12,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    padding: { top: 12, bottom: 12 },
                    cursorBlinking: 'smooth',
                    tabSize: 2,
                    insertSpaces: true,
                  }}
                />

                {/* Micro toolbar features inside footer */}
                <div className="absolute bottom-2 right-4 bg-slate-900/90 border border-slate-800/80 backdrop-blur rounded px-2 py-1 select-none flex items-center gap-2 shrink-0 font-mono text-[9px] text-slate-500 z-10">
                  <button
                    onClick={() => {
                      if (!activeFile.content) return;
                      // Prettify indentations
                      const rows = activeFile.content.split('\n');
                      const pretty = rows.map(r => r.trimRight()).join('\n');
                      handleEditorChange(pretty);
                      setTerminalLogs(p => [...p, '[COMPILER] Format Document successfully formatted all text indent rows.']);
                    }}
                    className="hover:text-emerald-400 font-semibold uppercase border-r border-slate-850 pr-2 cursor-pointer"
                  >
                    Format Code
                  </button>
                  <button
                    onClick={() => {
                      setTerminalLogs(p => [...p, '[ANALYZER] Testing static typescript AST diagnostics... OK. 0 errors detected.']);
                    }}
                    className="hover:text-amber-400 font-semibold uppercase cursor-pointer"
                  >
                    Run AST Check
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none animate-pulse">
              <Code className="w-12 h-12 text-slate-800 mb-2 animate-bounce" />
              <span className="text-xs text-slate-550 font-mono">No active module. Click a directory asset in explorer sidebar to begin edits.</span>
            </div>
          )}

          {/* DYNAMIC NEW FILE / FOLDER POPUP WINDOW */}
          {showNewFileModal && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-35 flex items-center justify-center p-4">
              <form onSubmit={handleCreateFileOrDir} className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4 font-sans select-none animate-fade-in text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Create Workspace Object
                  </span>
                  <button type="button" onClick={() => setShowNewFileModal(false)} className="text-slate-500 hover:text-slate-305">✕</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Asset Subcategory</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewFileType('file')}
                        className={`py-1.5 rounded text-xs font-mono font-bold ${newFileType === 'file' ? 'bg-indigo-600 text-slate-950' : 'bg-slate-950 text-slate-500'}`}
                      >
                        📄 Code File
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewFileType('directory')}
                        className={`py-1.5 rounded text-xs font-mono font-bold ${newFileType === 'directory' ? 'bg-indigo-600 text-slate-950' : 'bg-slate-950 text-slate-500'}`}
                      >
                        📂 Folder
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Workspace Path Location</label>
                    <input
                      type="text"
                      required
                      placeholder={newFileType === 'file' ? "e.g. /src/utils/math.ts" : "e.g. /tests/unit"}
                      value={newFilePath}
                      onChange={(e) => setNewFilePath(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 rounded-md px-3 py-1.5 text-xs text-slate-205 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 font-mono mt-1 leading-snug">Include absolute parent directory mapping indicators (must start with /).</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFileModal(false)}
                    className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-550 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
                  >
                    Initialize Object
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DYNAMIC RENAME FILE POPUP WINDOW */}
          {showRenameModal && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-35 flex items-center justify-center p-4">
              <form onSubmit={handleRenameFile} className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4 font-sans select-none animate-fade-in text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                    <Edit3 className="w-4 h-4" /> Rename Object Node
                  </span>
                  <button type="button" onClick={() => setShowRenameModal(null)} className="text-slate-500 hover:text-slate-305">✕</button>
                </div>
                
                <div className="space-y-3">
                  <div className="text-[11px] font-mono text-slate-400">
                    Target Path: <span className="text-indigo-350">{showRenameModal}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">New Entry Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. math_helpers.ts"
                      value={renameTargetName}
                      onChange={(e) => setRenameTargetName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRenameModal(null)}
                    className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-550 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
                  >
                    Rename Object
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* 4. UPGRADED DOUBLE CONSOLE BOTTOM PANELS - (CI/CD TESTS vs ACTIVE PLAYGROUND SANDBOX) */}
        <div className="h-[240px] xl:h-[260px] shrink-0 border-t border-slate-855 flex flex-col overflow-hidden bg-slate-950">
        <div className="bg-slate-900/60 p-4 border-b border-slate-855 flex items-center justify-between select-none shrink-0 gap-3">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-4.5 h-4.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">Run consoles</span>
          </div>

          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-850">
            <button
              onClick={() => setActiveOutputTab('playground')}
              className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded uppercase transition-all ${
                activeOutputTab === 'playground' 
                  ? 'bg-indigo-600 text-slate-950 font-bold' 
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Interactive sandbox
            </button>
            <button
              onClick={() => setActiveOutputTab('ci_cd')}
              className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded uppercase transition-all ${
                activeOutputTab === 'ci_cd' 
                  ? 'bg-indigo-600 text-slate-950 font-bold' 
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              CI/CD pytest
            </button>
          </div>
        </div>

        {/* INNER RENDER OF THE TWO OUTPUT CONSOLES */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          
          {/* LOGICAL VIEW 1: DYNAMIC SANDBOX PLATFORM EXECUTION (REAL RESULTS!) */}
          {activeOutputTab === 'playground' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              
              {/* IF ENVIRONMENT IS TYPESCRIPT UTILITY LIBRARY */}
              {workspaceName === 'ts_utils' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-855 text-slate-450 leading-relaxed text-[11px]">
                      <span className="text-emerald-400 font-bold uppercase block mb-1">REAL UTILS EVAL ENGINE</span>
                      This tool dynamically type-strips and evaluates files: <code className="text-slate-300">parser.ts</code>, <code className="text-slate-300">strings.ts</code>, and <code className="text-slate-300">index.ts</code> in real-time in your browser!
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Sample Input Data (Raw JSON)</label>
                      <textarea
                        value={tsTestInput}
                        onChange={(e) => setTsTestInput(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 rounded p-2 focus:border-indigo-500 outline-none text-xs text-slate-300 h-16 font-mono"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleRunTsExecutionPlayground}
                        disabled={isEvaluatingTs}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-550 border border-emerald-450 disabled:opacity-40 text-slate-950 font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-emerald-950/40"
                      >
                        {isEvaluatingTs ? (
                          <>
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                            Evaluating AST structures...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            Compile & Run Transformation Utility
                          </>
                        )}
                      </button>
                    </div>

                    {tsExecutionOutput && (
                      <div className="space-y-1 bg-slate-950 border border-slate-900 p-2.5 rounded font-mono text-[10.5px] leading-relaxed max-h-[160px] overflow-y-auto scrollbar-thin">
                        <span className="text-emerald-400 font-semibold block uppercase text-[8.5px] tracking-wider mb-1">Interpreter stdout:</span>
                        <pre className="text-slate-350 whitespace-pre-wrap">{tsExecutionOutput}</pre>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-900 pt-3 mt-3 text-[10px] font-mono text-slate-550 leading-tight select-none">
                    Edit capitalized rules or slugify expressions in strings.ts, then run this sandbox to see your algorithm execute live.
                  </div>
                </div>
              )}

              {/* IF ENVIRONMENT IS PYTHON REPS FASTAPI SERVERS */}
              {workspaceName === 'python_api' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
                    
                    {/* Server status switch block */}
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-855 text-xs flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">FastAPI Server Node</span>
                        <span className={`text-[11px] font-bold ${isPythonServerRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {isPythonServerRunning ? '● LIVE AT PORT 8000' : '○ SHUTDOWN / OFFLINE'}
                        </span>
                      </div>
                      <button
                        onClick={handleTogglePythonServer}
                        className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${
                          isPythonServerRunning 
                            ? 'bg-red-950/60 border border-red-900 text-red-300' 
                            : 'bg-emerald-600 border border-emerald-450 hover:bg-emerald-555 text-slate-950'
                        }`}
                      >
                        {isPythonServerRunning ? 'Shut down' : 'Run Server Playground'}
                      </button>
                    </div>

                    {/* Interactive API Requester sandbox */}
                    {isPythonServerRunning && (
                      <div className="space-y-3.5 border-t border-slate-900 pt-3">
                        <span className="text-[10px] text-slate-550 uppercase tracking-widest font-bold block select-none">Swagger Endpoint Client Mock</span>
                        
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-[11.5px]">
                          <button
                            onClick={() => handleTriggerSimulatedApiRequest('/', 'GET')}
                            className="bg-slate-950 border border-slate-850 hover:bg-slate-900/40 p-2 text-left rounded hover:border-slate-750 flex items-center justify-between"
                          >
                            <span className="text-emerald-450 font-bold">GET /</span>
                            <span className="text-[9px] opacity-60">root</span>
                          </button>
                          <button
                            onClick={() => handleTriggerSimulatedApiRequest('/health', 'GET')}
                            className="bg-slate-950 border border-slate-850 hover:bg-slate-900/40 p-2 text-left rounded hover:border-slate-750 flex items-center justify-between"
                          >
                            <span className="text-emerald-450 font-bold">GET /health</span>
                            <span className="text-[9px] opacity-60">status</span>
                          </button>
                          <button
                            onClick={() => handleTriggerSimulatedApiRequest('/items', 'GET')}
                            className="bg-slate-950 border border-slate-850 hover:bg-slate-900/40 p-2 text-left rounded hover:border-slate-750 flex items-center justify-between col-span-2"
                          >
                            <span className="text-emerald-450 font-bold">GET /items</span>
                            <span className="text-[9px] opacity-60">Fetch active database rows ({dbItems.length})</span>
                          </button>
                        </div>

                        {/* POST client helper */}
                        <form onSubmit={handlePostNewItemSimulator} className="p-2.5 bg-slate-950/70 border border-slate-855 rounded space-y-2">
                          <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wide">POST new SQL item</span>
                          <div className="space-y-1.5 text-[11px]">
                            <input
                              type="text"
                              required
                              placeholder="Item title..."
                              value={apiPostName}
                              onChange={(e) => setApiPostName(e.target.value)}
                              className="w-full bg-slate-955 border border-slate-850 rounded px-2 py-1 outline-none text-slate-300 font-mono"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Description..."
                                value={apiPostDesc}
                                onChange={(e) => setApiPostDesc(e.target.value)}
                                className="bg-slate-955 border border-slate-850 rounded px-2 py-1 outline-none text-slate-300 font-mono"
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Price..."
                                value={apiPostPrice}
                                onChange={(e) => setApiPostPrice(e.target.value)}
                                className="bg-slate-955 border border-slate-850 rounded px-2 py-1 outline-none text-slate-300 font-mono"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-1 bg-indigo-650 hover:bg-indigo-600 text-slate-950 text-xs font-bold rounded cursor-pointer transition-colors shadow"
                          >
                            Submit POST /items
                          </button>
                        </form>
                      </div>
                    )}

                    {/* API request print terminal log box */}
                    <div className="space-y-1 bg-slate-950 border border-slate-900 p-2.5 rounded font-mono text-[10px] leading-relaxed max-h-[150px] overflow-y-auto scrollbar-thin">
                      <span className="text-blue-400 font-semibold block uppercase text-[8.5px] tracking-wider mb-1">uvicorn api-server stdout:</span>
                      <pre className="text-slate-400 whitespace-pre-wrap">
                        {apiConsoleLogs.map((log, idx) => (
                          <div key={idx} className={log.includes('Response Code: 200') || log.includes('Response Code: 201') ? 'text-emerald-450' : log.includes('ValidationError') ? 'text-rose-400' : 'text-slate-400'}>{log}</div>
                        ))}
                      </pre>
                    </div>

                  </div>
                </div>
              )}

              {/* IF ENVIRONMENT IS PLATFORM FRONTEND (FORGE_PLATFORM) */}
              {workspaceName === 'forge_platform' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
                    <div className="bg-slate-905/60 p-2.5 rounded border border-slate-855 text-slate-450 leading-relaxed text-[11px]">
                      <span className="text-yellow-400 font-bold uppercase block mb-1">DUMMY PREVIEW PLAYGROUND</span>
                      This playground simulates the output interface of the <b>Forge Platform</b> React component bundle!
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg select-none space-y-2.5 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Simulated Render Output</span>
                      
                      <div className="py-4 px-3 bg-slate-900 border border-slate-800 rounded-md">
                        <h4 className="text-indigo-400 font-bold font-mono text-sm">ForgeAI Developer UI Instance</h4>
                        <div className="text-[10.5px] text-slate-400 mt-1">Status Code: verified API bindings.</div>
                        <div className="mt-3 flex justify-center gap-1.5">
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-400 text-[9.5px] rounded border border-blue-900">Python FastAPI: Online</span>
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[9.5px] rounded border border-emerald-900">AST parser: OK</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-3 mt-3 text-[10px] font-mono text-slate-550 select-none">
                    Dynamic compile components live inside local VM container environment.
                  </div>
                </div>
              )}

            </div>
          )}

          {/* LOGICAL VIEW 2: CI/CD PYTEST COMPILER TESTS */}
          {activeOutputTab === 'ci_cd' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="pb-2 flex items-center justify-between select-none">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Standard CI/CD pytest logs</span>
                <button
                  onClick={handleExecuteTests}
                  disabled={isRunningTest}
                  className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-40 text-emerald-450 hover:text-emerald-400 text-[10px] font-bold rounded border border-slate-800 transition-colors cursor-pointer"
                >
                  {isRunningTest ? 'Running...' : 'Execute Standard compiler checks'}
                </button>
              </div>

              <div className="flex-1 bg-slate-955 border border-slate-900 rounded p-3 font-mono text-[10.5px] text-slate-450 overflow-y-auto leading-relaxed scrollbar-thin">
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
          )}

        </div>

      </div>

        {/* EDITOR METRICS FOOTER ROW */}
        <div className="bg-slate-900 border-t border-slate-855 px-4 py-1.5 select-none shrink-0 flex items-center justify-between text-[10.5px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="text-indigo-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> 
              <span>Agent Mode: active</span>
            </span>
            <span className="hidden sm:inline border-l border-slate-800 pl-3">UTF-8</span>
            <span className="hidden md:inline border-l border-slate-800 pl-3">Tab Size: 2</span>
          </div>

          {activeFile && (
            <div className="flex items-center gap-3">
              <span className="truncate max-w-[200px]" title={activeFile.path}>Path: {activeFile.path}</span>
              <span className="border-l border-slate-805 pl-3 shrink-0">Lines: {activeFile.content?.split('\n').length || 0}</span>
              <span className="hidden sm:inline border-l border-slate-805 pl-3 shrink-0">Bytes: {activeFile.content?.length || 0}</span>
            </div>
          )}
        </div>

      </div>

      {/* 5. RIGHT SIDEBAR CHAT ASSISTANT COMPOSER COLLUSION PANELS */}
      <div className="w-full xl:w-72 flex flex-col h-[450px] xl:h-full bg-slate-900 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-855 animate-fade-in">
        <div className="p-4 border-b border-slate-855 select-none shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">Vibe Composer</span>
          </div>
          <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/40 py-0.5 px-2 rounded border border-emerald-900/30 uppercase font-semibold">Vibe mode</span>
        </div>

        <div className="flex-1 overflow-hidden p-4 flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            
            {/* Choose agent assistant profiles */}
            <div className="space-y-1 select-none">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Collaborative AI Agent</label>
              <select
                value={activeAgentId}
                onChange={(e) => onChangeActiveAgent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              >
                {agents.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.avatar} {ag.name}</option>
                ))}
              </select>
            </div>

            {/* Conversation list with the expert agent */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none font-sans text-xs">
              {composerMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-slate-850 text-slate-200 border border-slate-800' 
                      : msg.role === 'system'
                      ? 'bg-indigo-950/20 text-slate-400 text-center font-mono text-[10px] border border-indigo-950/40 pb-1.5 shadow'
                      : 'bg-slate-950/70 border border-slate-905 text-slate-300 shadow-sm'
                  }`}
                >
                  {msg.role !== 'system' && (
                    <span className="font-semibold text-[8.5px] uppercase font-mono tracking-wider text-slate-550 block mb-1">
                      {msg.role === 'user' ? 'Operator instructs' : 'Agent feedback'}
                    </span>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              
              {isComposerThinking && (
                <div className="bg-slate-950/80 p-3 italic text-indigo-400/80 rounded animate-pulse text-[11px] font-mono border border-indigo-950/25">
                  Analyzing target variables mapping, tracing caller boundaries & compiling differential proposal...
                </div>
              )}
            </div>

          </div>

          {/* Interactive instruction writing box */}
          <form onSubmit={handleComposerSubmit} className="border-t border-slate-800 pt-3 mt-4 shrink-0">
            <div className="bg-slate-950 rounded-lg p-1 text-slate-300 border border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={composerInput}
                disabled={isComposerThinking || !activeFile}
                onChange={(e) => setComposerInput(e.target.value)}
                placeholder={activeFile ? `Instruct agent to write or adapt code...` : "Open a code file to initialize Vibe mode."}
                className="flex-1 bg-transparent px-2 py-1 text-xs outline-none focus:ring-0 placeholder:text-slate-650 font-sans"
              />
              <button
                type="submit"
                disabled={isComposerThinking || !composerInput.trim() || !activeFile}
                className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 text-slate-950 rounded-md font-bold text-xs transition-colors cursor-pointer"
              >
                Refactor
              </button>
            </div>
            {!activeFile && (
              <span className="text-[9px] font-mono text-slate-600 block pl-1 mt-1 font-semibold select-none leading-tight">TIP: Click any file on the left to activate AI coding variables.</span>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}
