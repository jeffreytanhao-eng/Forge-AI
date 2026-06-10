#!/usr/bin/env node

import { Command } from 'commander';
import { vibeCommand } from './commands/vibe';
import { AgentRegistry, MockAgent, DoubaoAgent } from '@forge-ai/core';
import dotenv from 'dotenv';

dotenv.config();

// 注册 Mock Agent（作为后备）
AgentRegistry.register(new MockAgent());

// 尝试注册 DoubaoAgent（如果环境变量存在）
const doubaoApiKey = process.env.DOUBAO_API_KEY;
const doubaoModel = process.env.DOUBAO_MODEL || 'ep-20240606123456-xxxxx';

if (doubaoApiKey) {
  AgentRegistry.register(new DoubaoAgent(doubaoApiKey, doubaoModel));
  console.log('[Forge] 豆包大模型已注册');
} else {
  console.log('[Forge] 未找到 DOUBAO_API_KEY，使用 Mock Agent');
}

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

program.parse(process.argv);
