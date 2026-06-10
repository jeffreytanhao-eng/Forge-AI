import React, { useState } from 'react';
import {
  Send, Loader2, Sparkles, MessageSquare, Terminal as TerminalIcon,
  History as HistoryIcon, RotateCcw, CheckCheck, XCircle
} from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { useAgentStore } from '../../stores/useAgentStore';
import { VibeDiffPreview } from './VibeDiffPreview';

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

export const VibeComposer: React.FC<VibeComposerProps> = ({
  workspaceFiles,
  onApplyDiff,
  vibeHistory = [],
  onUndoSession,
  onUndoLast,
  currentFile,
  knowledgeGraph,
  skills,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal' | 'history'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingPlan, setStreamingPlan] = useState('');
  const [pendingDiffs, setPendingDiffs] = useState<any[]>([]);

  const { currentAgent } = useAgentStore();

  // ==================== 发送 Vibe（支持流式 + Diff 预览） ====================
  const sendVibe = async () => {
    if (!input.trim() || loading || !currentAgent) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingPlan('');

    try {
      const context = { workspaceFiles, currentFile, knowledgeGraph, skills };

      let finalResult: any = null;

      // 真实流式（Claude）
      if (currentAgent.supportsStreaming && 'sendPromptStream' in currentAgent) {
        for await (const chunk of (currentAgent as any).sendPromptStream(input, context)) {
          if (chunk.type === 'delta') {
            setStreamingPlan(chunk.fullText);
          }
          if (chunk.type === 'done') {
            finalResult = chunk.result;
          }
          if (chunk.type === 'error') {
            throw new Error(chunk.error);
          }
        }
      } else {
        // 普通 Agent
        finalResult = await currentAgent.sendPrompt(input, context);
      }

      if (finalResult) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: finalResult,
          timestamp: new Date().toLocaleTimeString(),
          agent: currentAgent.name
        }]);

        // 有 diffs 时先进入预览模式，而不是直接应用
        if (finalResult.diffs && finalResult.diffs.length > 0) {
          setPendingDiffs(finalResult.diffs);
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

  // ==================== Diff 预览操作 ====================
  const handleAcceptDiff = (diff: any) => {
    onApplyDiff([diff]);
    setPendingDiffs(prev => prev.filter(d => d.file !== diff.file));
  };

  const handleRejectDiff = (diff: any) => {
    setPendingDiffs(prev => prev.filter(d => d.file !== diff.file));
  };

  const handleAcceptAll = () => {
    if (pendingDiffs.length > 0) {
      onApplyDiff(pendingDiffs);
      setPendingDiffs([]);
    }
  };

  const handleRejectAll = () => {
    setPendingDiffs([]);
  };

  // ==================== Terminal 命令（简化版） ====================
  const [terminalOutput, setTerminalOutput] = useState<any[]>([
    { type: 'system', content: 'vibe_ide % Type "help" for available commands' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalSubmit = async () => {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalOutput(prev => [...prev, { type: 'command', content: `vibe_ide % ${cmd}` }]);
    setTerminalInput('');

    if (cmd.startsWith('vibe ')) {
      const prompt = cmd.replace('vibe ', '');
      if (currentAgent) {
        const result = await currentAgent.sendPrompt(prompt, { workspaceFiles, currentFile, knowledgeGraph, skills });
        if (result.diffs?.length) {
          setPendingDiffs(result.diffs);
        }
      }
    } else if (cmd === 'undo' && onUndoLast) {
      onUndoLast();
    } else if (cmd === 'clear') {
      setTerminalOutput([{ type: 'system', content: 'Terminal cleared' }]);
    }
  };

  // ==================== 渲染 ====================
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      <AgentSelector />

      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="font-medium">Vibe Coding</span>
          {currentAgent && (
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-violet-400">
              {currentAgent.name}
            </span>
          )}
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="flex border-b border-zinc-800 text-sm">
        {[
          { key: 'chat', label: 'Chat', icon: MessageSquare },
          { key: 'terminal', label: 'Terminal', icon: TerminalIcon },
          { key: 'history', label: 'History', icon: HistoryIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 border-b-2 transition-colors ${
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

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
              {messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-violet-900/30 ml-8' : 'bg-zinc-900'}`}>
                  <div className="text-xs text-zinc-500 mb-1 flex justify-between">
                    <span>{msg.role === 'user' ? 'You' : msg.agent || 'Agent'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(msg.content, null, 2)}</pre>
                </div>
              ))}

              {/* 流式显示 */}
              {streamingPlan && (
                <div className="p-3 bg-zinc-900 rounded">
                  <div className="text-xs text-violet-400 mb-1">正在生成计划...</div>
                  <pre className="whitespace-pre-wrap text-sm">{streamingPlan}</pre>
                </div>
              )}

              {loading && !streamingPlan && (
                <div className="flex items-center gap-2 text-violet-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Agent 正在思考...
                </div>
              )}
            </div>

            {/* Diff 预览面板 */}
            {pendingDiffs.length > 0 && (
              <div className="px-4 pb-2">
                <VibeDiffPreview
                  diffs={pendingDiffs}
                  onAccept={handleAcceptDiff}
                  onReject={handleRejectDiff}
                  onAcceptAll={handleAcceptAll}
                  onRejectAll={handleRejectAll}
                />
              </div>
            )}

            {/* 输入框 */}
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
                  className="px-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded flex items-center"
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
            <div className="flex justify-between mb-3">
              <span className="text-sm text-zinc-400">变更历史</span>
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
                <div key={index} className="mb-3 p-3 bg-zinc-900 rounded text-sm flex justify-between">
                  <span>{item.description}</span>
                  {onUndoSession && (
                    <button onClick={() => onUndoSession(item.id)} className="text-xs text-red-400 hover:underline">
                      回滚
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
