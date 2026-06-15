import { MCPClientConfig } from '../types.js';

function getCwd(): string {
  try {
    return process.cwd();
  } catch {
    return '/';
  }
}

export const filesystemMCPConfig: MCPClientConfig = {
  id: 'filesystem',
  name: 'File System',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', getCwd()],
};

export const gitMCPConfig: MCPClientConfig = {
  id: 'git',
  name: 'Git',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git'],
};

export const terminalMCPConfig: MCPClientConfig = {
  id: 'terminal',
  name: 'Terminal',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-terminal'],
};