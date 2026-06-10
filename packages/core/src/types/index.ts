export interface AgentDiff {
  file: string;
  content: string;
  description?: string;
}

export interface AgentContext {
  workspaceFiles?: Array<{ path: string; content?: string }>;
  knowledgeGraph?: any;
  currentFile?: { path: string; content?: string };
  skills?: any[];
}

export interface AgentResponse {
  plan: string;
  diffs: AgentDiff[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    model?: string;
  };
}

export interface CodingAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon?: string;
  readonly supportsStreaming: boolean;

  sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse>;

  sendPromptStream?(
    prompt: string,
    context: AgentContext
  ): AsyncGenerator<
    | { type: 'delta'; text: string; fullText: string }
    | { type: 'done'; result: AgentResponse }
    | { type: 'error'; error: string },
    void,
    unknown
  >;
}
