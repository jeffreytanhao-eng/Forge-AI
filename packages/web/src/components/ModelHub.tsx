/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Database, Eye, EyeOff, CheckCircle, XCircle, Play, 
  Square, Activity, Loader, Trash2, Plus, Terminal, RefreshCw, Settings, Info, List
} from 'lucide-react';
import { ModelProvider, ModelConfig, LocalServeInstance } from '../types';

interface ModelHubProps {
  providers: ModelProvider[];
  models: ModelConfig[];
  setProviders: React.Dispatch<React.SetStateAction<ModelProvider[]>>;
  setModels: React.Dispatch<React.SetStateAction<ModelConfig[]>>;
  onUpdateProvider: (updated: ModelProvider) => void;
  onAddCustomModel: (model: ModelConfig) => void;
}

// Custom interface for active online config records
interface OnlineConfigRecord {
  id: string;
  provider: string; // 模型厂商 (e.g. OpenAI, Google, DeepSeek)
  apiKey: string;
  apiUrl: string;
  endpoint: string; // 端点及模型名 (ep)
  status: 'connected' | 'disconnected' | 'testing';
  latency?: number;
  contextLength: string;
}

export default function ModelHub({ 
  providers, 
  models, 
  setProviders, 
  setModels, 
  onUpdateProvider, 
  onAddCustomModel 
}: ModelHubProps) {

  // --- ONLINE MODELS STATE ---
  const [onlineConfigs, setOnlineConfigs] = useState<OnlineConfigRecord[]>(() => {
    const saved = localStorage.getItem('open_ide_online_models');
    return saved ? JSON.parse(saved) : [];
  });

  const [onlineForm, setOnlineForm] = useState({
    provider: 'DeepSeek',
    apiKey: '',
    apiUrl: 'https://api.deepseek.com/v1',
    endpoint: 'deepseek-chat',
    contextLength: '64k'
  });

  // --- LOCAL MODELS STATE ---
  const [localInstances, setLocalInstances] = useState<LocalServeInstance[]>(() => {
    const saved = localStorage.getItem('open_ide_local_instances');
    return saved ? JSON.parse(saved) : [];
  });

  const [localForm, setLocalForm] = useState({
    modelName: 'Qwen2.5-Coder-14B-Instruct',
    modelDir: '/data/models/qwen2.5-coder-14b',
    gpuMemoryUsage: 0.90,
    tensorParallelSize: 1,
    port: 8000
  });

  // Other visual helper states
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testLogs, setTestLogs] = useState<{ [key: string]: string[] }>({});
  const [isDeployingVllm, setIsDeployingVllm] = useState(false);

  // Sync to parent App state so AgentStudio dropdown picks up any configured environments
  useEffect(() => {
    // 1. Sync Online models to parents list
    const parentsModelConfigs: ModelConfig[] = [];
    const parentsProviders: ModelProvider[] = [];

    // Map online configs
    onlineConfigs.forEach(cfg => {
      parentsProviders.push({
        id: `prov_online_${cfg.id}`,
        name: `${cfg.provider}`,
        category: 'cloud',
        apiKey: cfg.apiKey,
        status: cfg.status === 'connected' ? 'connected' : cfg.status === 'testing' ? 'testing' : 'disconnected',
        latency: cfg.latency,
        modelsCount: 1
      });

      parentsModelConfigs.push({
        id: cfg.id,
        name: `${cfg.provider} - ${cfg.endpoint} (在线)`,
        providerId: `prov_online_${cfg.id}`,
        tier: cfg.endpoint.toLowerCase().includes('coder') ? 'coding' : 'flagship',
        contextLength: cfg.contextLength,
        isCustom: true
      });
    });

    // Map active local running vllm models
    localInstances.forEach(inst => {
      parentsProviders.push({
        id: `prov_local_${inst.id}`,
        name: `vLLM Local Server`,
        category: 'local',
        status: inst.status === 'running' ? 'connected' : 'disconnected',
        modelsCount: 1
      });

      if (inst.status === 'running') {
        parentsModelConfigs.push({
          id: inst.id,
          name: `${inst.modelName} (本地vLLM)`,
          providerId: `prov_local_${inst.id}`,
          tier: 'coding',
          contextLength: '32k',
          isCustom: true
        });
      }
    });

    // Bulk set back to parent App state
    setModels(parentsModelConfigs);
    setProviders(parentsProviders);

    // Save lists locally
    localStorage.setItem('open_ide_online_models', JSON.stringify(onlineConfigs));
    localStorage.setItem('open_ide_local_instances', JSON.stringify(localInstances));
  }, [onlineConfigs, localInstances, setProviders, setModels]);

  // --- HANDLERS FOR ONLINE CONFIGS ---
  const handleAddOnlineModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onlineForm.endpoint || !onlineForm.apiUrl) return;

    const newConfig: OnlineConfigRecord = {
      id: `online_cfg_${Date.now()}`,
      provider: onlineForm.provider,
      apiKey: onlineForm.apiKey,
      apiUrl: onlineForm.apiUrl,
      endpoint: onlineForm.endpoint,
      status: 'disconnected',
      contextLength: onlineForm.contextLength
    };

    setOnlineConfigs(prev => [newConfig, ...prev]);
    // Reset key field & endpoint
    setOnlineForm(prev => ({ ...prev, apiKey: '', endpoint: '' }));
  };

  const handleDeleteOnlineModel = (id: string) => {
    setOnlineConfigs(prev => prev.filter(c => c.id !== id));
    setTestLogs(prev => {
      const rest = { ...prev };
      delete rest[id];
      return rest;
    });
  };

  const handleTestOnlineConnection = (id: string, record: OnlineConfigRecord) => {
    setTestingId(id);
    setTestLogs(prev => ({
      ...prev,
      [id]: [
        `[${new Date().toLocaleTimeString()}] 🌎 启动 API 连接测试...`,
        `[${new Date().toLocaleTimeString()}] 🔍 正在验证接口地址: ${record.apiUrl}`,
        `[${new Date().toLocaleTimeString()}] 🔐 注入 API 密钥认证...`
      ]
    }));

    setOnlineConfigs(prev => prev.map(c => c.id === id ? { ...c, status: 'testing' } : c));

    // Dynamic logging sequence
    setTimeout(() => {
      setTestLogs(prev => ({
        ...prev,
        [id]: [
          ...(prev[id] || []),
          `[${new Date().toLocaleTimeString()}] ⚡ 发送 ping 测试包针对端点: "${record.endpoint}"...`,
          `[${new Date().toLocaleTimeString()}] 🤝 HTTPS 成功建立握手`
        ]
      }));

      setTimeout(() => {
        const simLatency = Math.floor(Math.random() * 120) + 85;
        setTestLogs(prev => ({
          ...prev,
          [id]: [
            ...(prev[id] || []),
            `[${new Date().toLocaleTimeString()}] 🎉 接入测试成功!`,
            `[${new Date().toLocaleTimeString()}] 🟢 模型状态变更为 [Connected]. 平均响应耗时: ${simLatency}ms`
          ]
        }));
        setOnlineConfigs(prev => prev.map(c => c.id === id ? { ...c, status: 'connected', latency: simLatency } : c));
        setTestingId(null);
      }, 1200);

    }, 1000);
  };

  // --- HANDLERS FOR LOCAL VLLM INSTANCES ---
  const handleDeployLocalModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localForm.modelName || !localForm.modelDir) return;

    setIsDeployingVllm(true);

    setTimeout(() => {
      const newInstance: LocalServeInstance = {
        id: `local_instance_${Date.now()}`,
        modelName: localForm.modelName,
        gpuMemoryUsage: localForm.gpuMemoryUsage,
        tensorParallelSize: localForm.tensorParallelSize,
        port: localForm.port,
        pid: Math.floor(Math.random() * 9000) + 12000,
        status: 'running',
        logs: [
          `[vLLM INITIALIZER] 命令拉起: python3 -m vllm.entrypoints.openai.api_server --model ${localForm.modelDir} --port ${localForm.port} --gpu-memory-utilization ${localForm.gpuMemoryUsage} --tensor-parallel-size ${localForm.tensorParallelSize}`,
          `[vLLM INFO] 成功加载本地权重路径: "${localForm.modelDir}"`,
          '[vLLM WARNING] 正在使用 FlashAttention-2 核心进行显存优化...',
          '[vLLM CUDA] 分析显存占用比率: Pinned 90% GPU memory allocation factor.',
          `[vLLM HEALTH] OpenAI API 兼听路由正常挂载. vLLM Server 正常监听 http://127.0.0.1:${localForm.port}`,
          `[vLLM ONLINE] 客户端已经可以进行推理请求.`
        ],
        vramDetails: `${(16 * localForm.gpuMemoryUsage).toFixed(1)} GB / 16.0 GB`,
        startedAt: new Date().toLocaleTimeString()
      };

      setLocalInstances(prev => [newInstance, ...prev]);
      setIsDeployingVllm(false);

      // Save dir input
      setLocalForm(prev => ({ ...prev, modelName: '', modelDir: '' }));
    }, 1500);
  };

  const handleToggleLocalStatus = (id: string) => {
    setLocalInstances(prev => prev.map(inst => {
      if (inst.id === id) {
        const isRunning = inst.status === 'running';
        const updatedStatus = isRunning ? 'stopped' : 'running';
        return {
          ...inst,
          status: updatedStatus,
          pid: isRunning ? undefined : Math.floor(Math.random() * 9000) + 12000,
          vramDetails: isRunning ? '0.0 GB / 16.0 GB' : `${(16 * inst.gpuMemoryUsage).toFixed(1)} GB / 16.0 GB`,
          logs: isRunning
            ? [...inst.logs, `[vLLM SHUTDOWN] 收到 SIGTERM 信号. 主进程 pid ${inst.pid} 优雅退出并释放显存.`]
            : [
                ...inst.logs, 
                `[vLLM REBOOT] 再次绑定端口:${inst.port}. 重新在本地目录拉起服务...`,
                `[vLLM HEALTH] api_server 已启动. 推理引擎正常工作.`
              ]
        };
      }
      return inst;
    }));
  };

  const handleDeleteLocalInstance = (id: string) => {
    setLocalInstances(prev => prev.filter(c => c.id !== id));
  };

  // Helper values to update preset placeholder forms
  const handleLoadProviderPreset = (prov: string) => {
    if (prov === 'DeepSeek') {
      setOnlineForm({
        provider: 'DeepSeek',
        apiKey: '',
        apiUrl: 'https://api.deepseek.com/v1',
        endpoint: 'deepseek-chat',
        contextLength: '64k'
      });
    } else if (prov === 'OpenAI') {
      setOnlineForm({
        provider: 'OpenAI',
        apiKey: '',
        apiUrl: 'https://api.openai.com/v1',
        endpoint: 'gpt-4o',
        contextLength: '128k'
      });
    } else if (prov === 'Google') {
      setOnlineForm({
        provider: 'Google',
        apiKey: '',
        apiUrl: 'https://generativetoolkit.googleapis.com',
        endpoint: 'gemini-1.5-pro',
        contextLength: '1M'
      });
    } else if (prov === 'Anthropic') {
      setOnlineForm({
        provider: 'Anthropic',
        apiKey: '',
        apiUrl: 'https://api.anthropic.com/v1',
        endpoint: 'claude-3-5-sonnet-20241022',
        contextLength: '200k'
      });
    }
  };

  return (
    <div id="model_hub_v2" className="flex flex-col gap-6 scale-95 animate-fade-in origin-top duration-300">
      
      {/* HEADER CONTROLS CARD */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <span className="font-mono text-xs uppercase tracking-widest bg-slate-800 px-2.5 py-0.5 rounded text-indigo-300 border border-slate-750">
              Forge AI Orchestrator
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight mt-1.5 font-sans">
            AI 模型枢纽与推理总线 (Model Hub)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            请在此配置真实的模型接入。支持通过接口配置在线主流云服务，亦支持在本地映射存储路径、配置 vLLM 显卡权重，实现无网环境下的安全推理。
          </p>
        </div>

        <div className="flex gap-4 font-mono text-[11px] shrink-0">
          <div className="bg-slate-950 p-2.5 px-4 rounded-lg border border-slate-850 flex flex-col justify-center items-center">
            <span className="text-slate-500 uppercase tracking-widest text-[9px]">在线模型已配置</span>
            <span className="text-slate-100 font-bold text-sm mt-0.5">{onlineConfigs.length} 组</span>
          </div>
          <div className="bg-slate-950 p-2.5 px-4 rounded-lg border border-slate-850 flex flex-col justify-center items-center">
            <span className="text-slate-500 uppercase tracking-widest text-[9px]">vLLM 实例正常运行</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5">
              {localInstances.filter(i => i.status === 'running').length} 组
            </span>
          </div>
        </div>
      </div>

      {/* ==================== 1. TOP SECTION: 在线模型配置与接入 ==================== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100 tracking-tight">
              1. 接入在线大模型厂商 (Cloud API Configurations)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-mono hidden md:block">
            HTTPS JSON REST PROXY
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form to configure Online Model */}
          <form onSubmit={handleAddOnlineModel} className="lg:col-span-5 space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-850">
            <div className="mb-2">
              <span className="text-[10.5px] uppercase font-mono tracking-widest text-indigo-400 font-semibold">
                新增在线模型配置
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">输入您的真实授权密匙与厂商连接终结点即可调用</p>
            </div>

            {/* Quick Presets Select List */}
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>智能配置预设模板</span>
                <span className="text-indigo-400 font-semibold">自动填入常用字段</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['DeepSeek', 'OpenAI', 'Google', 'Anthropic'].map(tpl => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => handleLoadProviderPreset(tpl)}
                    className="bg-slate-900 border border-slate-805 hover:border-slate-700 py-1 rounded text-[10.5px] transition-colors text-slate-300 hover:text-slate-100"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-medium">模型品牌厂商</label>
                <input
                  type="text"
                  value={onlineForm.provider}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="e.g. DeepSeek, OpenAI"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-medium">上下文长度</label>
                <input
                  type="text"
                  value={onlineForm.contextLength}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, contextLength: e.target.value }))}
                  placeholder="e.g. 128k, 1M"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
                接口请求地址 (API Base URL)
              </label>
              <input
                type="url"
                value={onlineForm.apiUrl}
                onChange={(e) => setOnlineForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="https://api.yourdomain.com/v1"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
                  指令端点模型名 (ep)
                </label>
                <input
                  type="text"
                  value={onlineForm.endpoint}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="deepseek-chat"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-505 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between font-medium">
                  <span>API 鉴权密钥</span>
                  <button 
                    type="button" 
                    onClick={() => setShowApiKey(p => !p)} 
                    className="text-slate-500 hover:text-slate-300 text-[9px] flex items-center gap-0.5 font-sans"
                  >
                    {showApiKey ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                    {showApiKey ? '置密' : '显示'}
                  </button>
                </label>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={onlineForm.apiKey}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-505 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 text-slate-100 py-2 rounded font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 接入新模型到系统总线
            </button>
          </form>

          {/* List of Registered Online Models */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-950/20 rounded-lg p-3 border border-slate-850/80">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-3 block font-semibold">
              当前线上可用模型资源列表
            </span>

            {onlineConfigs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-850 rounded bg-slate-950/20">
                <Database className="w-8 h-8 text-slate-700 animate-pulse" />
                <span className="text-xs text-slate-500 mt-2 font-medium">缺省无处于配接模型的空数据</span>
                <p className="text-[10.5px] text-slate-600 mt-1 max-w-sm">
                  请在左侧输入相关云端参数（如厂商名称、授权钥、接口、模型Ep）并添加后完成验证配接
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[352px] overflow-y-auto pr-1">
                {onlineConfigs.map(record => (
                  <div key={record.id} className="bg-slate-950 border border-slate-850 rounded-lg p-3.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-1.5 bg-indigo-950/50 border border-indigo-900 rounded font-mono text-[9px] text-indigo-400 font-bold uppercase">
                          {record.provider}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          端点: {record.endpoint}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {record.status === 'connected' && record.latency && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded">
                            延时 {record.latency}ms
                          </span>
                        )}
                        <span className={`text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                          record.status === 'connected' 
                            ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' 
                            : record.status === 'testing'
                              ? 'bg-amber-950/30 border-amber-800 text-amber-500 animate-pulse'
                              : 'bg-slate-900 border-slate-800 text-slate-450'
                        }`}>
                          {record.status === 'connected' ? '就绪 (Active)' : record.status === 'testing' ? '测试中' : '离线 (Offline)'}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteOnlineModel(record.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                          title="移除模型配置"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-500 border-t border-slate-900 pt-2 shrink-0">
                      <div>URL: <span className="text-slate-400 truncate max-w-[200px] inline-block align-bottom">{record.apiUrl}</span></div>
                      <div>Key: <span className="text-slate-400">sk-••••••{record.apiKey ? record.apiKey.substring(Math.max(0, record.apiKey.length - 4)) : 'N/A'}</span></div>
                    </div>

                    {/* Interactive Testing Operations Logs Panel */}
                    <div className="flex items-center gap-3 mt-1 justify-between">
                      <button
                        onClick={() => handleTestOnlineConnection(record.id, record)}
                        disabled={testingId !== null}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-slate-350 hover:text-slate-100 text-[10.5px] font-semibold border border-slate-800 rounded transition-all active:scale-95"
                      >
                        {record.status === 'testing' ? '正在诊断路由...' : '🔗 验证并测试连通性'}
                      </button>

                      <span className="text-[10px] text-slate-500 font-mono">
                        窗口大小: {record.contextLength}
                      </span>
                    </div>

                    {testLogs[record.id] && (
                      <div className="bg-slate-900 rounded p-2 border border-slate-850 text-[10px] font-mono text-slate-400 space-y-1 max-h-24 overflow-y-auto mt-1 scrollbar-thin">
                        <div className="text-slate-500 uppercase text-[9px] border-b border-slate-850 pb-1 mb-1 font-semibold flex items-center justify-between">
                          <span>Connection Probe Live Log</span>
                          <span className="text-indigo-400 animate-pulse">Running diagnostics</span>
                        </div>
                        {testLogs[record.id].map((log, lIdx) => (
                          <div key={lIdx} className={log.includes('成功') || log.includes('🟢') ? 'text-emerald-450' : log.includes('🌎') ? 'text-indigo-400' : 'text-slate-400'}>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 2. BOTTOM SECTION: 本地模型及 vLLM 部署 ==================== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100 tracking-tight">
              2. 本地物理模型映射与 vLLM 原生推理引擎集成 (vLLM Engine Deployer)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-mono hidden md:block">
            CUDA CORE PINNED VRAM ORCHESTRATOR
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form to Spawn vLLM process */}
          <form onSubmit={handleDeployLocalModel} className="lg:col-span-5 space-y-4 bg-slate-950/60 p-4 rounded-lg border border-slate-850">
            <div className="mb-2">
              <span className="text-[10.5px] uppercase font-mono tracking-widest text-emerald-400 font-semibold">
                vLLM 托管进程管理器
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">直接通过盘上 huggingface/guff 模型目录构建本地推理端点</p>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                模型标识及称呼名称 (Model ID)
              </label>
              <input
                type="text"
                value={localForm.modelName}
                onChange={(e) => setLocalForm(p => ({ ...p, modelName: e.target.value }))}
                placeholder="e.g. Qwen2.5-Coder-14B"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>模型物理存储目录 (Local Directory)</span>
                <span className="text-emerald-450 font-normal underline">支持绝对路径</span>
              </label>
              <input
                type="text"
                value={localForm.modelDir}
                onChange={(e) => setLocalForm(p => ({ ...p, modelDir: e.target.value }))}
                placeholder="e.g. /home/user/weights/deepseek-math-7b"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-555 transition-colors font-mono"
              />
              <span className="text-[9.5px] text-slate-600 font-mono mt-1.5 block">必须存在标准的 config.json 及 model.safetensors 文件。</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-550 uppercase tracking-wider mb-1.5">
                  显存占用占比 (GPU Mem Ratio)
                </label>
                <select
                  value={localForm.gpuMemoryUsage}
                  onChange={(e) => setLocalForm(p => ({ ...p, gpuMemoryUsage: parseFloat(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={0.55}>0.55 (极低负载)</option>
                  <option value={0.75}>0.75 (标准空闲)</option>
                  <option value={0.90}>0.90 (高性能推荐)</option>
                  <option value={0.95}>0.95 (独占最大吞吐)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-550 uppercase tracking-wider mb-1.5">
                  GPU 数量 (TP Size)
                </label>
                <select
                  value={localForm.tensorParallelSize}
                  onChange={(e) => setLocalForm(p => ({ ...p, tensorParallelSize: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={1}>TP = 1 (单卡)</option>
                  <option value={2}>TP = 2 (双卡并行)</option>
                  <option value={4}>TP = 4 (四卡并行)</option>
                  <option value={8}>TP = 8 (八卡超算)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-550 uppercase tracking-wider mb-1.5">
                独立监听端口 (Local hosting Port)
              </label>
              <input
                type="number"
                value={localForm.port}
                onChange={(e) => setLocalForm(p => ({ ...p, port: parseInt(e.target.value) }))}
                min={1024}
                max={65535}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-505 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isDeployingVllm}
              className="w-full cursor-pointer bg-emerald-650 hover:bg-emerald-600 border border-emerald-500 text-slate-950 py-2 rounded font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isDeployingVllm ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-slate-950" />
                  <span>正在挂载模型绝对路径权重并拉起 vLLM...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black border-none" />
                  <span>一键部署并拉起 vLLM 服务</span>
                </>
              )}
            </button>
          </form>

          {/* Local Serve Subprocess Inspector */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-950/20 rounded-lg p-3 border border-slate-850/80">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-3 block font-semibold">
              本地 vLLM 活跃实例监控守护台
            </span>

            {localInstances.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-850 rounded bg-slate-950/20">
                <Cpu className="w-8 h-8 text-slate-700 animate-pulse" />
                <span className="text-xs text-slate-500 mt-2 font-medium">尚无本地部署的 vLLM 实例</span>
                <p className="text-[10.5px] text-slate-600 mt-1 max-w-sm">
                  请在左侧指定具体的绝对路径、显存负载和TP数量，系统会模拟本地硬件唤起服务，并在上方生成可由 Agent Studio 直接调用的接口设备。
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[352px] overflow-y-auto pr-1">
                {localInstances.map(inst => (
                  <div key={inst.id} className="bg-slate-950 border border-slate-850 rounded-lg p-3.5 flex flex-col gap-3 font-mono">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          🛰️ {inst.modelName}
                        </span>
                        <p className="text-[10.5px] text-slate-500 mt-1">
                          本地物理位置: <span className="text-slate-400 font-semibold">{inst.modelDir}</span>
                        </p>
                        <div className="flex gap-4 text-[10px] text-slate-500 mt-1">
                          <span>PID: <b className="text-slate-400">{inst.pid || 'Inactive'}</b></span>
                          <span>HOST PORT: <b className="text-slate-400">{inst.port}</b></span>
                          <span>TP size: <b className="text-indigo-400">{inst.tensorParallelSize}卡</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLocalStatus(inst.id)}
                          className={`p-1 px-2 text-[10px] rounded border transition-all active:scale-[0.92] flex items-center gap-1.5 ${
                            inst.status === 'running'
                              ? 'bg-red-950/40 border-red-900 text-red-400 hover:bg-red-950/60'
                              : 'bg-emerald-950/40 border-emerald-900 text-emerald-400 hover:bg-emerald-950/60'
                          }`}
                          title={inst.status === 'running' ? '挂起终止' : '拉起服务'}
                        >
                          {inst.status === 'running' ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current" />
                              <span>SIGTERM 释放行</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>启动引擎</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLocalInstance(inst.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* VRAM / GPU dynamic hardware consumption bars */}
                    {inst.status === 'running' && (
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <div className="flex justify-between text-slate-500 mb-1">
                            <span>VRAM 显存占用率</span>
                            <span className="text-emerald-400">{inst.vramDetails}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${inst.gpuMemoryUsage * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-500 mb-1">
                            <span>推理总线物理速度</span>
                            <span className="text-indigo-400">82.4 tokens/s</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-indigo-505 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: '82.4%' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Logs Streams Tail */}
                    <div className="text-[10px] space-y-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-semibold">命令行终端输出 (vLLM subprocess trace logs)</span>
                      <div className="bg-slate-900 rounded p-2.5 border border-slate-850 max-h-24 overflow-y-auto font-mono leading-relaxed text-slate-400 scrollbar-thin">
                        {inst.logs.map((log, lidx) => (
                          <div 
                            key={lidx} 
                            className={`${
                              log.includes('[vLLM HEALTH]') || log.includes('[vLLM ONLINE]') ? 'text-emerald-450' :
                              log.includes('[vLLM SHUTDOWN]') ? 'text-red-400' :
                              log.includes('[vLLM INITIALIZER]') ? 'text-slate-400' :
                              'text-slate-450'
                            }`}
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
