import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ==================== Multi-Agent 初始化 ====================
import { AgentRegistry } from './agents/registry/AgentRegistry';
import { VibeAgent } from './agents/vibe/VibeAgent';
import { ClaudeAgent } from './agents/claude/ClaudeAgent';

// 注册自研 Vibe Agent（默认 Agent）
AgentRegistry.register(new VibeAgent());

// 注册 Claude Agent（如果配置了 API Key）
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

// 可选：设置默认 Agent（如果希望默认使用 Claude）
import { useAgentStore } from './stores/useAgentStore';
// useAgentStore.getState().setCurrentAgent('claude-3-5-sonnet'); // 如需默认 Claude 可取消注释

// ==================== 渲染应用 ====================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
