import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { AgentRegistry } from '@forge-ai/core';
import { VibeAgent } from './agents/vibe/VibeAgent';
import { ClaudeAgent } from './agents/claude/ClaudeAgent';

AgentRegistry.register(new VibeAgent());

const anthropicApiKey = (import.meta as any).env.VITE_ANTHROPIC_API_KEY;

if (anthropicApiKey) {
  AgentRegistry.register(new ClaudeAgent(anthropicApiKey));
  console.log('%c[Multi-Agent] Claude 3.5 Sonnet Agent 已注册', 'color: #22c55e');
} else {
  console.warn(
    '%c[Multi-Agent] 未检测到 VITE_ANTHROPIC_API_KEY，Claude Agent 未启用',
    'color: #f59e0b'
  );
}

import { useAgentStore } from './stores/useAgentStore';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
