import { MCPClient } from './MCPClient.js';
import { MCPClientConfig, MCPConnectionStatus } from './types.js';

interface MCPServiceEntry {
  client: MCPClient;
  config: MCPClientConfig;
  status: MCPConnectionStatus;
  lastError?: string;
}

export class MCPRegistryClass {
  private services = new Map<string, MCPServiceEntry>();

  register(config: MCPClientConfig): MCPClient {
    if (this.services.has(config.id)) {
      console.warn(`MCP service "${config.id}" already registered. Overwriting.`);
      this.services.get(config.id)?.client.disconnect();
    }

    const client = new MCPClient(config);
    this.services.set(config.id, {
      client,
      config,
      status: 'disconnected',
    });

    return client;
  }

  unregister(id: string): void {
    const entry = this.services.get(id);
    if (entry) {
      entry.client.disconnect();
      this.services.delete(id);
    }
  }

  getClient(id: string): MCPClient | undefined {
    return this.services.get(id)?.client;
  }

  getAllServices(): Array<{ id: string; config: MCPClientConfig; status: MCPConnectionStatus; lastError?: string }> {
    return Array.from(this.services.entries()).map(([id, entry]) => ({
      id,
      config: entry.config,
      status: entry.status,
      lastError: entry.lastError,
    }));
  }

  async connectAll(): Promise<void> {
    for (const [id, entry] of this.services) {
      try {
        await entry.client.connect();
        entry.status = 'connected';
      } catch (err) {
        entry.status = 'error';
        entry.lastError = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[MCP] Failed to connect "${id}":`, entry.lastError);
      }
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [, entry] of this.services) {
      await entry.client.disconnect();
      entry.status = 'disconnected';
    }
  }

  hasService(id: string): boolean {
    return this.services.has(id);
  }
}

export const MCPRegistry = new MCPRegistryClass();