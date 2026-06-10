export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
}

export interface AgentDiff {
  file: string;
  content: string;
  description?: string;
}

export interface AgentResponse {
  plan: string;
  diffs: AgentDiff[];
}

export interface AgentContext {
  workspaceFiles: WorkspaceFile[];
  knowledgeGraph?: any;
  skills?: any[];
  currentFile?: WorkspaceFile;
}

export interface AgentStreamChunk {
  type: 'delta' | 'done' | 'error';
  text?: string;
  fullText?: string;
  result?: AgentResponse;
  error?: string;
}

export interface CodingAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  supportsStreaming: boolean;

  sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse>;
  sendPromptStream?(prompt: string, context: AgentContext): AsyncGenerator<AgentStreamChunk>;
}
