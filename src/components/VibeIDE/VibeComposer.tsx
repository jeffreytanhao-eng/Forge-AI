import React, { useState } from 'react';
import { AIAdapter } from '../../utils/aiAdapter';

export const VibeComposer: React.FC<{ workspaceFiles: any[] }> = ({ workspaceFiles }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);

    const result = await AIAdapter.sendVibePrompt(input, workspaceFiles);
    
    setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-700">
      <div className="p-4 border-b border-zinc-800 font-medium">Codex Vibe Agent</div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-violet-900/30 ml-8' : 'bg-zinc-900 mr-8'}`}>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(m.content, null, 2)}</pre>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入 Vibe 需求，例如：改成现代玻璃拟物暗黑风格的登录页..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm"
          rows={3}
        />
        <button 
          onClick={sendMessage}
          disabled={loading}
          className="mt-3 w-full bg-violet-600 py-2.5 rounded font-medium hover:bg-violet-700"
        >
          {loading ? 'Agent 执行中...' : '发送'}
        </button>
      </div>
    </div>
  );
};