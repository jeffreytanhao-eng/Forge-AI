import type { AgentResponse } from '../types/index.js';
export type { AgentResponse };

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  online: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatChunk {
  type: 'delta' | 'done' | 'error';
  text?: string;
  fullText?: string;
  result?: AgentResponse;
  error?: string;
}

export interface ModelProvider {
  readonly id: string;
  readonly name: string;
  readonly online: boolean;
  listModels(): Promise<ModelOption[]>;
  chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatChunk, AgentResponse, unknown>;
  validateConfig(): Promise<boolean>;
}