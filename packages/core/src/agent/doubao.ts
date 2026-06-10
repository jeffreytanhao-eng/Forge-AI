import { BaseCodingAgent } from './base';
import { AgentContext, AgentResponse } from '../types';

export class DoubaoAgent extends BaseCodingAgent {
  id = 'doubao';
  name = '豆包';
  description = '字节跳动的 AI 助手，适合快速开发';
  icon = '🐟';
  supportsStreaming = true;

  private apiKey: string;

  constructor(apiKey: string = '') {
    super();
    this.apiKey = apiKey;
  }

  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    console.log('[Doubao] 发送请求...');
    return {
      plan: `这是一个模拟响应，您要求了：${prompt}\n\n建议步骤：\n1. 分析需求\n2. 编写代码\n3. 测试功能`,
      diffs: [
        {
          file: 'example.ts',
          content: `export function hello() {
  return "Hello from Doubao!";
}`,
          description: '新增示例文件'
        }
      ]
    };
  }

  async *sendPromptStream(prompt: string, context: AgentContext) {
    console.log('[Doubao] 流式请求...');

    const plan = `这是一个模拟响应，您要求了：${prompt}`;
    let accumulated = '';

    for (const char of plan) {
      accumulated += char;
      yield { type: 'delta' as const, text: char, fullText: accumulated };
      await new Promise(r => setTimeout(r, 30));
    }

    const finalResult: AgentResponse = {
      plan: plan,
      diffs: [
        {
          file: 'example.ts',
          content: `export function hello() {
  return "Hello from Doubao!";
}`,
          description: '新增示例文件'
        }
      ]
    };

    yield { type: 'done' as const, result: finalResult };
  }
}
