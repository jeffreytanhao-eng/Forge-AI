/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelProvider, ModelConfig, Agent, WorkspaceFile, CodeKnowledgeGraph, PlatformTheme } from '../types';

export const INITIAL_PROVIDERS: ModelProvider[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    category: 'cloud',
    apiKey: 'INJECTED_ENV_KEY',
    status: 'connected',
    latency: 180,
    modelsCount: 6,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'cloud',
    apiKey: '••••••••••••••••••••••••',
    status: 'connected',
    latency: 240,
    modelsCount: 4,
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-5.5',
    category: 'cloud',
    apiKey: '',
    status: 'disconnected',
    modelsCount: 5,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI V4',
    category: 'cloud',
    apiKey: '',
    status: 'disconnected',
    modelsCount: 3,
  },
  {
    id: 'vllm_local',
    name: 'Local vLLM',
    category: 'local',
    status: 'disconnected',
    modelsCount: 0,
  },
  {
    id: 'ollama_local',
    name: 'Local Ollama',
    category: 'local',
    apiKey: 'http://localhost:11434',
    status: 'connected',
    latency: 15,
    modelsCount: 4,
  }
];

export const INITIAL_MODELS: ModelConfig[] = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Default)', providerId: 'google', tier: 'fast', contextLength: '1M' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Reasoning)', providerId: 'google', tier: 'reasoning', contextLength: '2M' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', providerId: 'anthropic', tier: 'coding', contextLength: '200k' },
  { id: 'claude-3-5-opus', name: 'Claude 3.5 Opus', providerId: 'anthropic', tier: 'flagship', contextLength: '200k' },
  { id: 'gpt-5-omni', name: 'GPT-5 Omni (Preview)', providerId: 'openai', tier: 'flagship', contextLength: '128k' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', providerId: 'openai', tier: 'fast', contextLength: '128k' },
  { id: 'deepseek-v4', name: 'DeepSeek-V4', providerId: 'deepseek', tier: 'flagship', contextLength: '64k' },
  { id: 'deepseek-coder-r1', name: 'DeepSeek-R1 (Reasoning)', providerId: 'deepseek', tier: 'reasoning', contextLength: '128k' },
  { id: 'qwen-2.5-coder-7b', name: 'Qwen 2.5 Coder 7B (Ollama)', providerId: 'ollama_local', tier: 'coding', contextLength: '32k' },
  { id: 'llama-3.3-8b', name: 'Llama 3.3 8B (Ollama)', providerId: 'ollama_local', tier: 'fast', contextLength: '32k' },
];

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
  logoText: 'ForgeAI'
};
