import { create } from 'zustand';
import { CodingAgent, AgentRegistry } from '@forge-ai/core';

interface AgentState {
  currentAgentId: string;
  currentAgent: CodingAgent | null;
  setCurrentAgent: (id: string) => void;
}

export const useAgentStore = create<AgentState>((set) => {
  const defaultAgent = AgentRegistry.getAgent('vibe');

  return {
    currentAgentId: 'vibe',
    currentAgent: defaultAgent || null,

    setCurrentAgent: (id: string) => {
      const agent = AgentRegistry.getAgent(id);
      if (agent) {
        set({ currentAgentId: id, currentAgent: agent });
      }
    },
  };
});
