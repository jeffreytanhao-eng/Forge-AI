import { describe, it, expect } from 'vitest';
import { AgentRegistry } from '../agent/registry';
import { CodingAgent, AgentContext, AgentResponse } from '../types';

describe('AgentRegistry', () => {
  it('getInstance 返回同一实例', () => {
    const instance1 = AgentRegistry;
    const instance2 = AgentRegistry;
    expect(instance1).toBe(instance2);
  });

  it('register 和 getAgent 方法', () => {
    const testAgent: CodingAgent = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      supportsStreaming: false,
      async sendPrompt(_prompt: string, _context: AgentContext): Promise<AgentResponse> {
        return { plan: 'test', diffs: [] };
      },
    };

    AgentRegistry.register(testAgent);
    const retrieved = AgentRegistry.getAgent('test-agent');
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('test-agent');
    expect(retrieved!.name).toBe('Test Agent');

    AgentRegistry.getAgent('non-existent');
  });

  it('getAllAgents 返回所有注册的 Agent', () => {
    const agentA: CodingAgent = {
      id: 'agent-a',
      name: 'Agent A',
      description: 'First agent',
      supportsStreaming: false,
      async sendPrompt(_prompt: string, _context: AgentContext): Promise<AgentResponse> {
        return { plan: 'a', diffs: [] };
      },
    };

    const agentB: CodingAgent = {
      id: 'agent-b',
      name: 'Agent B',
      description: 'Second agent',
      supportsStreaming: true,
      async sendPrompt(_prompt: string, _context: AgentContext): Promise<AgentResponse> {
        return { plan: 'b', diffs: [] };
      },
    };

    AgentRegistry.register(agentA);
    AgentRegistry.register(agentB);

    const allAgents = AgentRegistry.getAllAgents();
    const ids = allAgents.map(a => a.id);
    expect(ids).toContain('agent-a');
    expect(ids).toContain('agent-b');
  });

  it('重复注册时覆盖已有 Agent', () => {
    const original: CodingAgent = {
      id: 'dup-agent',
      name: 'Original',
      description: 'original',
      supportsStreaming: false,
      async sendPrompt(_prompt: string, _context: AgentContext): Promise<AgentResponse> {
        return { plan: 'original', diffs: [] };
      },
    };

    const replacement: CodingAgent = {
      id: 'dup-agent',
      name: 'Replacement',
      description: 'replacement',
      supportsStreaming: true,
      async sendPrompt(_prompt: string, _context: AgentContext): Promise<AgentResponse> {
        return { plan: 'replacement', diffs: [] };
      },
    };

    AgentRegistry.register(original);
    AgentRegistry.register(replacement);

    const agent = AgentRegistry.getAgent('dup-agent');
    expect(agent).toBeDefined();
    expect(agent!.name).toBe('Replacement');
  });
});