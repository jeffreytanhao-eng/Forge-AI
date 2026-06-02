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
