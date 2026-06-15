/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelProvider, ModelConfig, Agent, WorkspaceFile, CodeKnowledgeGraph, PlatformTheme, Skill, WikiPage } from '../../types';

export const INITIAL_PROVIDERS: ModelProvider[] = [];

export const INITIAL_MODELS: ModelConfig[] = [];

export const BUILTIN_AGENTS: Agent[] = [
  {
    id: 'agent_coder',
    name: 'Forge Architect',
    avatar: '📐',
    description: 'Expert senior developer specialized in full-stack clean code design & TypeScript/Python refactorings.',
    systemPrompt: 'You are the Forge Architect, an expert coder who plans elegant, modular software architecture. You always recommend robust types, modular imports, and clean directory structures. You speak succinctly with developer-friendly humbleness.',
    defaultModelId: 'gemini-3.5-flash',
    temperature: 0.2,
    maxTokens: 4096,
    tools: ['read_file', 'edit_file', 'grep', 'knowledge_graph'],
    skills: ['skill_file_processor', 'skill_data_analyzer'],
    permissionTier: 'workspace_write',
    createdAt: '2026-05-01T00:00:00Z',
    isBuiltIn: true,
  },
  {
    id: 'agent_reviewer',
    name: 'Strict Code Critic',
    avatar: '🔍',
    description: 'Relentless code quality inspector. Only detects antipatterns, complexity bottlenecks, and edge-cases. Read-only.',
    systemPrompt: 'You are the Strict Code Critic. Your job is to find faults, edge-cases, memory leaks, security holes, and code formatting deviations. You never make modifications yourself—you only provide list of issues and brief explanations.',
    defaultModelId: 'gemini-3.1-pro-preview',
    temperature: 0.1,
    maxTokens: 2048,
    tools: ['read_file', 'grep', 'knowledge_graph'],
    skills: [],
    permissionTier: 'read_only',
    createdAt: '2026-05-15T00:00:00Z',
    isBuiltIn: true,
  },
  {
    id: 'agent_devops',
    name: 'Tauri Release Engineer',
    avatar: '🚀',
    description: 'Automation specialist to handle build configs, cargo configurations, dependencies, environmental variables, and tests.',
    systemPrompt: 'You are the Tauri Release Engineer. Your scope includes build configurations, CI/CD, managing packaging, testing terminal scripts, and cargo setups. You are authorized to run terminal instructions safely with workspace supervision.',
    defaultModelId: 'gemini-3.5-flash',
    temperature: 0.4,
    maxTokens: 4096,
    tools: ['read_file', 'edit_file', 'terminal', 'grep'],
    skills: ['skill_api_integrator', 'skill_backup_auto'],
    permissionTier: 'shell',
    createdAt: '2026-05-20T00:00:00Z',
    isBuiltIn: true,
  },
];

export const MOCK_WORKSPACES: { [key: string]: WorkspaceFile[] } = {
  python_api: [
    {
      path: '/main.py',
      name: 'main.py',
      type: 'file',
      content: `from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from database import get_db, SessionLocal
from models import Item

app = FastAPI(title="ForgeAI Demo Fast API Store", version="1.0.0")

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool = True

@app.get("/")
def read_root():
    return {"message": "Welcome to ForgeAI Mock Fast API Backend Server"}

@app.get("/items", response_model=List[ItemCreate])
def read_items(db = Depends(get_db)):
    # Query database
    items = db.query(Item).all()
    return items

@app.post("/items")
def create_item(item: ItemCreate, db = Depends(get_db)):
    db_item = Item(name=item.name, description=item.description, price=item.price, is_available=item.is_available)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`
    },
    {
      path: '/database.py',
      name: 'database.py',
      type: 'file',
      content: `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`
    },
    {
      path: '/models.py',
      name: 'models.py',
      type: 'file',
      content: `from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    is_available = Column(Boolean, default=True)
`
    },
    {
      path: '/requirements.txt',
      name: 'requirements.txt',
      type: 'file',
      content: `fastapi==0.110.0
uvicorn==0.28.0
sqlalchemy==2.0.28
pydantic==2.6.4
`
    },
    {
      path: '/VIBE_IDE_ARCH.md',
      name: 'VIBE_IDE_ARCH.md',
      type: 'file',
      content: `# Forge-AI Vibe Coding IDE 集成 - 详细技术架构文档 v2.1

**文档版本**：1.0（2026年6月）  
**作者**：程序架构师（Grok）  
**目标**：在现有 Forge-AI 项目中**直接嵌入现代化 Vibe Coding IDE**，实现沉浸式自然语言驱动开发，同时支持**云上模型**（Gemini 等）和**本地模型**（Ollama / LM Studio 等）双通道。

---

### 1. 架构概述（Hybrid Vibe Architecture）

**核心设计原则**：
- **模块化**：不破坏现有知识图谱引擎 (\`/src/utils/graphify.ts\`)。
- **双模态 AI**：统一抽象层，支持云/本地无缝切换。
- **实时联动**：Vibe Prompt → Agent 执行 → Monaco 编辑 → Graphify 更新。
- **浏览器优先**：充分利用现有 React + Vite + Monaco 基础。

---

### 2. 项目代码结构

基于当前仓库结构进行扩展：
- **src/components/VibeIDE/**: Vibe Coding 主模块 (Composer, MonacoVibeEditor, AgentTaskBoard)
- **src/utils/aiAdapter.ts**: 云/本地统一适配器
- **src/utils/diffApplier.ts**: Monaco Diff 应用
- **server.ts**: Node/Express Backend 服务

---

### 3. 核心模块代码设计（aiAdapter.ts）

\`\`\`typescript
export interface ModelConfig {
  provider: 'gemini' | 'ollama' | 'openai-compatible';
  model: string;
  baseUrl?: string;     // 本地用 http://localhost:11434
  apiKey?: string;
  role: 'chat' | 'edit' | 'agent';
}
\`\`\`
`
    }
  ],
  ts_utils: [
    {
      path: '/index.ts',
      name: 'index.ts',
      type: 'file',
      content: `import { parseString, serializeObject } from "./parser";
import { capitalize, slugify } from "./strings";

export function transformPayload(raw: string): string {
  try {
    const obj = parseString(raw);
    if (obj && typeof obj === 'object') {
      const processed = Object.entries(obj).reduce((acc, [key, val]) => {
        const slug = slugify(key);
        const niceVal = typeof val === 'string' ? capitalize(val) : val;
        acc[slug] = niceVal;
        return acc;
      }, {} as Record<string, any>);
      return serializeObject(processed);
    }
    return raw;
  } catch (error) {
    console.error("Failed to process string payload in index.ts", error);
    return raw;
  }
}
`
    },
    {
      path: '/parser.ts',
      name: 'parser.ts',
      type: 'file',
      content: `export function parseString(val: string): Record<string, any> | null {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    // If not JSON, try key-value split
    const parts = val.split(',');
    const obj: Record<string, string> = {};
    for (const p of parts) {
      const [k, v] = p.split(':');
      if (k && v) {
        obj[k.trim()] = v.trim();
      }
    }
    return Object.keys(obj).length ? obj : null;
  }
}

export function serializeObject(obj: Record<string, any>): string {
  return JSON.stringify(obj, null, 2);
}
`
    },
    {
      path: '/strings.ts',
      name: 'strings.ts',
      type: 'file',
      content: `export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
`
    },
    {
      path: '/package.json',
      name: 'package.json',
      type: 'file',
      content: `{
  "name": "ts-utils-demolib",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "scripts": {
    "test": "echo 'Running unit tests... All 4 tests passed successfully!'"
  }
}
`
    }
  ],
  forge_platform: [
    {
      path: '/src/App.tsx',
      name: 'App.tsx',
      type: 'file',
      content: `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ForgeIDE from './components/ForgeIDE';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import ThemeCustomizer from './components/ThemeCustomizer';
import ModelHub from './components/ModelHub';

export default function App() {
  const [activeTab, setActiveTab] = useState('forge_ide');
  const [theme, setTheme] = useState({ logoText: 'ForgeAI', primaryColor: '#6366f1' });

  function handleUpdateTheme(newTheme) {
    setTheme(newTheme);
  }

  return (
    <div className="app-container font-sans">
      <h1>{theme.logoText} Developer Platform</h1>
      <ForgeIDE />
      <KnowledgeGraphView />
      <ThemeCustomizer onUpdateTheme={handleUpdateTheme} />
    </div>
  );
}`
    },
    {
      path: '/src/components/ForgeIDE.tsx',
      name: 'ForgeIDE.tsx',
      type: 'file',
      content: `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Check, X, Terminal } from 'lucide-react';

export default function ForgeIDE() {
  const [logs, setLogs] = useState(['Terminal ready...']);

  function executeCompiler() {
    setLogs(prev => [...prev, 'Running compilation check!']);
  }

  return (
    <div className="ide-editor border border-slate-800">
      <button onClick={executeCompiler}>Compile</button>
      <pre>{logs.join('\\n')}</pre>
    </div>
  );
}`
    },
    {
      path: '/src/components/KnowledgeGraphView.tsx',
      name: 'KnowledgeGraphView.tsx',
      type: 'file',
      content: `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { generateGraphifyGraph } from '../utils/graphify';
import { Search, Layers } from 'lucide-react';

export default function KnowledgeGraphView() {
  const [searchTerm, setSearchTerm] = useState('');

  function renderGraph() {
    return <p>Active node rendering for search: {searchTerm}</p>;
  }

  return (
    <div className="graph-stage">
      <h3>Codebase Graphify Visualizer</h3>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      {renderGraph()}
    </div>
  );
}`
    },
    {
      path: '/src/utils/graphify.ts',
      name: 'graphify.ts',
      type: 'file',
      content: `/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

export function flattenWorkspaceCodeFiles(files: any[]): any[] {
  return files.filter(f => f.type === 'file');
}

export function generateGraphifyGraph(workspaceFiles: any[]): any {
  const files = flattenWorkspaceCodeFiles(workspaceFiles);
  const nodes = files.map(f => ({ id: f.name, label: f.name, type: 'file' }));
  const edges = [];
  return { nodes, edges };
}`
    },
    {
      path: '/server.ts',
      name: 'server.ts',
      type: 'file',
      content: `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';

const app = express();
const PORT = 3000;

function startServer() {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on port ' + PORT);
  });
}

startServer();`
    }
  ]
};

export const MOCK_KNOWLEDGE_GRAPHS: { [key: string]: CodeKnowledgeGraph } = {
  python_api: {
    nodes: [
      { id: 'file_main', label: 'main.py', type: 'file', filePath: '/main.py', x: 200, y: 150 },
      { id: 'func_read_root', label: 'read_root()', type: 'function', filePath: '/main.py', x: 200, y: 300 },
      { id: 'func_read_items', label: 'read_items()', type: 'function', filePath: '/main.py', x: 100, y: 400 },
      { id: 'func_create_item', label: 'create_item()', type: 'function', filePath: '/main.py', x: 300, y: 400 },
      { id: 'func_health', label: 'health_check()', type: 'function', filePath: '/main.py', x: 420, y: 250 },
      
      { id: 'file_database', label: 'database.py', type: 'file', filePath: '/database.py', x: 500, y: 150 },
      { id: 'func_get_db', label: 'get_db()', type: 'function', filePath: '/database.py', x: 550, y: 350 },
      
      { id: 'file_models', label: 'models.py', type: 'file', filePath: '/models.py', x: 750, y: 200 },
      { id: 'class_item', label: 'Item(Base)', type: 'class', filePath: '/models.py', x: 700, y: 400 },
    ],
    edges: [
      { source: 'file_main', target: 'func_read_root', type: 'contains' },
      { source: 'file_main', target: 'func_read_items', type: 'contains' },
      { source: 'file_main', target: 'func_create_item', type: 'contains' },
      { source: 'file_main', target: 'func_health', type: 'contains' },
      
      { source: 'file_database', target: 'func_get_db', type: 'contains' },
      
      { source: 'file_models', target: 'class_item', type: 'contains' },
      
      { source: 'file_main', target: 'file_database', type: 'imports' },
      { source: 'file_main', target: 'file_models', type: 'imports' },
      
      { source: 'func_read_items', target: 'func_get_db', type: 'calls' },
      { source: 'func_create_item', target: 'func_get_db', type: 'calls' },
      { source: 'func_read_items', target: 'class_item', type: 'calls' },
      { source: 'func_create_item', target: 'class_item', type: 'calls' },
    ]
  },
  ts_utils: {
    nodes: [
      { id: 'file_index', label: 'index.ts', type: 'file', filePath: '/index.ts', x: 300, y: 200 },
      { id: 'func_transform', label: 'transformPayload()', type: 'function', filePath: '/index.ts', x: 300, y: 400 },
      
      { id: 'file_parser', label: 'parser.ts', type: 'file', filePath: '/parser.ts', x: 100, y: 200 },
      { id: 'func_parse', label: 'parseString()', type: 'function', filePath: '/parser.ts', x: 100, y: 350 },
      { id: 'func_serialize', label: 'serializeObject()', type: 'function', filePath: '/parser.ts', x: 100, y: 480 },
      
      { id: 'file_strings', label: 'strings.ts', type: 'file', filePath: '/strings.ts', x: 550, y: 200 },
      { id: 'func_capitalize', label: 'capitalize()', type: 'function', filePath: '/strings.ts', x: 550, y: 350 },
      { id: 'func_slugify', label: 'slugify()', type: 'function', filePath: '/strings.ts', x: 550, y: 480 },
    ],
    edges: [
      { source: 'file_index', target: 'func_transform', type: 'contains' },
      { source: 'file_parser', target: 'func_parse', type: 'contains' },
      { source: 'file_parser', target: 'func_serialize', type: 'contains' },
      { source: 'file_strings', target: 'func_capitalize', type: 'contains' },
      { source: 'file_strings', target: 'func_slugify', type: 'contains' },
      
      { source: 'file_index', target: 'file_parser', type: 'imports' },
      { source: 'file_index', target: 'file_strings', type: 'imports' },
      
      { source: 'func_transform', target: 'func_parse', type: 'calls' },
      { source: 'func_transform', target: 'func_serialize', type: 'calls' },
      { source: 'func_transform', target: 'func_slugify', type: 'calls' },
      { source: 'func_transform', target: 'func_capitalize', type: 'calls' },
    ]
  },
  forge_platform: {
    nodes: [
      { id: 'file_app', label: 'App.tsx', type: 'file', filePath: '/src/App.tsx', x: 380, y: 200 },
      { id: 'func_app', label: 'App()', type: 'function', filePath: '/src/App.tsx', x: 380, y: 80 },
      { id: 'func_updatetheme', label: 'handleUpdateTheme()', type: 'function', filePath: '/src/App.tsx', x: 260, y: 120 },
      
      { id: 'file_ide', label: 'ForgeIDE.tsx', type: 'file', filePath: '/src/components/ForgeIDE.tsx', x: 150, y: 200 },
      { id: 'func_ide', label: 'ForgeIDE()', type: 'function', filePath: '/src/components/ForgeIDE.tsx', x: 80, y: 120 },
      { id: 'func_execute', label: 'executeCompiler()', type: 'function', filePath: '/src/components/ForgeIDE.tsx', x: 80, y: 280 },
      
      { id: 'file_graph', label: 'KnowledgeGraphView.tsx', type: 'file', filePath: '/src/components/KnowledgeGraphView.tsx', x: 610, y: 200 },
      { id: 'func_graph', label: 'KnowledgeGraphView()', type: 'function', filePath: '/src/components/KnowledgeGraphView.tsx', x: 680, y: 120 },
      { id: 'func_rendergraph', label: 'renderGraph()', type: 'function', filePath: '/src/components/KnowledgeGraphView.tsx', x: 680, y: 280 },
      
      { id: 'file_graphify', label: 'graphify.ts', type: 'file', filePath: '/src/utils/graphify.ts', x: 500, y: 380 },
      { id: 'func_flatten', label: 'flattenWorkspaceCodeFiles()', type: 'function', filePath: '/src/utils/graphify.ts', x: 380, y: 440 },
      { id: 'func_generate', label: 'generateGraphifyGraph()', type: 'function', filePath: '/src/utils/graphify.ts', x: 600, y: 440 },

      { id: 'file_server', label: 'server.ts', type: 'file', filePath: '/server.ts', x: 200, y: 380 },
      { id: 'func_startserver', label: 'startServer()', type: 'function', filePath: '/server.ts', x: 150, y: 445 }
    ],
    edges: [
      { source: 'file_app', target: 'func_app', type: 'contains' },
      { source: 'file_app', target: 'func_updatetheme', type: 'contains' },
      { source: 'file_ide', target: 'func_ide', type: 'contains' },
      { source: 'file_ide', target: 'func_execute', type: 'contains' },
      { source: 'file_graph', target: 'func_graph', type: 'contains' },
      { source: 'file_graph', target: 'func_rendergraph', type: 'contains' },
      { source: 'file_graphify', target: 'func_flatten', type: 'contains' },
      { source: 'file_graphify', target: 'func_generate', type: 'contains' },
      { source: 'file_server', target: 'func_startserver', type: 'contains' },

      { source: 'file_app', target: 'file_ide', type: 'imports' },
      { source: 'file_app', target: 'file_graph', type: 'imports' },
      { source: 'file_graph', target: 'file_graphify', type: 'imports' },

      { source: 'func_app', target: 'func_ide', type: 'calls' },
      { source: 'func_app', target: 'func_graph', type: 'calls' },
      { source: 'func_graph', target: 'func_generate', type: 'calls' },
      { source: 'func_generate', target: 'func_flatten', type: 'calls' }
    ]
  }
};

export const DEFAULT_THEME: PlatformTheme = {
  primaryColor: '#6366f1', // Indigo
  accentColor: '#10b981', // Emerald
  backgroundStyle: 'slate-cyber',
  fontFamily: 'Inter',
  logoText: 'Forge AI'
};

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skill_file_processor',
    name: '文件处理工具',
    description: '批量处理文本文件，支持内容搜索、替换、格式化等操作',
    category: 'utility',
    icon: '📁',
    triggerType: 'manual',
    parameters: [
      { id: 'param_path', name: '文件路径', type: 'string', required: true, description: '要处理的文件路径' },
      { id: 'param_pattern', name: '搜索模式', type: 'string', required: false, description: '正则表达式搜索模式' }
    ],
    code: `// 文件处理脚本示例
async function processFiles(params) {
  const { path, pattern } = params;
  console.log(\`Processing files in: \${path}\`);
  console.log(\`Search pattern: \${pattern || 'none'}\`);
  return { success: true, message: '文件处理完成' };
}`,
    enabled: true,
    createdAt: '2026-05-20T00:00:00Z',
    updatedAt: '2026-05-25T10:30:00Z',
    tags: ['files', 'processing', 'utility']
  },
  {
    id: 'skill_data_analyzer',
    name: '数据分析师',
    description: '对数据进行统计分析、可视化和报告生成',
    category: 'analysis',
    icon: '📊',
    triggerType: 'manual',
    parameters: [
      { id: 'param_dataset', name: '数据集', type: 'file', required: true, description: 'CSV 或 JSON 数据文件' },
      { id: 'param_method', name: '分析方法', type: 'select', required: true, options: ['统计摘要', '相关性分析', '趋势预测'], description: '选择分析方法' }
    ],
    code: `// 数据分析脚本示例
async function analyzeData(params) {
  const { dataset, method } = params;
  console.log(\`Analyzing dataset: \${dataset}\`);
  console.log(\`Method: \${method}\`);
  return { 
    success: true, 
    result: { summary: '数据分析完成', insights: ['数据趋势向上', '相关性强'] }
  };
}`,
    enabled: true,
    createdAt: '2026-05-22T00:00:00Z',
    updatedAt: '2026-05-28T15:45:00Z',
    tags: ['data', 'analysis', 'statistics']
  },
  {
    id: 'skill_api_integrator',
    name: 'API 集成器',
    description: '连接外部 API 服务，实现数据同步和自动化工作流',
    category: 'integration',
    icon: '🔗',
    triggerType: 'event',
    parameters: [
      { id: 'param_endpoint', name: 'API 端点', type: 'string', required: true, description: '目标 API URL' },
      { id: 'param_method', name: 'HTTP 方法', type: 'select', required: true, options: ['GET', 'POST', 'PUT', 'DELETE'], description: 'HTTP 请求方法' },
      { id: 'param_auth', name: '认证密钥', type: 'string', required: false, description: 'API 密钥或令牌' }
    ],
    code: `// API 集成脚本示例
async function callAPI(params) {
  const { endpoint, method, auth } = params;
  const headers = auth ? { Authorization: \`Bearer \${auth}\` } : {};
  
  const response = await fetch(endpoint, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
  
  return { success: response.ok, data: await response.json() };
}`,
    enabled: true,
    createdAt: '2026-05-24T00:00:00Z',
    updatedAt: '2026-05-30T09:20:00Z',
    tags: ['api', 'integration', 'workflow']
  },
  {
    id: 'skill_backup_auto',
    name: '自动备份',
    description: '定期自动备份工作区文件到指定位置',
    category: 'automation',
    icon: '💾',
    triggerType: 'schedule',
    parameters: [
      { id: 'param_interval', name: '备份间隔', type: 'select', required: true, options: ['每小时', '每天', '每周'], description: '备份频率' },
      { id: 'param_target', name: '目标路径', type: 'string', required: true, description: '备份存储位置' }
    ],
    code: `// 自动备份脚本示例
async function performBackup(params) {
  const { interval, target } = params;
  console.log(\`Starting backup to: \${target}\`);
  console.log(\`Interval: \${interval}\`);
  
  // 模拟备份操作
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, message: \`备份完成，存储到: \${target}\` };
}`,
    enabled: false,
    createdAt: '2026-05-26T00:00:00Z',
    updatedAt: '2026-06-01T14:00:00Z',
    tags: ['backup', 'automation', 'storage']
  }
];

export const INITIAL_WIKI_PAGES: WikiPage[] = [
  {
    id: 'wiki_introduction',
    title: '欢迎使用 ForgeAI',
    content: `# ForgeAI 开发者平台

欢迎来到 ForgeAI 开发者平台！这是一个集成了 AI 能力的现代化开发环境。

## 主要功能

### 1. Forge AI 编辑器
强大的代码编辑器，支持多种编程语言和智能代码补全。

### 2. Model Hub
管理和配置各种 AI 模型，支持云端和本地模型。

### 3. Agent Studio
创建和管理 AI 智能体，赋予它们各种工具能力。

### 4. Knowledge Graph
可视化代码库的知识图谱，理解代码结构和依赖关系。

### 5. Skill Hub
存储和管理各种技能能力，支持导入导出。

### 6. Wiki 知识库
文档管理中心，支持多种格式的文档导入。

## 快速开始

1. 点击顶部导航切换到不同模块
2. 在 Model Hub 中配置您的 AI 模型
3. 创建智能体并赋予它们工具
4. 在 Forge AI 中编写代码
5. 使用 Knowledge Graph 分析代码结构

---

*文档版本: 1.0*`,
    format: 'markdown',
    tags: ['welcome', 'introduction', 'guide'],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    children: []
  },
  {
    id: 'wiki_api_reference',
    title: 'API 参考文档',
    content: `# API 参考文档

## 基础端点

### GET /api/health

检查服务健康状态

**响应示例:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2026-06-01T12:00:00Z"
}
\`\`\`

### POST /api/agent/chat

与智能体进行对话

**请求体:**
\`\`\`json
{
  "agentId": "agent_coder",
  "message": "帮我写一个快速排序算法",
  "context": {}
}
\`\`\`

**响应示例:**
\`\`\`json
{
  "success": true,
  "response": "好的，这是快速排序算法的实现...",
  "tokens": 150
}
\`\`\`

### POST /api/skill/execute

执行技能

**请求体:**
\`\`\`json
{
  "skillId": "skill_data_analyzer",
  "parameters": {
    "dataset": "data.csv",
    "method": "统计摘要"
  }
}
\`\`\`

## 错误码

| 状态码 | 含义 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源未找到 |
| 500 | 服务器内部错误 |`,
    format: 'markdown',
    tags: ['api', 'reference', 'documentation'],
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: '2026-06-03T15:30:00Z',
    children: []
  },
  {
    id: 'wiki_best_practices',
    title: '最佳实践指南',
    content: `# 最佳实践指南

## 智能体开发

### 1. 系统提示词设计

保持系统提示词简洁明确，明确智能体的角色和能力范围。

### 2. 工具使用

合理使用工具，避免不必要的调用。

### 3. 权限管理

根据智能体的用途分配适当的权限等级：
- read_only: 仅读取权限
- workspace_write: 可修改工作区文件
- shell: 可执行终端命令

## 技能开发

### 1. 参数设计

为技能设计清晰的参数，标记必填项。

### 2. 错误处理

在技能代码中添加适当的错误处理。

### 3. 代码规范

遵循统一的代码风格，添加必要的注释。

## 知识库管理

### 1. 文档分类

使用标签对文档进行分类管理。

### 2. 版本控制

定期更新文档，保持内容最新。

### 3. 格式选择

根据内容类型选择合适的文档格式：
- Markdown: 文档说明、指南
- JSON: 配置文件
- Python/TypeScript: 代码示例`,
    format: 'markdown',
    tags: ['best-practices', 'guide', 'development'],
    createdAt: '2026-06-04T00:00:00Z',
    updatedAt: '2026-06-05T09:15:00Z',
    children: []
  }
];
