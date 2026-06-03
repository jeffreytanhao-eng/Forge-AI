/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, Server, Layers, Code, Palette, Cpu, CheckCircle, Database, HelpCircle, LayoutDashboard, Terminal } from 'lucide-react';
import { ModelProvider, ModelConfig, Agent, PlatformTheme, WorkspaceFile } from './types';
import { INITIAL_PROVIDERS, INITIAL_MODELS, BUILTIN_AGENTS, DEFAULT_THEME, MOCK_WORKSPACES } from './data/mockData';

import ModelHub from './components/ModelHub';
import AgentStudio from './components/AgentStudio';
import ForgeIDE from './components/ForgeIDE';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import ThemeCustomizer from './components/ThemeCustomizer';

export default function App() {
  // Navigation State Configuration
  const [activeTab, setActiveTab] = useState<'model_hub' | 'agent_studio' | 'forge_ide' | 'knowledge_graph' | 'theme_customizer'>('forge_ide');
  
  // App state
  const [providers, setProviders] = useState<ModelProvider[]>(INITIAL_PROVIDERS);
  const [models, setModels] = useState<ModelConfig[]>(INITIAL_MODELS);
  const [agents, setAgents] = useState<Agent[]>(BUILTIN_AGENTS);
  
  const [activeAgentId, setActiveAgentId] = useState<string>('agent_coder');
  const [workspaceName, setWorkspaceName] = useState<'python_api' | 'ts_utils' | 'forge_platform'>('python_api');
  const [workspaceFiles, setWorkspaceFiles] = useState<{ [key: string]: WorkspaceFile[] }>(MOCK_WORKSPACES);
  const [graphRevision, setGraphRevision] = useState(0); // Revive symbol graphs on code commits
  const [theme, setTheme] = useState<PlatformTheme>(DEFAULT_THEME);

  // Connection metadata summary
  const activeProvidersCount = providers.filter(p => p.status === 'connected').length;

  useEffect(() => {
    // Load local storage states on mount if present
    const savedTheme = localStorage.getItem('forge_theme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme(parsed);
        // Inject color
        document.documentElement.style.setProperty('--primary', parsed.primaryColor);
      } catch (err) {
        console.warn("Theme parsing error on initial mount", err);
      }
    }
  }, []);

  const handleUpdateProvider = (updated: ModelProvider) => {
    setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddCustomModel = (model: ModelConfig) => {
    setModels(prev => [model, ...prev]);
  };

  const handleAddAgent = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
  };

  const handleUpdateAgent = (updated: Agent) => {
    setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (activeAgentId === id && agents.length > 1) {
      setActiveAgentId(agents.find(a => a.id !== id)?.id || '');
    }
  };

  const handleUpdateTheme = (updatedTheme: PlatformTheme) => {
    setTheme(updatedTheme);
    localStorage.setItem('forge_theme', JSON.stringify(updatedTheme));
  };

  const handleUpdateGraphRevision = () => {
    setGraphRevision(prev => prev + 1);
  };

  // Compute active background styles classes matching Theme choices
  const getBackgroundClass = () => {
    switch (theme.backgroundStyle) {
      case 'glass-dark':
        return 'bg-slate-950 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/20 text-slate-100 min-h-screen';
      case 'dark':
        return 'bg-black text-slate-100 min-h-screen';
      case 'light':
        return 'bg-[#f8fafc] text-slate-800 min-h-screen';
      case 'slate-cyber':
      default:
        return 'bg-[#030712] text-slate-200 min-h-screen';
    }
  };

  return (
    <div className={`${getBackgroundClass()} flex flex-col font-sans transition-all duration-350`}>
      
      {/* 1. TOP FUTURISTIC PLATFORM HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-950/45 backdrop-blur-2xl px-5 py-3 sticky top-0 z-50 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & workspace info */}
          <div id="platform_header_brand" className="flex items-center gap-3 transition-all duration-305 origin-left">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold tracking-widest text-lg border relative shadow-md"
              style={{ 
                color: theme.primaryColor, 
                borderColor: `${theme.primaryColor}50`,
                backgroundColor: `${theme.primaryColor}10`
              }}
            >
              O
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-450 border border-slate-950 animate-ping" />
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-slate-100 font-sans">{theme.logoText}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-semibold border border-slate-705">Platform v1.0</span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-mono">WORKSPACE: <b className="text-slate-300 font-normal uppercase">{workspaceName.replace('_', ' ')}</b></p>
            </div>
          </div>

          {/* TAB ROUTING COMPONENT */}
          <nav className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-900 overflow-x-auto select-none gap-0.5">
            {[
              { id: 'forge_ide', label: 'CodeX', icon: Code },
              { id: 'model_hub', label: 'Model Hub', icon: Server },
              { id: 'agent_studio', label: 'Agent Studio', icon: Bot },
              { id: 'knowledge_graph', label: 'Knowledge Graph', icon: Layers },
              { id: 'theme_customizer', label: 'Branding', icon: Palette }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0 ${
                    isSelected 
                      ? 'bg-slate-800 font-bold text-slate-100 shadow-inner' 
                      : 'text-slate-400 hover:text-slate-205 hover:bg-slate-900/50'
                  }`}
                  style={isSelected ? { color: theme.primaryColor } : undefined}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* TELEMETRY METRIC FEEDBACK */}
          <div className="hidden lg:flex items-center gap-4 text-xs select-none">
            
            {/* Cloud systems status check */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Providers:</span>
              <span className="text-emerald-500 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                {activeProvidersCount} Connected
              </span>
            </div>

            {/* Local systems status check */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-450" />
              <span>vLLM:</span>
              <span className="text-emerald-400 font-bold font-mono">ONLINE</span>
            </div>

          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE TAB STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 md:py-8 overflow-x-hidden md:overflow-visible">
        
        {activeTab === 'model_hub' && (
          <ModelHub
            providers={providers}
            models={models}
            setProviders={setProviders}
            setModels={setModels}
            onUpdateProvider={handleUpdateProvider}
            onAddCustomModel={handleAddCustomModel}
          />
        )}

        {activeTab === 'agent_studio' && (
          <AgentStudio
            agents={agents}
            models={models}
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
            defaultModelId="gemini-3.5-flash"
          />
        )}

        {activeTab === 'forge_ide' && (
          <ForgeIDE
            agents={agents}
            activeAgentId={activeAgentId}
            onChangeActiveAgent={setActiveAgentId}
            workspaceName={workspaceName}
            onChangeWorkspace={setWorkspaceName}
            onUpdateGraph={handleUpdateGraphRevision}
            workspaceFiles={workspaceFiles[workspaceName] || []}
            onUpdateFiles={(files) => setWorkspaceFiles(prev => ({ ...prev, [workspaceName]: files }))}
          />
        )}

        {activeTab === 'knowledge_graph' && (
          <KnowledgeGraphView
            workspaceName={workspaceName}
            workspaceFiles={workspaceFiles[workspaceName] || []}
            graphRevision={graphRevision}
            onUpdateGraph={handleUpdateGraphRevision}
          />
        )}

        {activeTab === 'theme_customizer' && (
          <ThemeCustomizer
            theme={theme}
            onUpdateTheme={handleUpdateTheme}
          />
        )}

      </main>

      {/* 3. HUMBLE SYSTEM FOOTER STATUS */}
      <footer className="border-t border-slate-900 py-3.5 px-5 bg-slate-950 text-center select-none shrink-0 font-mono text-[10.5px] text-slate-500 flex flex-col md:flex-row justify-between max-w-7xl w-full mx-auto">
        <span className="flex items-center gap-1 justify-center md:justify-start">
          <Terminal className="w-3.5 h-3.5" /> Built explicitly for natural agentic integrations.
        </span>
        <span className="mt-1 md:mt-0">
          SYSTEM TIMESTAMP: UTC 2026-06-01
        </span>
      </footer>

    </div>
  );
}
