import { CodingAgent } from '../types';
import { DoubaoAgent } from './doubao';

export class AgentRegistry {
  private static agents: Map<string, CodingAgent> = new Map();
  private static currentAgentId: string = 'doubao';

  static register(agent: CodingAgent) {
    this.agents.set(agent.id, agent);
    console.log(`[AgentRegistry] 已注册：${agent.name}`);
  }

  static getAgent(id: string): CodingAgent | undefined {
    return this.agents.get(id);
  }

  static getAllAgents(): CodingAgent[] {
    return Array.from(this.agents.values());
  }

  static getCurrentAgent(): CodingAgent | undefined {
    return this.agents.get(this.currentAgentId);
  }

  static setCurrentAgent(id: string) {
    if (this.agents.has(id)) {
      this.currentAgentId = id;
    }
  }

  static initialize() {
    // 初始化默认 Agent
    this.register(new DoubaoAgent());
    console.log('[AgentRegistry] 初始化完成');
  }
}
