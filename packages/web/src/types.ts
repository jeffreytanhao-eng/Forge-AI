/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModelProvider {
  id: string;
  name: string;
  category: 'cloud' | 'local';
  apiKey?: string;
  status: 'connected' | 'disconnected' | 'testing';
  latency?: number;
  modelsCount: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  providerId: string;
  tier: 'flagship' | 'reasoning' | 'coding' | 'fast';
  contextLength: string;
  isCustom?: boolean;
}

export interface LocalServeInstance {
  id: string;
  modelName: string;
  modelDir?: string;
  gpuMemoryUsage: number; // e.g. 0.90 (90%)
  tensorParallelSize: number;
  port: number;
  pid?: number;
  status: 'stopped' | 'starting' | 'running' | 'failed';
  logs: string[];
  vramDetails?: string;
  startedAt?: string;
}

export type PermissionTier = 'read_only' | 'workspace_write' | 'shell';

export interface Agent {
  id: string;
  name: string;
  avatar: string; // Emoji character, icon name or URL
  description: string;
  systemPrompt: string;
  defaultModelId: string;
  temperature: number;
  maxTokens: number;
  tools: string[]; // ['read_file', 'edit_file', 'grep', 'terminal', 'knowledge_graph']
  skills: string[]; // Array of skill IDs bound to this agent
  permissionTier: PermissionTier;
  createdAt: string;
  isBuiltIn?: boolean;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: WorkspaceFile[];
}

export interface DiffSuggestion {
  originalPath: string;
  originalCode: string;
  modifiedCode: string;
  explanation: string;
  applied: boolean;
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: 'sending' | 'thought' | 'completed' | 'error';
  agentId?: string;
  diff?: DiffSuggestion;
}

export interface CodeGraphNode {
  id: string;
  label: string;
  type: 'file' | 'function' | 'class' | 'module';
  filePath: string;
  x?: number;
  y?: number;
}

export interface CodeGraphEdge {
  source: string;
  target: string;
  type: 'imports' | 'calls' | 'contains';
}

export interface CodeKnowledgeGraph {
  nodes: CodeGraphNode[];
  edges: CodeGraphEdge[];
}

export interface PlatformTheme {
  primaryColor: string; // CSS Color e.g. '#2563eb'
  accentColor: string; // e.g. '#10b981'
  backgroundStyle: 'light' | 'dark' | 'glass-dark' | 'slate-cyber';
  fontFamily: string; // e.g. 'Inter', 'Space Grotesk'
  logoUrl?: string;
  logoText: string;
}

// ==================== Skill Hub Types ====================
export type SkillCategory = 'automation' | 'analysis' | 'integration' | 'utility' | 'custom';

export type SkillTriggerType = 'manual' | 'event' | 'schedule' | 'api';

export interface SkillParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file';
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: string; // emoji or icon name
  triggerType: SkillTriggerType;
  parameters: SkillParameter[];
  code: string; // JavaScript/Python code to execute
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SkillExecutionResult {
  skillId: string;
  success: boolean;
  output: string;
  error?: string;
  timestamp: string;
}

export type DocumentFormat = 'markdown' | 'text' | 'json' | 'yaml' | 'python' | 'typescript';

export interface SkillExport {
  version: string;
  skills: Skill[];
  exportedAt: string;
}

// ==================== Wiki Knowledge Base Types ====================
export type WikiDocumentType = 'md' | 'txt' | 'docx' | 'pdf';

export interface WikiPage {
  id: string;
  title: string;
  content: string;
  format: DocumentFormat;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  children: string[];
}

export interface DocumentImportResult {
  success: boolean;
  pages: WikiPage[];
  errors: string[];
  warnings: string[];
}

export interface VibeDiff {
  file: string;
  content: string;
  description?: string;
}

export interface VibeHistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  diffs: Array<{ file: string; previousContent: string; content: string }>;
}
