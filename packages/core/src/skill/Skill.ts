export type SkillCategory = 'code-review' | 'refactor' | 'test' | 'document' | 'analyze' | 'custom';

export interface SkillParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
  default?: unknown;
}

export interface SkillContext {
  workspaceFiles?: Array<{ path: string; content?: string }>;
  parameters?: Record<string, unknown>;
  knowledgeGraph?: unknown;
}

export interface SkillChunk {
  type: 'delta' | 'done' | 'error';
  text?: string;
  data?: unknown;
  error?: string;
}

export interface SkillResult {
  success: boolean;
  output: string;
  data?: unknown;
  duration: number;
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  category: SkillCategory;
  parameters: SkillParameter[];
  execute(context: SkillContext): AsyncGenerator<SkillChunk, SkillResult, unknown>;
}