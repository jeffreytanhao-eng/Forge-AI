import { useModelStore } from '../stores/useModelStore';
import { generateGraphifyGraph } from './graphify';

export class AIAdapter {
  static async sendVibePrompt(prompt: string, workspaceFiles: any[]) {
    const { currentProvider, modelName, baseUrl } = useModelStore.getState();
    
    const graphContext = generateGraphifyGraph(workspaceFiles);

    const fullPrompt = `你是 Codex 风格的 Vibe Coding Agent。
知识图谱上下文: ${JSON.stringify(graphContext).slice(0, 6000)}
用户需求: ${prompt}

请返回 JSON 格式：
{
  "plan": "执行计划",
  "diffs": [{"file": "path", "content": "新代码"}]
}`;

    if (currentProvider === 'ollama' && baseUrl) {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, messages: [{ role: 'user', content: fullPrompt }], temperature: 0.6 })
      });
      return res.json();
    } else {
      // 调用现有 Gemini API
      const res = await fetch('/api/vibe', { method: 'POST', body: JSON.stringify({ prompt: fullPrompt }) });
      return res.json();
    }
  }
}