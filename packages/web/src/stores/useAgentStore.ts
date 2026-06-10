import { create } from 'zustand';
import { CodingAgent } from '@forge-ai/core';
import { AgentRegistry } from '../agents/registry/AgentRegistry';

interface AgentState {
  currentAgentId: string;
  currentAgent: CodingAgent | null;
  setCurrentAgent: (id: string) => void;
}

export const useAgentStore = create<AgentState>((set) => {
  // 初始化时先尝试获取默认的 VibeAgent
  const defaultAgent = AgentRegistry.getAgent('vibe');
  
  return {
    currentAgentId: 'vibe', // 默认使用自研 Vibe
    currentAgent: defaultAgent || null,

    setCurrentAgent: (id: string) => {
      const agent = AgentRegistry.getAgent(id);
      if (agent) {
        set({ currentAgentId: id, currentAgent: agent });
      }
    },
  };
});
