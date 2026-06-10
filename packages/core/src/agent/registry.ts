import { CodingAgent } from '../types';

class AgentRegistryClass {
  private agents = new Map<string, CodingAgent>();

  register(agent: CodingAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent with id "${agent.id}" already registered. Overwriting.`);
    }
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): CodingAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): CodingAgent[] {
    return Array.from(this.agents.values());
  }

  hasAgent(id: string): boolean {
    return this.agents.has(id);
  }
}

export const AgentRegistry = new AgentRegistryClass();
