import type { ChildProcess } from 'child_process';
import { MCPTool, MCPResource, MCPCallToolResult, MCPClientConfig, MCPConnectionStatus } from './types.js';

export class MCPClient {
  readonly config: MCPClientConfig;
  private process: ChildProcess | null = null;
  private status: MCPConnectionStatus = 'disconnected';
  private buffer = '';
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }>();
  private requestId = 0;
  private capabilities: { tools?: unknown; resources?: unknown } = {};

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  getStatus(): MCPConnectionStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    if (this.status === 'connected') return;

    this.status = 'connecting';

    if (this.config.transport === 'stdio') {
      return this.connectStdio();
    } else if (this.config.transport === 'http') {
      return this.connectHttp();
    }

    throw new Error(`Unsupported transport: ${this.config.transport}`);
  }

  private connectStdio(): Promise<void> {
    return import('child_process').then(({ spawn }) => {
      return new Promise((resolve, reject) => {
        if (!this.config.command) {
          reject(new Error('stdio transport requires a command'));
          return;
        }

        try {
          this.process = spawn(this.config.command, this.config.args || [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, ...(this.config.env || {}) },
          });

        let initialized = false;

        this.process.stdout?.on('data', (data: Buffer) => {
          this.buffer += data.toString();
          this.processBuffer();
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          console.error(`[MCP:${this.config.id}] stderr:`, data.toString());
        });

        this.process.on('error', (err) => {
          this.status = 'error';
          reject(err);
        });

        this.process.on('close', (code) => {
          this.status = 'disconnected';
          this.process = null;
          if (!initialized) {
            reject(new Error(`Process exited with code ${code}`));
          }
        });

        this.sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'forge-ai', version: '0.1.0' },
        }).then((result) => {
          initialized = true;
          this.capabilities = result.capabilities || {};
          this.status = 'connected';
          resolve();
        }).catch(reject);
      } catch (err) {
        this.status = 'error';
        reject(err);
      }
    });
  });
  }

  private async connectHttp(): Promise<void> {
    if (!this.config.url) {
      throw new Error('HTTP transport requires a url');
    }
    this.status = 'connected';
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const message = JSON.parse(trimmed);
        this.handleMessage(message);
      } catch {
        console.warn(`[MCP:${this.config.id}] Failed to parse message:`, trimmed);
      }
    }
  }

  private handleMessage(message: any): void {
    if (message.id !== undefined) {
      const pending = this.pendingRequests.get(String(message.id));
      if (pending) {
        this.pendingRequests.delete(String(message.id));
        if (message.error) {
          pending.reject(new Error(message.error.message || 'MCP error'));
        } else {
          pending.resolve(message.result || {});
        }
      }
    }
  }

  private sendRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(String(id), { resolve, reject });
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(String(id));
        reject(new Error(`MCP request timed out: ${method}`));
      }, 30000);

      const originalReject = reject;
      this.pendingRequests.set(String(id), {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timeout);
          originalReject(reason);
        },
      });

      if (this.config.transport === 'stdio' && this.process?.stdin) {
        this.process.stdin.write(JSON.stringify(request) + '\n');
      } else {
        reject(new Error('Not connected'));
      }
    });
  }

  async listTools(): Promise<MCPTool[]> {
    if (this.status !== 'connected') {
      throw new Error('MCP client not connected');
    }
    const result = await this.sendRequest('tools/list');
    return result.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<MCPCallToolResult> {
    if (this.status !== 'connected') {
      throw new Error('MCP client not connected');
    }
    const result = await this.sendRequest('tools/call', { name, arguments: args });
    return result;
  }

  async listResources(): Promise<MCPResource[]> {
    if (this.status !== 'connected') {
      throw new Error('MCP client not connected');
    }
    const result = await this.sendRequest('resources/list');
    return result.resources || [];
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.status = 'disconnected';
    this.buffer = '';

    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('Client disconnected'));
    }
    this.pendingRequests.clear();
  }
}