import { AgentRegistry } from './registry/AgentRegistry';
import { VibeAgent } from './vibe/VibeAgent';
import { ClaudeAgent } from './claude/ClaudeAgent';

AgentRegistry.register(new VibeAgent());

const anthropicKey = (import.meta as any).env.VITE_ANTHROPIC_API_KEY;
if (anthropicKey) {
  AgentRegistry.register(new ClaudeAgent(anthropicKey));
} else {
  console.warn('未检测到 VITE_ANTHROPIC_API_KEY，Claude Agent 不可用');
}

export { AgentRegistry };
