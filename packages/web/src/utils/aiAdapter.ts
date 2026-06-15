import { useModelStore } from '../stores/useModelStore';
import { generateGraphifyGraph } from './graphify';
import { WorkspaceFile, CodeKnowledgeGraph } from '../types';

export interface VibeResponse {
  plan: string;
  diffs: Array<{ file: string; content: string; description?: string }>;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface GraphContext {
  files: WorkspaceFile[];
  relations: Array<{ source: string; target: string; type: string }>;
  functions: Array<{ name: string; file: string }>;
}

export class AIAdapter {
  static async sendVibePrompt(prompt: string, workspaceFiles: WorkspaceFile[]): Promise<VibeResponse> {
    const { currentProvider, modelName, baseUrl, apiKey } = useModelStore.getState();

    let graphContext: CodeKnowledgeGraph = { nodes: [], edges: [] };
    try {
      graphContext = generateGraphifyGraph(workspaceFiles);
    } catch (e) {
      console.warn('Graphify 上下文注入失败，继续执行', e);
    }

    const systemPrompt = `你是一位专业的 Forge AI Vibe Coding Agent。
项目知识图谱上下文：
${JSON.stringify(graphContext, null, 2).slice(0, 7000)}

用户 Vibe 需求：${prompt}

请严格以以下 JSON 格式返回（不要添加额外文字）：
{
  "plan": "本次执行的简要计划",
  "diffs": [
    {
      "file": "相对文件路径",
      "content": "完整的新文件代码",
      "description": "修改说明"
    }
  ]
}`;

    try {
      if (currentProvider === 'ollama' && baseUrl) {
        return await this.callLocalOllama(systemPrompt, baseUrl, modelName);
      } else {
        return await this.callGemini(systemPrompt, apiKey);
      }
    } catch (error) {
      console.error('AI Adapter 调用失败:', error);
      throw new Error('AI 服务调用失败，请检查模型配置');
    }
  }

  private static async callLocalOllama(prompt: string, baseUrl: string, model: string): Promise<VibeResponse> {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.65,
        max_tokens: 4096
      })
    });

    if (!response.ok) throw new Error('Ollama 调用失败');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return JSON.parse(content) as VibeResponse;
  }

  private static async callGemini(prompt: string, apiKey?: string): Promise<VibeResponse> {
    const response = await fetch('/api/vibe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, provider: 'gemini', apiKey })
    });

    if (!response.ok) throw new Error('Gemini 调用失败');
    return response.json() as Promise<VibeResponse>;
  }
}