/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, Wrench, Shield, Sliders, Play, Plus, Sparkles, Send, Trash, Edit, RefreshCw, Layers, Check, Loader, BookOpen } from 'lucide-react';
import { Agent, ModelConfig, PermissionTier, Skill, WikiPage } from '../types';

interface AgentStudioProps {
  agents: Agent[];
  models: ModelConfig[];
  skills: Skill[];
  wikiPages: WikiPage[];
  onAddAgent: (newAgent: Agent) => void;
  onUpdateAgent: (updated: Agent) => void;
  onDeleteAgent: (id: string) => void;
  defaultModelId: string;
}

export default function AgentStudio({ agents, models, skills, wikiPages, onAddAgent, onUpdateAgent, onDeleteAgent, defaultModelId }: AgentStudioProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // Custom generator state
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Configuration editing states
  const [activeTab, setActiveTab] = useState<'profile' | 'prompt' | 'tools' | 'skills' | 'knowledge' | 'params'>('profile');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelId, setModelId] = useState('');
  const [temperature, setTemperature] = useState(0.4);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [tools, setTools] = useState<string[]>([]);
  const [agentSkills, setAgentSkills] = useState<string[]>([]);
  const [permissionTier, setPermissionTier] = useState<PermissionTier>('workspace_write');
  
  // Knowledge search state
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<WikiPage[]>([]);

  // Sandbox chat simulation state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Enter sandbox parameters, configure parameters, or chat directly to test runtime scopes.' }
  ]);
  const [isSandboxTyping, setIsSandboxTyping] = useState(false);

  // Initialize selected agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      handleSelectAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setName(agent.name);
    setAvatar(agent.avatar);
    setDescription(agent.description);
    setSystemPrompt(agent.systemPrompt);
    setModelId(agent.defaultModelId);
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens);
    setTools(agent.tools);
    setAgentSkills(agent.skills || []);
    setPermissionTier(agent.permissionTier);
    
    // Reset test chat
    setChatMessages([
      { role: 'assistant', content: `Hello! I am the ${agent.name} Sandbox simulator. Customize my parameters and query my instructions here.` }
    ]);
  };

  const handleToggleSkill = (skillId: string) => {
    setAgentSkills(prev => prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]);
  };

  const handleKnowledgeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setKnowledgeSearch(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    const results = wikiPages.filter(page => 
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const updatedAgent: Agent = {
      ...selectedAgent,
      name,
      avatar,
      description,
      systemPrompt,
      defaultModelId: modelId,
      temperature,
      maxTokens,
      tools,
      skills: agentSkills,
      permissionTier,
    };

    onUpdateAgent(updatedAgent);
    setSelectedAgent(updatedAgent);
    
    // Show validation alert in non-blocking CSS style
    const badge = document.getElementById("save_complete_badge");
    if (badge) {
      badge.classList.remove("opacity-0");
      setTimeout(() => badge.classList.add("opacity-0"), 1500);
    }
  };

  const handleToggleTool = (tool: string) => {
    setTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  // Generate Agent via Server-Side API integration
  const handleGenerateAgent = async () => {
    if (!generatorPrompt) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: generatorPrompt })
      });

      if (!response.ok) {
        throw new Error("Generation context failed");
      }

      const generated: Omit<Agent, 'id' | 'createdAt'> = await response.json();
      
      const newAgent: Agent = {
        ...generated,
        id: `agent_${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      onAddAgent(newAgent);
      handleSelectAgent(newAgent);
      setGeneratorPrompt('');
    } catch (err) {
      console.error("Agent creation pipeline returned error", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Real/Mock turn inside Sandbox Playground
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput || !selectedAgent) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsSandboxTyping(true);

    try {
      // Setup payload representing exact Agent's current customizations
      const payload = {
        messages: [...chatMessages.filter(m => m.content !== 'Enter sandbox parameters...').map(m => ({
          role: m.role,
          content: m.content
        })), { role: 'user', content: userMsg }],
        agentSystemPrompt: systemPrompt,
        modelId: modelId,
        temperature,
        maxTokens
      };

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Chat sequence failed");
      }

      const result = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.text }]);
    } catch (err) {
      console.error("Test playground error", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Playground query timed out. Connect standard networks for testing AI profiles." }]);
    } finally {
      setIsSandboxTyping(false);
    }
  };

  const handleCreateEmptyAgent = () => {
    const emptyAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: 'Custom Task Specialist',
      avatar: '⚙️',
      description: 'Describe core goals to establish a specialized execution persona.',
      systemPrompt: 'You are an AI utility agent who conducts actions step by step with developer focus.',
      defaultModelId: defaultModelId || 'gemini-3.5-flash',
      temperature: 0.3,
      maxTokens: 4096,
      tools: ['read_file', 'edit_file', 'grep'],
      permissionTier: 'workspace_write',
      createdAt: new Date().toISOString()
    };
    onAddAgent(emptyAgent);
    handleSelectAgent(emptyAgent);
  };

  return (
    <div id="agent_studio_screen" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scale-95 animate-fade-in origin-top duration-300">
      
      {/* 1. AGENTS SELECTOR CHROME RAIL (3 COLUMNS) */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold">Agents Registry</span>
              <button
                onClick={handleCreateEmptyAgent}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                title="Create manually"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {agents.map(ag => {
                const isSelected = selectedAgent?.id === ag.id;
                return (
                  <div
                    key={ag.id}
                    onClick={() => handleSelectAgent(ag)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500/80' 
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 hover:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl px-1.5 py-1 bg-slate-900/90 rounded border border-slate-800">{ag.avatar}</span>
                      <div className="overflow-hidden">
                        <span className="font-semibold text-xs text-slate-200 block truncate">{ag.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">{ag.description}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-800 mt-4 pt-4">
            <button
              onClick={handleCreateEmptyAgent}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-100 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 font-medium border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Manually Add Agent
            </button>
          </div>
        </div>
      </div>

      {/* 2. AGENT PARAMETER EDITOR TAB BLOCK (5 COLUMNS) */}
      <div className="lg:col-span-5">
        {selectedAgent ? (
          <form onSubmit={handleSaveAgent} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Header profile with logo / status indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl px-2.5 py-2 bg-slate-950 border border-slate-855 rounded-xl">{avatar}</span>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">Agent configuration</h3>
                    <p className="text-[10.5px] font-mono text-slate-500">LAST SYNCED: {selectedAgent.createdAt ? new Date(selectedAgent.createdAt).toLocaleDateString() : 'Active'}</p>
                  </div>
                </div>
                
                <span id="save_complete_badge" className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded flex items-center gap-1 opacity-0 transition-opacity duration-300 border border-emerald-900/40">
                  <Check className="w-3 h-3" /> Saved!
                </span>
              </div>

              {/* TABS BUTTON NAVIGATION */}
              <div className="flex border-b border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prompt')}
                  className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${activeTab === 'prompt' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tools')}
                  className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${activeTab === 'tools' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  Tools
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${activeTab === 'skills' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  Skills
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('knowledge')}
                  className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${activeTab === 'knowledge' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  Knowledge
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('params')}
                  className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${activeTab === 'params' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  Params
                </button>
              </div>

              {/* TABS CONTENT BLOCKS */}
              <div className="space-y-4">
                
                {/* TAB 1: General profile fields */}
                {activeTab === 'profile' && (
                  <div className="space-y-3.5 fade-in duration-200">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-1">Avatar Emoji</label>
                        <input
                          type="text"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 text-center text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-1">Agent Nickname</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-1">Platform Summary / Description</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-1">Inference Execution Engine</label>
                      <select
                        value={modelId}
                        onChange={(e) => setModelId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        {models.length === 0 ? (
                          <option value="">(⚠️ 请先前往 Model Hub 接入模型)</option>
                        ) : (
                          models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 2: System prompt setup instructions */}
                {activeTab === 'prompt' && (
                  <div className="space-y-2 fade-in">
                    <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500">Core System Directive (Persona Guidance)</label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 scrollbar-thin"
                      placeholder="e.g. Always suggest modular types..."
                      required
                    />
                  </div>
                )}

                {/* TAB 3: Tool binding and sandbox levels */}
                {activeTab === 'tools' && (
                  <div className="space-y-4 fade-in">
                    <div>
                      <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-2">Registered Workspace Capabilities (Tools)</label>
                      <div className="space-y-2">
                        {['read_file', 'edit_file', 'grep', 'terminal', 'knowledge_graph'].map(t => {
                          const isChecked = tools.includes(t);
                          return (
                            <label key={t} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900/80 hover:border-slate-800 cursor-pointer text-xs">
                              <span className="font-mono text-slate-300">{t}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleTool(t)}
                                className="w-4 h-4 accent-indigo-500 text-indigo-505 bg-slate-950 rounded"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-semibold">Security Sandbox Privilege Levels</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['read_only', 'workspace_write', 'shell'] as PermissionTier[]).map(level => {
                          const isSel = permissionTier === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setPermissionTier(level)}
                              className={`p-2.5 rounded border text-[10px] uppercase font-mono tracking-wider font-semibold transition-all ${
                                isSel 
                                  ? 'bg-red-950/30 border-red-900/60 text-red-400' 
                                  : 'bg-slate-950/45 border-slate-900 text-slate-500 hover:text-slate-400'
                              }`}
                            >
                              {level.replace('_', ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Skill Binding */}
                {activeTab === 'skills' && (
                  <div className="space-y-4 fade-in">
                    <div>
                      <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-2">Bind Skills to Agent</label>
                      <p className="text-[11px] text-slate-500 mb-3">Select skills from Skill Hub that this agent can execute</p>
                      <div className="space-y-2">
                        {skills.length === 0 ? (
                          <div className="text-center py-4 text-slate-500 text-xs">
                            <Wrench className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p>No skills available. Add skills in Skill Hub first.</p>
                          </div>
                        ) : (
                          skills.map(skill => {
                            const isChecked = agentSkills.includes(skill.id);
                            return (
                              <label key={skill.id} className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-900/80 hover:border-slate-800 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{skill.icon}</span>
                                  <div className="text-left">
                                    <span className="text-xs font-semibold text-slate-200">{skill.name}</span>
                                    <p className="text-[10px] text-slate-500">{skill.description}</p>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSkill(skill.id)}
                                  className="w-4 h-4 accent-indigo-500 text-indigo-505 bg-slate-950 rounded"
                                />
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Bound Skills: {agentSkills.length}</span>
                      <button
                        type="button"
                        onClick={() => setAgentSkills([])}
                        className="text-red-400 hover:text-red-300"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 6: Knowledge Base Access */}
                {activeTab === 'knowledge' && (
                  <div className="space-y-4 fade-in">
                    <div>
                      <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-500 mb-2">Knowledge Base Search</label>
                      <input
                        type="text"
                        value={knowledgeSearch}
                        onChange={handleKnowledgeSearch}
                        placeholder="Search documentation..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="max-h-[200px] overflow-y-auto">
                      {searchResults.length === 0 ? (
                        <div className="text-center py-6 text-slate-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          {knowledgeSearch ? (
                            <p className="text-xs">No results found for "{knowledgeSearch}"</p>
                          ) : (
                            <p className="text-xs">Search the knowledge base to find relevant documentation</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {searchResults.map(page => (
                            <div key={page.id} className="p-3 rounded bg-slate-950/60 border border-slate-900/80 hover:border-slate-800">
                              <h4 className="text-xs font-semibold text-slate-200">{page.title}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{page.content.slice(0, 100)}...</p>
                              <div className="flex items-center gap-2 mt-2">
                                {page.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Total Documents: {wikiPages.length}</span>
                        <span>Search Results: {searchResults.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 7: Core sliders configurations */}
                {activeTab === 'params' && (
                  <div className="space-y-4 fade-in">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                        <span>Temperature</span>
                        <span className="text-indigo-400 font-bold">{temperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Strict Precision</span>
                        <span>Fluid Creativity</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                        <span>Max Completion Boundary</span>
                        <span className="text-indigo-400 font-bold">{maxTokens} tokens</span>
                      </div>
                      <input
                        type="range"
                        min="512"
                        max="8192"
                        step="128"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>

            <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-between">
              {!selectedAgent.isBuiltIn ? (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAgent(selectedAgent.id);
                    setSelectedAgent(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-950 hover:bg-red-955/20 rounded transition-colors"
                >
                  Delete Agent
                </button>
              ) : (
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 font-semibold select-none">System Built-In</span>
              )}

              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] border border-indigo-400"
              >
                Apply Parameters
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl h-full flex flex-col items-center justify-center text-center">
            <Bot className="w-12 h-12 text-slate-650 mb-3" />
            <h4 className="font-semibold text-slate-200">No Agent Profile Selected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">Select or synthesize an executive Agent from the registry rail to begin parameters tailoring.</p>
          </div>
        )}
      </div>

      {/* 3. PROMPT GENERATOR HUB & REALTIME SANDBOX CHAT (4 COLUMNS) */}
      <div className="lg:col-span-4 space-y-4 flex flex-col justify-between h-full">
        
        {/* TOP COMPOSER: PROMPT BUILDER */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-slate-200">Generative Agent Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Specify a specialized prompt or mission goals, and the platform will use server-side schema inference to generate detailed instructions, parameters, and appropriate tools.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={generatorPrompt}
              disabled={isGenerating}
              onChange={(e) => setGeneratorPrompt(e.target.value)}
              placeholder="e.g. strict security code review expert..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-505"
            />
            <button
              onClick={handleGenerateAgent}
              disabled={isGenerating || !generatorPrompt}
              className="px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-200 hover:text-slate-100 text-xs font-semibold rounded-lg transition-all sm:flex items-center justify-center gap-1.5 active:scale-95 shrink-0 border border-indigo-400"
            >
              {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : 'Forge!'}
            </button>
          </div>
        </div>

        {/* BOTTOM COMPOSER: ACTIVE PLAYGROUND RUNTIME */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl flex flex-col flex-1 h-[320px] justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-slate-350">{name || 'Agent'} Sandbox</span>
              <span className="text-[9px] font-mono text-slate-500 block uppercase">Sandbox Node</span>
            </div>

            {/* MESSAGE CONTAINER */}
            <div className="space-y-3.5 overflow-y-auto max-h-[190px] pr-1">
              {chatMessages.map((msg, midx) => (
                <div key={midx} className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-850 text-slate-200 text-right ml-4' 
                    : 'bg-slate-950/80 text-slate-300 mr-4 border border-slate-900'
                }`}>
                  <span className="font-semibold text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-1">
                    {msg.role === 'user' ? 'TESTER' : name || 'RUNTIME'}
                  </span>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              {isSandboxTyping && (
                <div className="bg-slate-950 p-2 text-slate-500 italic text-[11px] rounded animate-pulse">
                  System tracing prompt sequences...
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE INPUT BAR */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-800 pt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              disabled={isSandboxTyping || !selectedAgent}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={selectedAgent ? "Send a quick test string..." : "Select an Agent to test..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-505"
            />
            <button
              type="submit"
              disabled={isSandboxTyping || !chatInput || !selectedAgent}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-950 hover:text-slate-900 rounded-lg transition-colors border border-indigo-450"
            >
              <Send className="w-4 h-4 fill-black text-black" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
