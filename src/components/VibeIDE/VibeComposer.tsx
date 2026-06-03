import React, { useState } from 'react';
import { AIAdapter } from '../../utils/aiAdapter';
import { Send, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface VibeComposerProps {
  workspaceFiles: any[];
  onApplyDiff?: (diffs: any[]) => void;   // 接收父组件的 Apply 处理函数
}

export const VibeComposer: React.FC<VibeComposerProps> = ({ workspaceFiles, onApplyDiff }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendVibe = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const aiResponse = await AIAdapter.sendVibePrompt(input, workspaceFiles);
      
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // 如果有 diffs，自动触发预览
      if (aiResponse?.diffs?.length > 0 && onApplyDiff) {
        onApplyDiff(aiResponse.diffs);
      }
    } catch (err: any) {
      setError(err.message || 'Vibe 执行失败');
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `错误: ${err.message}`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <span className="font-medium text-zinc-200">Codex Vibe Agent</span>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
        {messages.length === 0 && (
          <div className="text-zinc-500 italic text-center mt-8 space-y-2">
            <div>输入你的开发需求，例如：</div>
            <div className="text-violet-400 not-italic">“将登录页面改为现代玻璃拟物暗黑风格”</div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-violet-900/30 ml-6 border border-violet-800/20' : 'bg-zinc-900 border border-zinc-800'}`}>
            <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
              <span>{msg.role === 'user' ? 'You' : 'Agent'}</span>
              <span>{msg.timestamp}</span>
            </div>
            {msg.role === 'user' ? (
              <p className="text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <div className="space-y-3">
                {msg.content?.plan && (
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 text-zinc-300">
                    <span className="font-semibold text-violet-400 block mb-1">📋 计划:</span>
                    <p className="text-xs">{msg.content.plan}</p>
                  </div>
                )}
                {msg.content?.diffs && msg.content.diffs.map((diff: any, di: number) => (
                  <div key={di} className="text-xs bg-zinc-950 p-2 rounded border border-zinc-850 space-y-1 font-mono">
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-bold border-b border-zinc-850 pb-1">
                      <span>📂 {diff.file}</span>
                      <span className="text-[10px] bg-violet-950 text-violet-300 px-1.5 py-0.5 rounded font-mono">MODIFIED</span>
                    </div>
                    {diff.description && <p className="text-zinc-550 italic text-[11px] my-1">{diff.description}</p>}
                    <pre className="p-1 bg-zinc-90 w-full overflow-hidden truncate text-[10px] text-zinc-500">
                      {diff.content ? diff.content.split('\n').slice(0, 3).join('\n') + '\n...' : ''}
                    </pre>
                  </div>
                ))}
                {!msg.content?.plan && !msg.content?.diffs && (
                  <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-zinc-300 text-xs font-mono">
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-violet-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            Agent 正在思考并生成代码...
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-zinc-800">
        {error && (
          <div className="mb-3 text-red-400 text-xs flex items-center gap-1 font-mono">
            <AlertCircle className="w-4 h-4 text-red-400" /> {error}
          </div>
        )}
        
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你的 Vibe 需求..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 outline-none focus:border-violet-500 font-sans resize-y min-h-[80px] max-h-[160px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendVibe();
              }
            }}
          />
          <button
            onClick={sendVibe}
            disabled={loading || !input.trim()}
            className="px-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
