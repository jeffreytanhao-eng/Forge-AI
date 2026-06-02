/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Server, Cpu, Database, Eye, EyeOff, CheckCircle2, XCircle, Search, Play, Square, Activity, Loader } from 'lucide-react';
import { ModelProvider, ModelConfig, LocalServeInstance } from '../types';

interface ModelHubProps {
  providers: ModelProvider[];
  models: ModelConfig[];
  onUpdateProvider: (updated: ModelProvider) => void;
  onAddCustomModel: (model: ModelConfig) => void;
}

export default function ModelHub({ providers, models, onUpdateProvider, onAddCustomModel }: ModelHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  
  // Local vLLM Orchestrator State
  const [localInstances, setLocalInstances] = useState<LocalServeInstance[]>([
    {
      id: 'local_instance_1',
      modelName: 'DeepSeek-R1-Distill-Qwen-14B',
      gpuMemoryUsage: 0.85,
      tensorParallelSize: 1,
      port: 8000,
      pid: 24708,
      status: 'running',
      logs: [
        '[INFO] vLLM startup sequence initiated...',
        '[INFO] CUDA device detected: NVIDIA RTX 4090/Ada Lovelace (24GB VRAM)',
        '[INFO] Allocation factor: 85% of GPU memory pinned',
        '[INFO] Loading model weights from huggingface cache... (100%)',
        '[INFO] Model execution loaded successfully on node local:8000',
        '[INFO] OpenAI compatible route mapped to /v1/chat/completions',
        '[HEALTH] Connection pool validated. Idle latency: 12ms'
      ],
      vramDetails: '20.4 GB / 24.0 GB',
      startedAt: '2026-06-01 08:30:12'
    }
  ]);

  const [newVllmModel, setNewVllmModel] = useState('Qwen2.5-Coder-14B-Instruct');
  const [newGpuFactor, setNewGpuFactor] = useState(0.9);
  const [newTpSize, setNewTpSize] = useState(1);
  const [newPort, setNewPort] = useState(8001);
  const [isStartingInstance, setIsStartingInstance] = useState(false);

  // Connection testing sequencer
  const handleTestConnection = (provider: ModelProvider) => {
    setTestingId(provider.id);
    onUpdateProvider({ ...provider, status: 'testing' });
    
    setTimeout(() => {
      const isSuccess = provider.id === 'google' || provider.id === 'anthropic' || provider.id === 'ollama_local' || Math.random() > 0.3;
      const simulatedLatency = Math.floor(Math.random() * 200) + 120;
      
      onUpdateProvider({
        ...provider,
        status: isSuccess ? 'connected' : 'disconnected',
        latency: isSuccess ? simulatedLatency : undefined
      });
      setTestingId(null);
    }, 1200);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateVllmInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVllmModel) return;

    setIsStartingInstance(true);
    
    setTimeout(() => {
      const newInstance: LocalServeInstance = {
        id: `local_instance_${Date.now()}`,
        modelName: newVllmModel,
        gpuMemoryUsage: newGpuFactor,
        tensorParallelSize: newTpSize,
        port: newPort,
        pid: Math.floor(Math.random() * 9000) + 12000,
        status: 'running',
        logs: [
          `[INFO] Spawning child vLLM background subprocess on port ${newPort}...`,
          '[INFO] CUDA Device: GPU-0 selected.',
          `[INFO] Loading Weights for ${newVllmModel}...`,
          '[INFO] Warning: FlashAttention-2 initialized (optimized kernel)',
          '[HEALTH] Server active & healthy! Ready for inputs.'
        ],
        vramDetails: `${(24 * newGpuFactor).toFixed(1)} GB / 24.0 GB`,
        startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      setLocalInstances(prev => [newInstance, ...prev]);
      
      // Inject inside general model list
      onAddCustomModel({
        id: newVllmModel.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: `${newVllmModel} (vLLM)`,
        providerId: 'vllm_local',
        tier: 'flagship',
        contextLength: '32k',
        isCustom: true
      });

      setIsStartingInstance(false);
      // Reset defaults
      setNewVllmModel('');
    }, 1800);
  };

  const handleToggleInstance = (id: string) => {
    setLocalInstances(prev => prev.map(inst => {
      if (inst.id === id) {
        const isCurrentlyRunning = inst.status === 'running';
        return {
          ...inst,
          status: isCurrentlyRunning ? 'stopped' : 'running',
          logs: isCurrentlyRunning 
            ? [...inst.logs, `[SHUTDOWN] Subprocess tracking PID ${inst.pid} terminated explicitly by supervisor.`]
            : [...inst.logs, `[INFO] Restarting vLLM instance. Pinning port ${inst.port}...`, `[HEALTH] Connection pool verified.`]
        };
      }
      return inst;
    }));
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.providerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="model_hub_panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scale-95 animate-fade-in origin-top duration-300">
      
      {/* LEFT COLUMN: PROVIDERS CONFIGURATION (8 COLS) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* PROVIDER LOGS */}
        <div id="providers_sec" className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-slate-100">AI Model Provider Center</h3>
                <p className="text-xs text-slate-400">Configure connection strings and verify secure access credentials</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {providers.map(prov => (
              <div key={prov.id} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 transition-all hover:border-indigo-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${prov.category === 'cloud' ? 'bg-blue-950 text-blue-400' : 'bg-emerald-950 text-emerald-400'}`}>
                      {prov.category === 'cloud' ? <Database className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{prov.name}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          prov.status === 'connected' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 
                          prov.status === 'testing' ? 'bg-indigo-950 text-indigo-400 animate-pulse' : 
                          'bg-slate-850 text-slate-400'
                        }`}>
                          {prov.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {prov.category === 'cloud' ? 'Global HTTPS API Endpoint' : 'Local Host Server Instance'}
                      </p>
                    </div>
                  </div>

                  {/* Actions & key visual indicators */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {prov.status === 'connected' && prov.latency && (
                      <span className="text-xs text-emerald-400 font-mono bg-emerald-950/30 px-2 py-1 rounded">
                        {prov.latency} ms
                      </span>
                    )}
                    <button
                      onClick={() => handleTestConnection(prov)}
                      disabled={prov.status === 'testing'}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-slate-100 text-xs font-medium rounded-md transition-all active:scale-95 border border-slate-700"
                    >
                      {prov.status === 'testing' ? (
                        <span className="flex items-center gap-1.5">
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          Ping...
                        </span>
                      ) : 'Test Connection'}
                    </button>
                  </div>
                </div>

                {/* API Key configuration input block (Cloud only) */}
                {prov.id !== 'ollama_local' && prov.id !== 'vllm_local' && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-900 flex items-center gap-3">
                    <label className="text-[11px] font-mono font-medium text-slate-500 uppercase tracking-widest w-20">API Key:</label>
                    <div className="relative flex-1">
                      <input
                        type={showKeys[prov.id] ? 'text' : 'password'}
                        value={prov.apiKey || ''}
                        disabled={prov.id === 'google'} // Managed by system
                        onChange={(e) => onUpdateProvider({ ...prov, apiKey: e.target.value })}
                        placeholder={prov.id === 'google' ? 'GEMINI_API_KEY injected automatically' : `Enter key for ${prov.name}...`}
                        className="w-full pl-3 pr-10 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-300 font-mono focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(prov.id)}
                        className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-350"
                      >
                        {showKeys[prov.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CLOUD & LOCAL REGISTRY SEARCH */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-slate-100">Supported System LLM Models</h3>
              <p className="text-xs text-slate-400">Total {filteredModels.length} models matched in current workspace libraries</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search matching engines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {filteredModels.map(model => {
              const modelProvider = providers.find(p => p.id === model.providerId);
              return (
                <div key={model.id} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 hover:border-slate-800 transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-slate-300 text-xs block">{model.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5 block uppercase">{model.providerId}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium tracking-wide ${
                      model.tier === 'flagship' ? 'bg-rose-950 text-rose-450 border border-rose-900/40' :
                      model.tier === 'reasoning' ? 'bg-purple-950 text-purple-400 border border-purple-900/40' :
                      model.tier === 'coding' ? 'bg-amber-950 text-amber-400 border border-amber-900/40' :
                      'bg-slate-850 text-slate-400'
                    }`}>
                      {model.tier}
                    </span>
                  </div>
                  <div className="border-t border-slate-900/55 mt-2 pt-2 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500">Context: <b className="text-slate-400 font-mono font-normal">{model.contextLength}</b></span>
                    <span className="text-slate-500">Status: <b className={modelProvider?.status === 'connected' ? 'text-emerald-400' : 'text-slate-500'}>
                      {modelProvider?.status === 'connected' ? 'Active' : 'Offline'}
                    </b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: LOCAL VLLM MANAGER (5 COLS) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* NEW VLLM BOOT FORM */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100">Deploy Local vLLM Service</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Configure parameters to spawn an optimized inference server in an isolated background thread. Excellent for offline compliance testing.
          </p>

          <form onSubmit={handleCreateVllmInstance} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Model Identifier (HuggingFace / Path)</label>
              <input
                type="text"
                value={newVllmModel}
                onChange={(e) => setNewVllmModel(e.target.value)}
                placeholder="e.g. Qwen/Qwen2.5-Coder-7B-Instruct"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">GPU Mem Ratio</label>
                <select
                  value={newGpuFactor}
                  onChange={(e) => setNewGpuFactor(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value={0.55}>0.55 (Low VRAM)</option>
                  <option value={0.75}>0.75 (Standard)</option>
                  <option value={0.85}>0.85 (High)</option>
                  <option value={0.95}>0.95 (Total Max)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tensor Parallel (TP)</label>
                <select
                  value={newTpSize}
                  onChange={(e) => setNewTpSize(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value={1}>TP = 1 (Single GPU)</option>
                  <option value={2}>TP = 2 (Dual GPU)</option>
                  <option value={4}>TP = 4 (Quad GPU)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Local Port</label>
                <input
                  type="number"
                  value={newPort}
                  onChange={(e) => setNewPort(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
                  min={1024}
                  max={65535}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isStartingInstance}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 disabled:opacity-50 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] border border-emerald-400"
                >
                  {isStartingInstance ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-black" />
                      Boot Subprocess
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ACTIVE LOCAL SUBPROCESS INSTANCES CARDS */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">CUDA Node Supervisor</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
              {localInstances.filter(i => i.status === 'running').length} Active
            </span>
          </div>

          <div className="space-y-4">
            {localInstances.map(inst => (
              <div key={inst.id} className="bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-semibold block">{inst.modelName}</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                      <span>PID: <b className="text-slate-400">{inst.pid || 'N/A'}</b></span>
                      <span>Port: <b className="text-slate-400">{inst.port}</b></span>
                      <span>Speed: <b className="text-emerald-505 font-normal">74.2 t/s</b></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleInstance(inst.id)}
                    className={`p-1.5 rounded-md border text-slate-400 transition-all active:scale-90 ${
                      inst.status === 'running' 
                        ? 'border-red-900/50 bg-red-950/20 hover:bg-red-950/40 text-red-400' 
                        : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-emerald-400'
                    }`}
                  >
                    {inst.status === 'running' ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                </div>

                {/* GRAPH PANEL METRICS */}
                {inst.status === 'running' && (
                  <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-950/90 border border-slate-900 rounded p-2.5">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>GPU MEM (VRAM)</span>
                        <span className="text-slate-400">{inst.vramDetails}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${inst.gpuMemoryUsage * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>CUDA ENGINE CORE</span>
                        <span className="text-slate-400">72.4% Usage</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1010"
                          style={{ width: '72.4%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* LOGS STREAM DISPATCHER */}
                <div className="mt-4 text-[9.5px]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 select-none text-slate-500">Subprocess log tail</div>
                  <div className="bg-slate-900 rounded border border-slate-850 p-2 text-slate-400 max-h-24 overflow-y-auto leading-relaxed scrollbar-thin">
                    {inst.logs.map((log, lidx) => (
                      <div key={lidx} className={`${
                        log.includes('[HEALTH]') ? 'text-emerald-500' : 
                        log.includes('[SHUTDOWN]') ? 'text-red-400' : 
                        log.includes('[INFO]') ? 'text-slate-450' : 'text-indigo-400'
                      }`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
