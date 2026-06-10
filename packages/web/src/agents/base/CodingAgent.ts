import { CodingAgent, AgentContext, AgentResponse } from '@forge-ai/core';

export abstract class BaseCodingAgent implements CodingAgent {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  icon?: string;
  supportsStreaming: boolean = false;

  abstract sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse>;

  protected extractJSON(text: string): any {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error('JSON 解析失败:', e);
      }
    }
    return null;
  }
}
