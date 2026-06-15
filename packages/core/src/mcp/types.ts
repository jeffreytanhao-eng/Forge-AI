export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPCallToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface MCPClientConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export type MCPConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';