import { CodingAgent } from '../types/index.js';

class AgentRegistryClass {
  private agents = new Map<string, CodingAgent>();

  register(agent: CodingAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent with id "${agent.id}" already registered. Overwriting.`);
    }
    this.agents.set(agent.id, agent);
  }

  unregister(id: string): void {
    this.agents.delete(id);
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

  getByCapability(cap: string): CodingAgent[] {
    return this.getAllAgents().filter(agent => {
      const desc = agent.description.toLowerCase();
      const name = agent.name.toLowerCase();
      return desc.includes(cap.toLowerCase()) || name.includes(cap.toLowerCase());
    });
  }
}

export const AgentRegistry = new AgentRegistryClass();
