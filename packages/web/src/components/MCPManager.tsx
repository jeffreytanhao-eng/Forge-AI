import React, { useState, useEffect } from 'react';
import { Server, Plug, Power, PowerOff, Trash, Plus, Play, Terminal } from 'lucide-react';
import { MCPRegistry, MCPClient, MCPClientConfig, filesystemMCPConfig, gitMCPConfig, terminalMCPConfig } from '@forge-ai/core';

interface MCPServiceView {
  id: string;
  name: string;
  transport: string;
  status: string;
  lastError?: string;
  tools: string[];
}

export default function MCPManager() {
  const [services, setServices] = useState<MCPServiceView[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({ id: '', command: '', args: '', url: '' });
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<{ svcId: string; tool: string } | null>(null);

  const refreshServices = () => {
    const allServices = MCPRegistry.getAllServices();
    setServices(allServices.map(s => ({
      id: s.id,
      name: s.config.name || s.id,
      transport: s.config.transport,
      status: s.status,
      lastError: s.lastError,
      tools: [],
    })));
  };

  useEffect(() => {
    try {
      const existingIds = MCPRegistry.getAllServices().map(s => s.id);
      if (!existingIds.includes('filesystem')) MCPRegistry.register(filesystemMCPConfig);
      if (!existingIds.includes('git')) MCPRegistry.register(gitMCPConfig);
      if (!existingIds.includes('terminal')) MCPRegistry.register(terminalMCPConfig);
    } catch {}
    refreshServices();
  }, []);

  const handleConnect = async (id: string) => {
    const client = MCPRegistry.getClient(id);
    if (client) {
      try {
        await client.connect();
        refreshServices();
      } catch (err) {
        refreshServices();
      }
    }
  };

  const handleDisconnect = async (id: string) => {
    const client = MCPRegistry.getClient(id);
    if (client) {
      await client.disconnect();
      refreshServices();
    }
  };

  const handleRemove = (id: string) => {
    MCPRegistry.unregister(id);
    refreshServices();
  };

  const handleAdd = () => {
    if (!newService.id) return;

    const config: MCPClientConfig = {
      id: newService.id,
      name: newService.id,
      transport: newService.url ? 'http' : 'stdio',
      command: newService.command || undefined,
      args: newService.args ? newService.args.split(',').map(a => a.trim()) : undefined,
      url: newService.url || undefined,
    };

    MCPRegistry.register(config);
    setNewService({ id: '', command: '', args: '', url: '' });
    setShowAddForm(false);
    refreshServices();
  };

  const handleTestTool = async (svcId: string, tool: string) => {
    const client = MCPRegistry.getClient(svcId);
    if (!client) return;

    try {
      if (client.getStatus() !== 'connected') {
        await client.connect();
      }
      setTestOutput(`[${svcId}] 调用工具: ${tool}...\n`);
      const result = await client.callTool(tool, {});
      const output = result.content.map(c => c.text || '').join('\n');
      setTestOutput(`[${svcId}] 结果:\n${output}`);
    } catch (err) {
      setTestOutput(`[${svcId}] 错误: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleListTools = async (id: string) => {
    const client = MCPRegistry.getClient(id);
    if (!client) return;

    try {
      if (client.getStatus() !== 'connected') {
        await client.connect();
      }
      const tools = await client.listTools();
      setServices(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, tools: tools.map(t => t.name) };
        }
        return s;
      }));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-violet-400" />
          <h1 className="text-xl font-bold">MCP 服务管理</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          添加服务
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="text-sm font-medium mb-3">添加 MCP 服务</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <input
              value={newService.id}
              onChange={e => setNewService(p => ({ ...p, id: e.target.value }))}
              placeholder="服务 ID"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={newService.command}
              onChange={e => setNewService(p => ({ ...p, command: e.target.value }))}
              placeholder="命令（stdio）"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={newService.args}
              onChange={e => setNewService(p => ({ ...p, args: e.target.value }))}
              placeholder="参数（逗号分隔）"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={newService.url}
              onChange={e => setNewService(p => ({ ...p, url: e.target.value }))}
              placeholder="或 HTTP URL"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newService.id}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-sm"
          >
            确认添加
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {services.map(svc => (
          <div key={svc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Plug className={`w-4 h-4 ${
                  svc.status === 'connected' ? 'text-green-400' :
                  svc.status === 'error' ? 'text-red-400' :
                  svc.status === 'connecting' ? 'text-yellow-400' :
                  'text-zinc-500'
                }`} />
                <span className="font-medium">{svc.id}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                svc.status === 'connected' ? 'bg-green-900 text-green-300' :
                svc.status === 'error' ? 'bg-red-900 text-red-300' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {svc.status}
              </span>
            </div>

            <div className="text-xs text-zinc-400 mb-3">
              传输方式: {svc.transport}
            </div>

            {svc.lastError && (
              <div className="text-xs text-red-400 mb-3 bg-red-900/20 p-2 rounded">
                {svc.lastError}
              </div>
            )}

            {svc.tools.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-zinc-400 mb-1">工具列表:</div>
                <div className="flex flex-wrap gap-1">
                  {svc.tools.map(tool => (
                    <button
                      key={tool}
                      onClick={() => handleTestTool(svc.id, tool)}
                      className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded"
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              {svc.status !== 'connected' ? (
                <button
                  onClick={() => handleConnect(svc.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-xs"
                >
                  <Power className="w-3 h-3" /> 连接
                </button>
              ) : (
                <button
                  onClick={() => handleDisconnect(svc.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-xs"
                >
                  <PowerOff className="w-3 h-3" /> 断开
                </button>
              )}
              <button
                onClick={() => handleListTools(svc.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs"
              >
                <Terminal className="w-3 h-3" /> 工具
              </button>
              <button
                onClick={() => handleRemove(svc.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs ml-auto"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {testOutput && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">测试输出</h3>
            <button onClick={() => setTestOutput(null)} className="text-xs text-zinc-400 hover:text-zinc-200">
              清除
            </button>
          </div>
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{testOutput}</pre>
        </div>
      )}
    </div>
  );
}