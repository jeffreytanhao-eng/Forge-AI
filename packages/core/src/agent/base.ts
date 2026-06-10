import { CodingAgent } from '../types';

export abstract class BaseCodingAgent implements CodingAgent {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract icon: string;
  abstract supportsStreaming: boolean;

  abstract sendPrompt(prompt: string, context: any): Promise<any>;

  protected extractJSON(text: string): any {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*"diffs"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.warn('JSON 解析失败', e);
      }
    }
    return null;
  }
}
