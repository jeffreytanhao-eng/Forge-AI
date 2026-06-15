#!/usr/bin/env node

import { Command } from 'commander';
import { vibeCommand } from './commands/vibe.js';
import { registerAgentCommand } from './commands/agent.js';
import { registerConfigCommand } from './commands/config.js';
import { registerMCPCommand } from './commands/mcp.js';
import { registerWikiCommand } from './commands/wiki.js';
import { registerSkillCommand } from './commands/skill.js';
import { registerGraphCommand } from './commands/graph.js';
import { AgentRegistry, MockAgent, DoubaoAgent, ModelRegistry, OpenAIProvider, AnthropicProvider, OllamaProvider, GeminiProvider } from '@forge-ai/core';
import dotenv from 'dotenv';

dotenv.config();

AgentRegistry.register(new MockAgent());

const doubaoApiKey = process.env.DOUBAO_API_KEY;
const doubaoModel = process.env.DOUBAO_MODEL || 'ep-20240606123456-xxxxx';

if (doubaoApiKey) {
  AgentRegistry.register(new DoubaoAgent(doubaoApiKey, doubaoModel));
  console.log('[Forge] 豆包大模型已注册');
} else {
  console.log('[Forge] 未找到 DOUBAO_API_KEY，使用 Mock Agent');
}

ModelRegistry.register(new OpenAIProvider());
ModelRegistry.register(new AnthropicProvider());
ModelRegistry.register(new OllamaProvider());
ModelRegistry.register(new GeminiProvider());

const program = new Command();

program
  .name('forge')
  .description('Forge AI - 知识图谱驱动的终端 Vibe Coding 工具')
  .version('0.1.0');

program
  .command('vibe <prompt>')
  .description('使用自然语言进行代码修改')
  .option('-a, --agent <id>', '指定使用的 Agent ID（如 doubao、claude）')
  .action(async (prompt: string, options) => {
    await vibeCommand(prompt, { agent: options.agent });
  });

registerAgentCommand(program);
registerConfigCommand(program);
registerMCPCommand(program);
registerWikiCommand(program);
registerGraphCommand(program);
registerSkillCommand(program);

program.parse(process.argv);
