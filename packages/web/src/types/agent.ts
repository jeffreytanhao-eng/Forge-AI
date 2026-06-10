export interface AgentContext {
  workspaceFiles: any[];
  knowledgeGraph?: any;
  currentFile?: any;
  skills?: any[];
}

export interface AgentDiff {
  file: string;
  content: string;
  description?: string;
}

export interface AgentResponse {
  plan: string;
  diffs: AgentDiff[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface CodingAgent {
  id: string;
  name: string;
  description: string;
  icon?: string;
  supportsStreaming?: boolean;

  sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse>;
  sendPromptStream?(prompt: string, context: AgentContext): AsyncGenerator<any, void, unknown>;
}
