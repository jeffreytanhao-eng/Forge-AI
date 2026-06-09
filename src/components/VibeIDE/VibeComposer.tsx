import React, { useState } from 'react';
import { Send, Loader2, Sparkles, MessageSquare, Terminal as TerminalIcon, History as HistoryIcon, RotateCcw } from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { VibeDiffPreview } from './VibeDiffPreview';
import { useAgentStore } from '../../stores/useAgentStore';
import { AgentContext } from '../../types/agent';

interface VibeComposerProps {
  workspaceFiles: any[];
  onApplyDiff: (diffs: any[]) => void;
  vibeHistory?: any[];
  onUndoSession?: (id: string) => void;
  onUndoLast?: () => void;
  currentFile?: any;
  knowledgeGraph?: any;
  skills?: any[];
}

interface DiffItem {
  file: string;
  content: string;
  description?: string;
}

export const VibeComposer: React.FC<VibeComposerProps> = ({
  workspaceFiles,
  onApplyDiff,
  vibeHistory = [],
  onUndoSession,
  onUndoLast,
  currentFile,
  knowledgeGraph,
  skills
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal' | 'history'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingPlan, setStreamingPlan] = useState('');
  const [pendingDiffs, setPendingDiffs] = useState<DiffItem[]>([]);

  const [terminalOutput, setTerminalOutput] = useState<any[]>([
    { type: 'system', content: 'vibe_ide % Type "help" for commands' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  const { currentAgent } = useAgentStore();

  // ==================== 真实流式发送 ====================
  const sendVibe = async () => {
    if (!input.trim() || loading || !currentAgent) return;

    const userMsg = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamingPlan('');
    setPendingDiffs([]);

    try {
      const context: AgentContext = {
        workspaceFiles,
        currentFile,
        knowledgeGraph,
        skills
      };

      // 优先使用流式（Claude 支持）
      if (currentAgent.supportsStreaming && 'sendPromptStream' in currentAgent) {
        let finalResult: any = null;

        for await (const chunk of (currentAgent as any).sendPromptStream(input, context)) {
          if (chunk.type === 'delta') {
            setStreamingPlan(chunk.fullText);
          }
          if (chunk.type === 'done') {
            finalResult = chunk.result;
          }
          if (chunk.type === 'error') {
            setMessages(prev => [...prev, {
              role: 'system',
              content: `Error: ${chunk.error}`,
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        }

        if (finalResult) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: finalResult,
            timestamp: new Date().toLocaleTimeString(),
            agent: currentAgent.name
          }]);
          if (finalResult.diffs?.length) {
            setPendingDiffs(finalResult.diffs);
          }
        }
      } else {
        // 普通 Agent（Vibe 等）
        const result = await currentAgent.sendPrompt(input, context);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result,
          timestamp: new Date().toLocaleTimeString(),
          agent: currentAgent.name
        }]);
        if (result.diffs?.length) {
          setPendingDiffs(result.diffs);
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
      setStreamingPlan('');
    }
  };

  // ==================== Diff Preview handlers ====================
  const handleAcceptDiff = (diff: DiffItem) => {
    onApplyDiff([diff]);
    setPendingDiffs(prev => prev.filter(d => d.file !== diff.file));
  };

  const handleRejectDiff = (diff: DiffItem) => {
    setPendingDiffs(prev => prev.filter(d => d.file !== diff.file));
  };

  const handleAcceptAll = () => {
    if (pendingDiffs.length > 0) {
      onApplyDiff(pendingDiffs);
    }
    setPendingDiffs([]);
  };

  const handleRejectAll = () => {
    setPendingDiffs([]);
  };

  // ==================== Terminal 命令处理 ====================
  const handleTerminalSubmit = async () => {
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalOutput(prev => [...prev, { type: 'command', content: `vibe_ide % ${cmd}` }]);
    setTerminalInput('');

    if (cmd === 'help') {
      setTerminalOutput(prev => [...prev, { type: 'info', content: 'Available: vibe "<prompt>", undo, history, clear, graphify' }]);
    } else if (cmd.startsWith('vibe ')) {
      const prompt = cmd.replace('vibe ', '');
      if (currentAgent) {
        const context: AgentContext = {
          workspaceFiles,
          currentFile,
          knowledgeGraph,
          skills
        };
        const result = await currentAgent.sendPrompt(prompt, context);
        if (result.diffs?.length) {
          setPendingDiffs(result.diffs);
        }
        setTerminalOutput(prev => [...prev, { type: 'success', content: `Executed with ${currentAgent.name}` }]);
      }
    } else if (cmd === 'undo' && onUndoLast) {
      onUndoLast();
      setTerminalOutput(prev => [...prev, { type: 'success', content: 'Last change undone' }]);
    } else if (cmd === 'clear') {
      setTerminalOutput([{ type: 'system', content: 'Terminal cleared' }]);
    } else {
      setTerminalOutput(prev => [...prev, { type: 'error', content: `Unknown command: ${cmd}` }]);
    }
  };

  // ==================== 渲染 ====================
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      {/* Agent 切换器 + 头部 */}
      <AgentSelector />

      <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <span className="font-medium">Vibe Coding</span>
        {currentAgent && (
          <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-violet-400">
            · {currentAgent.name}
          </span>
        )}
      </div>

      {/* Tab 导航 */}
      <div className="flex border-b border-zinc-800">
        {[
          { key: 'chat', label: 'Chat', icon: MessageSquare },
          { key: 'terminal', label: 'Terminal', icon: TerminalIcon },
          { key: 'history', label: 'History', icon: HistoryIcon },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-violet-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
              {/* Diff Preview */}
              <VibeDiffPreview
                diffs={pendingDiffs}
                onAccept={handleAcceptDiff}
                onReject={handleRejectDiff}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                onClose={() => setPendingDiffs([])}
              />

              {messages.length === 0 && pendingDiffs.length === 0 && (
                <div className="text-center text-zinc-500 mt-8">
                  输入需求开始 Vibe Coding<br />
                  当前使用：{currentAgent?.name || '未选择 Agent'}
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-violet-900/30 ml-8' : 'bg-zinc-900'}`}>
                  <div className="text-xs text-zinc-500 mb-1 flex justify-between">
                    <span>{msg.role === 'user' ? 'You' : msg.agent || 'Agent'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(msg.content, null, 2)}</pre>
                </div>
              ))}

              {/* 真实流式显示区域 */}
              {streamingPlan && (
                <div className="mb-4 p-3 bg-zinc-900 rounded">
                  <div className="text-xs text-violet-400 mb-1">Claude 正在思考...</div>
                  <pre className="whitespace-pre-wrap text-sm">{streamingPlan}</pre>
                </div>
              )}

              {loading && !streamingPlan && (
                <div className="flex items-center gap-2 text-violet-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> 处理中...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="描述你的开发需求..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-3 text-sm resize-y min-h-[60px]"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendVibe())}
                />
                <button
                  onClick={sendVibe}
                  disabled={loading || !input.trim() || !currentAgent}
                  className="px-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded flex items-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Terminal Tab */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col bg-black font-mono text-sm p-3 overflow-auto">
            {terminalOutput.map((line, i) => (
              <div key={i} className={
                line.type === 'error' ? 'text-red-400' :
                line.type === 'success' ? 'text-emerald-400' : 'text-zinc-300'
              }>
                {line.content}
              </div>
            ))}
            <div className="flex items-center mt-2">
              <span className="text-emerald-400">vibe_ide %</span>
              <input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTerminalSubmit()}
                className="flex-1 bg-transparent outline-none ml-2 text-white"
                placeholder="输入命令..."
              />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-zinc-400">变更历史（最近 {vibeHistory.length} 条）</span>
              {onUndoLast && (
                <button onClick={onUndoLast} className="flex items-center gap-1 text-xs px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700">
                  <RotateCcw className="w-3 h-3" /> Undo Last
                </button>
              )}
            </div>
            {vibeHistory.length === 0 ? (
              <div className="text-center text-zinc-500 mt-12">暂无历史记录</div>
            ) : (
              vibeHistory.map((item, index) => (
                <div key={index} className="mb-3 p-3 bg-zinc-900 rounded text-sm">
                  <div className="flex justify-between">
                    <span>{item.description}</span>
                    {onUndoSession && (
                      <button onClick={() => onUndoSession(item.id)} className="text-xs text-red-400 hover:underline">
                        回滚
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
