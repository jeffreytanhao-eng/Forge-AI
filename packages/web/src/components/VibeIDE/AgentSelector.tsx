import React, { useState } from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import { AgentRegistry, ClaudeAgent } from '@forge-ai/core';
import { Settings } from 'lucide-react';

export const AgentSelector: React.FC = () => {
  const { currentAgentId, setCurrentAgent } = useAgentStore();
  const agents = AgentRegistry.getAllAgents();
  const [showSettings, setShowSettings] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState('');

  const handleAddClaude = () => {
    if (claudeApiKey.trim()) {
      AgentRegistry.register(new ClaudeAgent(claudeApiKey));
      setCurrentAgent('claude-3-5-sonnet');
      setClaudeApiKey('');
      setShowSettings(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
      <span className="text-xs text-zinc-400">当前 Agent:</span>
      <select
        value={currentAgentId}
        onChange={(e) => setCurrentAgent(e.target.value)}
        className="bg-zinc-800 text-sm px-3 py-1 rounded border border-zinc-700 focus:outline-none focus:border-violet-500"
      >
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
        title="Agent 管理"
      >
        <Settings className="w-4 h-4" />
      </button>

      {showSettings && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-xl z-50">
          <h4 className="text-sm font-medium text-zinc-200 mb-2">添加 Claude Agent</h4>
          <div className="space-y-2">
            <input
              type="password"
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="Anthropic API Key"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200"
            />
            <button
              onClick={handleAddClaude}
              disabled={!claudeApiKey.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm py-1.5 rounded-md"
            >
              添加 Claude 3.5 Sonnet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
