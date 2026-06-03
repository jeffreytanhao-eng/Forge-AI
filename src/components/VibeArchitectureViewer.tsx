/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Radio, Sparkles, Zap, GitBranch, ChevronRight, 
  User, Clock, CheckCircle2, Database, Send, Play, Sliders, Code, Layers 
} from 'lucide-react';

interface VibeArchitectureViewerProps {
  onSuggestPatch?: (filename: string, originalCode: string, modifiedCode: string, explanation: string) => void;
}

export default function VibeArchitectureViewer({ onSuggestPatch }: VibeArchitectureViewerProps) {
  // Dual Channel Toggles
  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [modelName, setModelName] = useState('gemini-3.5-flash');
  const [baseUrl, setBaseUrl] = useState('https://api.google.com/gemini/v1');
  const [latency, setLatency] = useState(24);
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'testing' | 'offline'>('connected');
  
  // Timeline Milestones
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [timelineProgress, setTimelineProgress] = useState(15);

  // Prompt Emulator Sandbox
  const [selectedTemplate, setSelectedTemplate] = useState<'refactor' | 'feature' | 'prompt'>('refactor');
  const [vibeStyle, setVibeStyle] = useState('vaporwave-cyber');
  const [customDescription, setCustomDescription] = useState('Add relational ORM schemas to models.py');
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationOutput, setSimulationOutput] = useState('');

  // Handle Provider Changes
  useEffect(() => {
    if (provider === 'gemini') {
      setModelName('gemini-3.5-flash');
      setBaseUrl('https://api.google.com/gemini/v1');
      setLatency(24);
    } else {
      setModelName('qwen2.5-coder:7b');
      setBaseUrl('http://localhost:11434');
      setLatency(135);
    }
  }, [provider]);

  // Handle Timeline updates
  useEffect(() => {
    setTimelineProgress(activeWeek * 12.5);
  }, [activeWeek]);

  // Simulate prompt code translation
  const handleSimulateEndpoint = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatedLog([`[Handshake] Querying active ${provider.toUpperCase()} adapter...`]);
    setSimulationOutput('');

    setTimeout(() => {
      setSimulatedLog(prev => [...prev, `[Model] Context loaded: Flat Workspace nodes + Graphify schema`]);
    }, 400);

    setTimeout(() => {
      setSimulatedLog(prev => [...prev, `[Adapter] Matching VIBE style [${vibeStyle}] for code generation`]);
    }, 850);

    setTimeout(() => {
      setSimulatedLog(prev => [...prev, `[Continue.dev Engine v2.1] Synthesizing structural differential patch...`]);
    }, 1400);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedLog(prev => [...prev, `[Success] Code compilation passed. Ready to inject diff!`]);
      
      if (selectedTemplate === 'refactor') {
        setSimulationOutput(`// CodeX Vibe Code Patch - Inspired by Grok Architecture Spec
import { createEngine } from "sequelize";
import { databaseConfig } from "./config";

// Relational Entity Manager Instantiated
export const relationalAdapter = createEngine({
  vibe: "${vibeStyle}",
  modelChannel: "${modelName}",
  relations: ["main.py", "database.py", "models.py"],
  syncGraphify: true
});`);
      } else if (selectedTemplate === 'feature') {
        setSimulationOutput(`// Feature CodeX Core - Integrated relational schema
export function extendWorkspaceEntityGraph(workspaceId: string) {
  console.log("Vibe action executed on workspace:", workspaceId);
  return {
    extended: true,
    engine: "Continue.dev Bridge",
    selectedProvider: "${provider}",
    configuredModel: "${modelName}"
  };
}`);
      } else {
        setSimulationOutput(`// Prompts Config
export const PromptEngineeringSuite = {
  activeStyle: "${vibeStyle}",
  systemTemplate: "You are active within CodeX. Generate responses matched with structural graph variables."
};`);
      }
    }, 2000);
  };

  // Prepopulate form when template alters
  useEffect(() => {
    if (selectedTemplate === 'feature') {
      setCustomDescription('Extend file tree component to support custom subheaders');
    } else if (selectedTemplate === 'prompt') {
      setCustomDescription('Configure vaporwave coding assistant parameters');
    } else {
      setCustomDescription('Add relational ORM schemas to models.py');
    }
  }, [selectedTemplate]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 select-none scrollbar-thin">
      
      {/* Title Header with integrated badges */}
      <div className="mb-6 pb-4 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              VIBE ARCHITECTURE ACTIVE SPEC
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
              <Clock className="w-3.5 h-3.5" /> Checked: June 2026
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            CodeX Hybrid Vibe Coding IDE — Architecture Blueprint
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            You are viewing the interactive architectural roadmap for CodeX. Toggle models, simulate model adapter channels, and review multi-role PM/UX delivery metrics.
          </p>
        </div>

        {/* Live Channel Connection Node */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 px-4 shrink-0 flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase text-slate-500">Live Orchestrator Node</div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>{provider.toUpperCase()} Pipeline</span>
              <span className="text-[10px] text-slate-400 font-mono">({latency}ms)</span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE SECTION Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* PANEL 1: PIPELINE PIPING GRAPH VIEW (HYBRID VIBE ARCHITECT) */}
        <div className="col-span-1 lg:col-span-7 bg-slate-900/60 border border-slate-855 rounded-2xl p-5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-100 font-sans">1. Dual Model Adaptability Stream (aiAdapter.ts)</h4>
            </div>
            {/* Dynamic Provider Selector Pill */}
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex">
              <button 
                onClick={() => setProvider('gemini')}
                className={`px-2.5 py-1 text-[10.5px] font-mono font-semibold rounded-md transition-all ${provider === 'gemini' ? 'bg-indigo-650 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Cloud (Gemini)
              </button>
              <button 
                onClick={() => setProvider('ollama')}
                className={`px-2.5 py-1 text-[10.5px] font-mono font-semibold rounded-md transition-all ${provider === 'ollama' ? 'bg-indigo-650 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Local (Ollama)
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Unified adapter abstractly pipes natural language prompts into active LLM sockets. Enables rapid local development via Ollama loopback backend or enterprise scaling using the flagship Gemini model.
          </p>

          {/* Interactive Flow Visualizer Canvas Mockup */}
          <div className="flex-1 min-h-[220px] bg-slate-950/80 border border-slate-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden font-mono">
            
            {/* Ambient pipeline tracks */}
            <div className="absolute inset-0 flex items-center justify-around opacity-5 select-none pointer-events-none">
              <div className="w-0.5 h-full bg-indigo-500 border-dashed border-r" />
              <div className="w-0.5 h-full bg-indigo-500 border-dashed border-r" />
            </div>

            {/* NODE 1: USER INPUT */}
            <div className="flex items-center justify-between gap-4 z-10 w-full">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 px-3">
                <div className="text-[8px] uppercase text-indigo-400 mb-0.5 tracking-wider font-semibold">User Vibe Prompt</div>
                <div className="text-[10.5px] text-slate-300 truncate font-sans">"Add state manager triggers"</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              
              {/* NODE 2: ADAPTER LAYER */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 px-3 ring-1 ring-indigo-500/30">
                <div className="text-[8px] uppercase text-indigo-400 mb-0.5 tracking-wider font-semibold">AI Adapter (aiAdapter.ts)</div>
                <div className="text-[10.5px] text-slate-300 truncate font-semibold">
                  Channel: {provider === 'gemini' ? 'Google Cloud' : 'Ollama Core'}
                </div>
              </div>
            </div>

            {/* NODE TRANSITION ARROW LINES */}
            <div className="h-6 flex items-center justify-around z-10 select-none">
              <div className="w-0.5 h-full bg-indigo-500/30" />
              <div className="w-0.5 h-full bg-indigo-500/30 shadow-[0_0_8px_indigo]" />
            </div>

            {/* NODE 3: DUAL CHANNEL SPLITTER */}
            <div className="bg-slate-900 border border-slate-850 p-2 text-center rounded-lg text-[10px] font-bold text-slate-400 select-none mx-auto w-48 relative z-10 border-indigo-900">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-slate-950 px-2 py-0.5 text-[8px] text-indigo-400 uppercase rounded border border-indigo-900">Routing Router</div>
              Active Stream: {provider.toUpperCase()}
            </div>

            <div className="h-6 flex items-center justify-around z-10 select-none">
              <div className="w-0.5 h-full bg-indigo-500/30" />
              <div className="w-0.5 h-full bg-indigo-500/30" />
            </div>

            {/* NODE 4: OUTFLOW TARGET REVIEWS */}
            <div className="flex items-center justify-between gap-4 z-10 w-full">
              <div className="flex-1 bg-slate-900 border border-indigo-950 rounded-lg p-2.5 px-3">
                <div className="text-[8px] text-indigo-400 mb-0.5 uppercase tracking-wider font-semibold">Target File Context</div>
                <div className="text-[10px] text-slate-300">Flattened nodes schema relations</div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 px-3">
                <div className="text-[8px] text-emerald-400 mb-0.5 uppercase tracking-wider font-semibold">Apply Live Stage</div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 select-none" />
                  Monaco Code Sync
                </div>
              </div>
            </div>

          </div>

          {/* Connection Specs stats table */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 rounded-xl p-3 border border-slate-900 text-xs font-mono select-none">
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-semibold">Active endpoint</div>
              <div className="text-slate-300 text-[10.5px] truncate pt-0.5" title={baseUrl}>{baseUrl}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-semibold">Model Provider</div>
              <div className="text-indigo-400 text-[10.5px] font-semibold pt-0.5">{provider === 'gemini' ? 'Google Cloud Pro' : 'Local Ollama SDK'}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-semibold">Target Model String</div>
              <div className="text-slate-300 text-[10.5px] pt-0.5">{modelName}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-semibold">Security Tunnel</div>
              <div className="text-emerald-400 text-[10.5px] flex items-center gap-1 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                TLS Verified
              </div>
            </div>
          </div>

        </div>

        {/* PANEL 2: TIMELINE roadmaps & multirole perspective */}
        <div className="col-span-1 lg:col-span-5 bg-slate-900/60 border border-slate-855 rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-slate-850 pb-3 mb-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-100 font-sans">2. Vibe Roadmap Milestones (Pm / Dev / UX)</h4>
            </div>
            <span className="font-mono text-[10px] text-slate-500">Timeline Progress: {Math.round(timelineProgress)}%</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Select a project milestone below to view task briefs and specialized comments from lead engineers, product advocates, and design managers.
          </p>

          {/* Interactive GANTT Weeks timeline selection */}
          <div className="grid grid-cols-4 gap-2 mb-4 font-mono select-none shrink-0">
            {[1, 2, 3, 4].map((w) => {
              const isActive = activeWeek === w;
              const range = w === 1 ? 'W 1-2' : w === 2 ? 'W 3-4' : w === 3 ? 'W 5-6' : 'W 7-8';
              const label = w === 1 ? 'Adapter Setup' : w === 2 ? 'Monaco Vibe' : w === 3 ? 'Sync Graph' : 'PM Delivery';
              return (
                <button
                  key={w}
                  onClick={() => setActiveWeek(w)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isActive 
                      ? 'bg-slate-950 border-indigo-500/60 ring-1 ring-indigo-500/10' 
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 hover:bg-slate-950/60'
                  }`}
                >
                  <span className={`text-[9.5px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>{range}</span>
                  <span className={`text-[10px] truncate ${isActive ? 'text-slate-205 font-bold' : 'text-slate-450'}`}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Progress bar container */}
          <div className="h-1 w-full bg-slate-955 rounded-full overflow-hidden mb-4 shrink-0 select-none">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-450 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-300"
              style={{ width: `${timelineProgress}%` }}
            />
          </div>

          {/* Multirole perspective comments render box */}
          <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between text-xs space-y-3.5 min-h-[160px] overflow-y-auto">
            
            {/* PM Viewpoint */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 select-none">
                <User className="w-3.5 h-3.5" />
                <span>Product Advocate Insight</span>
              </div>
              <p className="text-slate-350 leading-relaxed text-[11px]">
                {activeWeek === 1 && "This architecture presents high strategic importance. Adapting models seamlessly establishes critical differentiation."}
                {activeWeek === 2 && "The inline composer triggers intuitive, flow-state programming. Smooth rendering in Monaco keeps developers highly captured."}
                {activeWeek === 3 && "Integrating metadata directly into semantic graphs enables developers to navigate refactored endpoints cleanly."}
                {activeWeek === 4 && "Delivering MVP within the 8-week horizon maximizes core platform values. Ready for beta-group enablement."}
              </p>
            </div>

            {/* Engineer Viewpoint */}
            <div className="space-y-1 border-t border-slate-900 pt-3">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-400 select-none">
                <Layers className="w-3.5 h-3.5" />
                <span>Lead Architect Tech Specs</span>
              </div>
              <p className="text-slate-350 leading-relaxed text-[11px]">
                {activeWeek === 1 && "Implementing unified adapter mapping allows developer computers to query local Ollama sockets at port 11434 with zero lag."}
                {activeWeek === 2 && "By utilizing modular state arrays, CodeX applies file patch recommendations visually on top of existing editing frames."}
                {activeWeek === 3 && "Graphify parser consumes Monaco AST buffers directly to map newly added variables, endpoints, and file weights."}
                {activeWeek === 4 && "Double-layered pytest integrations successfully isolate execution logic, ensuring developer codes compile safely."}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* PANEL 3: INTERACTIVE aiAdapter.ts PIPELINE PLAYGROUND (Emulates compilation output!) */}
      <div className="bg-slate-900/60 border border-slate-855 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-stretch">
        
        {/* Playground Controls Input Panel */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-3.5 max-w-xl">
            <div className="flex items-center gap-2 mb-1">
              <Code className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              <h4 className="text-sm font-semibold text-slate-100 font-sans">3. Interactive "aiAdapter.ts" Code Playground</h4>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize and try mock code integrations based on the Vibe architecture. Check compatibility variables and simulate output results.
            </p>

            <div className="grid grid-cols-2 gap-3 pb-2 font-mono text-xs select-none">
              
              {/* Select template */}
              <div className="space-y-1.5">
                <label className="block text-[9.5px] uppercase font-bold text-slate-500">Preset Objective</label>
                <div className="flex flex-col bg-slate-950 border border-slate-850 rounded-lg p-1.5 gap-1.5">
                  {[
                    { id: 'refactor', label: 'Refactor ORM Code' },
                    { id: 'feature', label: 'Feature Expansion' },
                    { id: 'prompt', label: 'Prompt Tuning Spec' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id as any)}
                      className={`text-left p-1.5 rounded text-[10.5px] font-semibold transition-all ${selectedTemplate === t.id ? 'bg-slate-800 text-indigo-400 font-bold border-l-2 border-indigo-500' : 'text-slate-400 hover:text-slate-205'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configure vibe style */}
              <div className="space-y-1.5 flex flex-col justify-between">
                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-slate-500 mb-1.5">Configure Vibe Theme Accent</label>
                  <select
                    value={vibeStyle}
                    onChange={(e) => setVibeStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 outline-none focus:border-indigo-500 text-[11px]"
                  >
                    <option value="vaporwave-cyber">Liquid Purple Vaporwave</option>
                    <option value="slate-cyber">Minimalist Cosmic Slate</option>
                    <option value="emerald-matrix">Matrix Terminal Green</option>
                    <option value="vintage-editorial">Editorial Warm Serif</option>
                  </select>
                </div>

                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900 border-dashed text-[10.5px] text-slate-400 leading-normal">
                  Pressing execute passes variables to compile simulated source modules.
                </div>
              </div>

            </div>

            {/* Custom Vibe prompt message */}
            <div className="space-y-1.5">
              <label className="block text-[9.5px] uppercase font-bold text-slate-500 font-mono">Custom Input Variable Context</label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Configure input parameters..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 text-[11.5px] font-mono"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-4 md:pt-0 max-w-xl">
            <button
              onClick={handleSimulateEndpoint}
              disabled={isSimulating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold rounded-xl text-slate-950 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none font-sans"
            >
              {isSimulating ? (
                <>
                  <Server className="w-4 h-4 animate-spin" />
                  <span>Invoking aiAdapter.ts compiler stream...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-slate-950" />
                  <span>Compile and Execute "aiAdapter.ts" pipeline simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Console & Stream output */}
        <div className="flex-1 min-w-0 bg-slate-950 border border-slate-900 rounded-2xl p-4.5 flex flex-col justify-between font-mono text-[11px] relative h-[280px]">
          
          {/* Top terminal headers */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 sticky top-0 shrink-0 bg-slate-950 select-none">
            <span className="text-slate-500 uppercase text-[9px] font-bold">Simulator Streams Log console</span>
            <span className="text-[9px] text-indigo-400 uppercase font-semibold">Port 11434 / HTTPS Live</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 mb-2.5 pr-2">
            
            {/* Render Simulated Logs */}
            {simulatedLog.map((log, idx) => (
              <div key={idx} className="text-slate-400 leading-relaxed hover:text-slate-200">
                <span className="text-indigo-500/80 mr-1.5 select-none">&gt;</span>
                {log}
              </div>
            ))}

            {isSimulating && (
              <div className="text-slate-500 animate-pulse text-[10px] pl-4">
                Processing pipeline...
              </div>
            )}

            {/* Simulated file output */}
            {simulationOutput && (
              <div className="mt-4 pt-4 border-t border-slate-900">
                <div className="flex items-center justify-between text-[9px] uppercase font-bold text-slate-500 mb-2">
                  <span>Output Code Differential (Diff Block)</span>
                  <span className="text-emerald-400">Syntax OK</span>
                </div>
                <pre className="text-slate-200 bg-slate-955 border border-slate-900 rounded-lg p-3 text-[10.5px] overflow-x-auto select-all leading-normal">
                  {simulationOutput}
                </pre>
              </div>
            )}

            {!isSimulating && simulatedLog.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-550 py-10">
                <Radio className="w-6 h-6 text-slate-800 mb-2 animate-bounce" />
                <p>Run pipeline compilation simulation above to verify integration endpoints and see simulated Code Diff outputs!</p>
              </div>
            )}

          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between select-none shrink-0">
            <span className="text-[9px] text-slate-500 truncate">Vibe IDE integration adapter adapter test logs</span>
            <span className="text-[9px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Active model: {modelName}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
