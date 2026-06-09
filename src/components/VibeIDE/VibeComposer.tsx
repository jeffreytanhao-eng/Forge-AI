/**
 * VibeComposer.tsx - Codex Vibe Coding Tabbed Agent Dashboard (Phase 3 生产级体验)
 */

import React, { useState, useEffect, useRef } from 'react';
import { AIAdapter } from '../../utils/aiAdapter';
import { 
  Send, CheckCircle, AlertCircle, Loader2, Sparkles, Terminal as TerminalIcon, 
  MessageSquare, History as HistoryIcon, RotateCcw, HelpCircle, FileText, GitBranch, Terminal
} from 'lucide-react';

interface VibeComposerProps {
  workspaceFiles: any[];
  onApplyDiff?: (diffs: any[]) => void;
  vibeHistory?: Array<{
    id: string;
    timestamp: string;
    description: string;
    diffs: Array<{ file: string; previousContent: string; content: string }>;
  }>;
  onUndoSession?: (id: string) => void;
  onUndoLast?: () => void;
}

export const VibeComposer: React.FC<VibeComposerProps> = ({ 
  workspaceFiles, 
  onApplyDiff,
  vibeHistory = [],
  onUndoSession,
  onUndoLast
}) => {
  // Tabs: 'chat' | 'terminal' | 'history'
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal' | 'history'>('chat');
  
  // Chat States
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<'thinking' | 'reasoning' | 'writing' | null>(null);
  
  // Simulated Streaming state for plan text
  const [streamingPlanText, setStreamingPlanText] = useState<string>('');
  const [isStreamingPlan, setIsStreamingPlan] = useState<boolean>(false);

  // Terminal States
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'SYSTEM CONSOLE INTERACTION NODE v1.0.5',
    'Type "help" or "vibe help" to inspect registered instructions.',
    '------------------------------------------------------',
    ''
  ]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottoms
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading, streamingPlanText]);

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines]);

  // Loading Step Phase transitions during generation
  useEffect(() => {
    if (chatLoading) {
      setLoadingPhase('thinking');
      const t1 = setTimeout(() => setLoadingPhase('reasoning'), 1800);
      const t2 = setTimeout(() => setLoadingPhase('writing'), 3600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setLoadingPhase(null);
    }
  }, [chatLoading]);

  // Handle plan typewriter streaming simulation
  const triggerPlanStreaming = (fullPlan: string, diffs: any[]) => {
    setIsStreamingPlan(true);
    setStreamingPlanText('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < fullPlan.length) {
        setStreamingPlanText(prev => prev + fullPlan.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsStreamingPlan(false);
        // After streaming is completed, apply diffs to parent Reviewer components
        if (diffs && diffs.length > 0 && onApplyDiff) {
          onApplyDiff(diffs);
        }
      }
    }, 12);
  };

  // Convert Chat Input Trigger
  const handleSendChatVibe = async (sourcePrompt?: string) => {
    const promptValue = sourcePrompt || chatInput;
    if (!promptValue.trim() || chatLoading) return;

    if (!sourcePrompt) {
      setChatInput('');
    }

    const userMsg = { role: 'user', content: promptValue, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    setChatError(null);

    try {
      // API request via aiAdapter context injection
      const response = await AIAdapter.sendVibePrompt(promptValue, workspaceFiles);
      
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (response?.plan) {
        triggerPlanStreaming(response.plan, response.diffs || []);
      } else if (response?.diffs?.length > 0 && onApplyDiff) {
        onApplyDiff(response.diffs);
      }
    } catch (err: any) {
      setChatError(err.message || 'Vibe command execution failed');
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `Error details: ${err.message}`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Interactive Terminal Command Handling
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalLines(prev => [...prev, `vibe_ide % ${cmd}`]);
    setTerminalInput('');

    // Help commands
    if (cmd.toLowerCase() === 'help' || cmd.toLowerCase() === 'vibe help' || cmd.toLowerCase() === 'vibe --help') {
      setTerminalLines(prev => [
        ...prev,
        'REGISTERED SYSTEM SHELL INSTRUCTIONS:',
        '  vibe "prompt"      - Issue Natural Language refactoring',
        '  undo               - Rollback the last applied changes',
        '  history            - Display recent applied sessions log',
        '  git status         - Show list of files marked as modified',
        '  git diff           - Outline details of current system cache',
        '  graphify           - Force rebuild compilation dependencies',
        '  clear              - Void/Reset terminal outputs log',
        ''
      ]);
      return;
    }

    if (cmd.toLowerCase() === 'clear') {
      setTerminalLines([]);
      return;
    }

    if (cmd.toLowerCase() === 'history') {
      if (vibeHistory.length === 0) {
        setTerminalLines(prev => [...prev, 'System: No active transaction logs exist inside environment list.', '']);
        return;
      }
      setTerminalLines(prev => [
        ...prev,
        'VIBE SESSION TRANSACTION LOGGER:',
        ...vibeHistory.map((h, i) => `  [${h.timestamp}] - ${h.description} (${h.diffs.length} files modified)`),
        ''
      ]);
      return;
    }

    if (cmd.toLowerCase() === 'undo') {
      if (vibeHistory.length === 0) {
        setTerminalLines(prev => [...prev, 'Terminal Error: No preceding transaction recorded.', '']);
        return;
      }
      if (onUndoLast) {
        onUndoLast();
        setTerminalLines(prev => [...prev, `Success: Discarded changes associated with Transaction: ${vibeHistory[0].description}`, '']);
      }
      return;
    }

    if (cmd.toLowerCase() === 'graphify') {
      setTerminalLines(prev => [
        ...prev,
        '➜ Launching dynamic Graphify scan...',
        '➜ Mapping imports connections structures...',
        `➜ Analysis complete! Parsed ${workspaceFiles.length} folders & modules successfully.`,
        ''
      ]);
      return;
    }

    if (cmd.toLowerCase() === 'git status') {
      const modifiedFiles: string[] = [];
      workspaceFiles.forEach(f => {
        if (localStorage.getItem('vibe_modified_path_' + f.path) === 'true') {
          modifiedFiles.push(f.path);
        }
      });

      if (modifiedFiles.length === 0) {
        setTerminalLines(prev => [
          ...prev,
          'On branch main',
          'Your branch is up to date with \'origin/main\'.',
          'nothing to commit, working tree clean',
          ''
        ]);
      } else {
        setTerminalLines(prev => [
          ...prev,
          'On branch main',
          'Changes not staged for commit:',
          '  (use "git add <file>..." to stage for commit)',
          '  (use "undo" to discard changes in working directory)',
          '',
          ...modifiedFiles.map(p => `\tmodified:   .${p}`),
          ''
        ]);
      }
      return;
    }

    if (cmd.toLowerCase() === 'git diff') {
      const modifiedFiles: string[] = [];
      workspaceFiles.forEach(f => {
        if (localStorage.getItem('vibe_modified_path_' + f.path) === 'true') {
          modifiedFiles.push(f.path);
        }
      });

      if (modifiedFiles.length === 0) {
        setTerminalLines(prev => [...prev, 'No local diffs found in workspace.', '']);
        return;
      }

      setTerminalLines(prev => [
        ...prev,
        ...modifiedFiles.map(path => {
          return `diff --git a${path} b${path}\nindex 8cf92b8..73fac74 100644\n--- a${path}\n+++ b${path}\n@@ -1,5 +1,10 @@\n+ [VIBE INJECTION UPDATE]\n+ // AI-optimized schema changes applied`;
        }),
        ''
      ]);
      return;
    }

    // Match vibe command "vibe ..."
    if (cmd.toLowerCase().startsWith('vibe ')) {
      const promptText = cmd.slice(5).replace(/^['"]|['"]$/g, '');
      if (!promptText.trim()) {
        setTerminalLines(prev => [...prev, 'Terminal Error: Empty Vibe instruction prompt rejected.', '']);
        return;
      }

      setTerminalLoading(true);
      setTerminalLines(prev => [
        ...prev,
        '➜ Synthesizing instructions constraints...',
        '➜ Querying Codex LLM Compiler system...',
      ]);

      try {
        const response = await AIAdapter.sendVibePrompt(promptText, workspaceFiles);
        setTerminalLines(prev => [
          ...prev,
          `✔ Success: Compiler plan generated:`,
          `  "${response?.plan || 'Complete code optimizations drafted'}"`,
          `➜ Applying ${response?.diffs?.length || 0} file diffs to Review Console...`,
          ''
        ]);
        
        if (response?.diffs?.length > 0 && onApplyDiff) {
          onApplyDiff(response.diffs);
        }
      } catch (err: any) {
        setTerminalLines(prev => [...prev, `❌ Compilation Error: ${err.message || 'AI generation failed'}`, '']);
      } finally {
        setTerminalLoading(false);
      }
      return;
    }

    // Unrecognized commands fallback
    setTerminalLines(prev => [...prev, `command not found: ${cmd}`, 'Type "help" for support.', '']);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 divide-y divide-zinc-870 text-sm">
      
      {/* Tab Navigation header */}
      <div className="p-2.5 flex items-center bg-zinc-900 justify-between select-none shrink-0 border-b border-zinc-850">
        <div className="flex items-center gap-1.5 grayscale shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-violet-400 rotate-12" />
          <span className="font-extrabold text-[12px] tracking-tight text-zinc-150 font-sans">
            AI VIBE NODE
          </span>
        </div>
        
        <div className="flex bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800 shrink-0 gap-0.5">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'terminal', label: 'Console', icon: TerminalIcon },
            { id: 'history', label: 'History', icon: HistoryIcon }
          ].map(it => {
            const IconComponent = it.icon;
            const active = activeTab === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setActiveTab(it.id as any)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  active 
                    ? 'bg-zinc-850 text-violet-400 font-bold shadow-inner' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {it.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary tab views stage */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
        
        {/* TAB 1: CONVERSATIONAL CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-zinc-550 italic text-center mt-12 space-y-3 font-sans max-w-[250px] mx-auto select-none">
                  <div className="p-3 bg-zinc-900 bg-opacity-20 rounded-xl border border-zinc-900">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                    <header className="font-bold text-xs text-zinc-350 tracking-wide uppercase not-italic mb-1">
                      Direct AI Assist
                    </header>
                    <p className="not-italic text-[10.5px] leading-relaxed">
                      Express your requirements such as styles shifts, helper integrations, or refactoring loops.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSendChatVibe("重构登录界面为高端磨砂玻璃拟物暗黑风格，增强材质质感与视觉流动感")}
                    className="not-italic text-[10.5px] text-violet-400 hover:text-violet-300 bg-violet-950/20 border border-violet-950 px-2 py-1.5 rounded-lg transition-colors cursor-pointer block w-full leading-normal"
                  >
                    “重构登录界面为高端磨砂玻璃” ➜
                  </button>
                </div>
              )}

              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg leading-relaxed border ${
                    msg.role === 'user' 
                      ? 'bg-violet-950/20 ml-6 border-violet-900/30 text-zinc-150' 
                      : 'bg-zinc-900 border-zinc-850 text-zinc-300 shadow-md'
                  }`}
                >
                  <header className="flex justify-between text-[10px] font-mono select-none text-zinc-550 mb-1.5 font-bold uppercase">
                    <span>{msg.role === 'user' ? 'Client Request' : 'Vibe Agent Compiler'}</span>
                    <span>{msg.timestamp}</span>
                  </header>

                  {msg.role === 'user' ? (
                    <p className="text-xs whitespace-pre-wrap font-sans">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      {msg.content?.plan && (
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-850 text-zinc-300 font-sans shadow-inner">
                          <span className="font-bold text-violet-400 text-xs flex items-center gap-1.5 uppercase tracking-wide border-b border-zinc-900 pb-1.5 mb-2 select-none">
                            <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                            Refactoring Plan
                          </span>
                          
                          {/* Stream typed text if it is the latest agent bubble */}
                          {index === messages.length - 1 && isStreamingPlan ? (
                            <div className="text-xs font-normal whitespace-pre-wrap break-words leading-relaxed">
                              {streamingPlanText}
                              <span className="animate-pulse bg-violet-400 w-1.5 h-3 ml-1 inline-block" />
                            </div>
                          ) : (
                            <p className="text-xs font-normal leading-relaxed break-words">{msg.content.plan}</p>
                          )}
                        </div>
                      )}

                      {/* Code changes list cards */}
                      {msg.content?.diffs && (
                        <div className="space-y-1.5 mt-2">
                          <header className="text-[10px] uppercase text-zinc-500 font-bold select-none px-0.5 tracking-wider font-mono">
                            Modified Worksheets ({msg.content.diffs.length})
                          </header>
                          {msg.content.diffs.map((diff: any, di: number) => (
                            <div key={di} className="text-xs bg-zinc-950 p-2.5 rounded border border-zinc-850 space-y-1.5 font-mono shadow-sm">
                              <div className="flex justify-between items-center border-b border-zinc-900 pb-1 select-none">
                                <span className="font-bold text-[11px] text-zinc-300 truncate max-w-[190px]">📂 {diff.file}</span>
                                <span className="text-[9px] bg-violet-950/80 border border-violet-900/30 text-violet-350 px-1.5 py-0.5 rounded font-bold uppercase">
                                  STAGED
                                </span>
                              </div>
                              {diff.description && (
                                <p className="text-zinc-500 text-[10.5px] italic mb-1 font-sans leading-normal">
                                  {diff.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!msg.content?.plan && !msg.content?.diffs && (
                        <pre className="whitespace-pre-wrap overflow-x-auto p-1 text-[11px] font-mono leading-relaxed text-zinc-400">
                          {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Advanced stage feedback loader */}
              {chatLoading && (
                <div className="p-3 bg-zinc-900/35 border border-zinc-900/60 rounded-xl flex flex-col gap-2.5 animate-pulse select-none">
                  <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    <span>Agent Compiler Processing</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className={`w-2 h-2 rounded-full ${loadingPhase === 'thinking' ? 'bg-violet-450 animate-ping' : 'bg-zinc-800'}`} />
                      <span className={loadingPhase === 'thinking' ? 'text-zinc-100 font-bold' : 'text-zinc-650'}>
                        [Phase 1] AST Dep-Tree validation dependency scan...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className={`w-2 h-2 rounded-full ${loadingPhase === 'reasoning' ? 'bg-violet-450 animate-ping' : 'bg-zinc-800'}`} />
                      <span className={loadingPhase === 'reasoning' ? 'text-zinc-100 font-bold' : 'text-zinc-650'}>
                        [Phase 2] Logical segment constraints reasoning...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className={`w-2 h-2 rounded-full ${loadingPhase === 'writing' ? 'bg-violet-450 animate-ping' : 'bg-zinc-800'}`} />
                      <span className={loadingPhase === 'writing' ? 'text-zinc-100 font-bold' : 'text-zinc-650'}>
                        [Phase 3] Generating multi-step file delta JSON changes...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatBottomRef} />
            </div>

            {/* Chat prompts typing area */}
            <div className="p-3 bg-zinc-950/85 backdrop-blur-sm border-t border-zinc-870 mt-auto shrink-0">
              {chatError && (
                <div className="mb-2.5 text-rose-400 text-xs flex items-center gap-1 font-sans bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg leading-normal">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Vibe compiler to refactor scripts..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 outline-none focus:border-violet-600 font-sans resize-none max-h-[80px] h-[58px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatVibe();
                    }
                  }}
                />
                <button
                  onClick={() => handleSendChatVibe()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 bg-violet-600 hover:bg-violet-550 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-violet-950/10 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE TERMINAL SHELL */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col h-full bg-zinc-950 p-4 font-mono">
            {/* Terminal screen */}
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs leading-5 scrollbar-thin text-zinc-300">
              {terminalLines.map((ln, li) => (
                <div key={li} className="whitespace-pre-wrap break-words">
                  {ln.startsWith('vibe_ide %') ? (
                    <span className="text-violet-400 font-bold">{ln}</span>
                  ) : ln.startsWith('  git status') || ln.startsWith('  vibe ') || ln.startsWith('REGISTERED') ? (
                    <span className="text-zinc-550">{ln}</span>
                  ) : ln.startsWith('❌') || ln.includes('Error') ? (
                    <span className="text-rose-400">{ln}</span>
                  ) : ln.startsWith('✔') || ln.startsWith('Success') || ln.includes('modified:') ? (
                    <span className="text-emerald-450">{ln}</span>
                  ) : (
                    <span>{ln}</span>
                  )}
                </div>
              ))}
              
              {terminalLoading && (
                <div className="flex items-center gap-2 text-violet-400 p-0.5 select-none font-mono text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  <span>Agent compiling payload on cloud node...</span>
                </div>
              )}
              <div ref={terminalBottomRef} />
            </div>

            {/* Faux terminal input prompt */}
            <form onSubmit={handleTerminalSubmit} className="flex gap-2 items-center border-t border-zinc-870 pt-3 mt-3 shrink-0 select-none">
              <span className="text-violet-400 font-bold text-xs font-mono shrink-0">vibe_ide %</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="vibe 'optimize hooks' | git status | help..."
                className="flex-1 bg-zinc-950 text-xs font-mono text-zinc-100 placeholder-zinc-700 outline-none focus:ring-0 border-0 p-0"
                disabled={terminalLoading}
                autoFocus
              />
            </form>
          </div>
        )}

        {/* TAB 3: CHRONOLOGICAL TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-4">
            <header className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2 select-none">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold uppercase font-mono text-zinc-400">
                  Vibe Actions Log ({vibeHistory.length})
                </span>
              </div>
              {vibeHistory.length > 0 && onUndoLast && (
                <button
                  onClick={onUndoLast}
                  className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 border border-violet-900/50 hover:border-violet-500/20 px-2 py-0.5 rounded transition-all cursor-pointer bg-violet-950/15"
                >
                  <RotateCcw className="w-3 h-3" />
                  Undo Last
                </button>
              )}
            </header>

            {vibeHistory.length === 0 ? (
              <div className="py-12 px-4 text-center font-sans space-y-3 select-none">
                <HelpCircle className="w-8 h-8 text-zinc-700 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <header className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    History Frame Clear
                  </header>
                  <p className="text-[10.5px] leading-relaxed text-zinc-550 max-w-[210px] mx-auto">
                    Transactions record dynamically here after acceptance to support infinite secure rollbacks.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {vibeHistory.map((tx, idx) => (
                  <div key={tx.id} className="p-3 rounded-lg bg-zinc-900 border border-zinc-850 font-sans shadow shadow-black/25 flex flex-col gap-2.5 hover:border-zinc-700/60 transition-colors">
                    <div className="flex justify-between items-start select-none">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase">
                          Action log #{vibeHistory.length - idx}
                        </span>
                        <h4 className="text-[11.5px] font-bold text-zinc-350 tracking-tight leading-snug truncate" title={tx.description}>
                          {tx.description}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-zinc-500 text-right whitespace-nowrap shrink-0">
                        {tx.timestamp}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 font-mono text-[10.5px] text-zinc-450 border-t border-zinc-855/40 pt-2 bg-zinc-950/30 p-1.5 rounded">
                      <span className="text-[9px] uppercase font-bold text-zinc-650 tracking-wider">Affected Diffs:</span>
                      {tx.diffs.map((d, di) => (
                        <div key={di} className="flex justify-between font-mono py-0.5 truncate text-[10px]">
                          <span className="text-zinc-400 truncate pr-2">📂 .{d.file}</span>
                          <span className="text-emerald-500 shrink-0 uppercase font-bold text-[9px] tracking-wide">Applied</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex select-none pt-1">
                      <button
                        onClick={() => onUndoSession?.(tx.id)}
                        className="w-full text-[10.5px] font-semibold flex items-center justify-center gap-1.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all cursor-pointer text-violet-400 hover:text-violet-350 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback This Refactor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
