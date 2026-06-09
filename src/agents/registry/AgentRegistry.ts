import { CodingAgent } from '../../types/agent';
import { ClaudeAgent } from '../claude/ClaudeAgent';

class AgentRegistryClass {
  private agents: Map<string, CodingAgent> = new Map();

  register(agent: CodingAgent) {
    this.agents.set(agent.id, agent);
  }

  registerClaudeAgent(apiKey: string) {
    const claude = new ClaudeAgent(apiKey);
    this.register(claude);
    return claude;
  }

  getAgent(id: string): CodingAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): CodingAgent[] {
    return Array.from(this.agents.values());
  }
}

export const AgentRegistry = new AgentRegistryClass();
