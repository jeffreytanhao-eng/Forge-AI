#!/usr/bin/env node

import { Command } from 'commander';
import { vibeCommand } from './commands/vibe';
import { AgentRegistry } from '@forge-ai/core';

// 初始化 AgentRegistry
AgentRegistry.initialize();

const program = new Command();

program
  .name('forge')
  .description('Forge AI - 知识图谱驱动的 Vibe Coding CLI')
  .version('0.1.0');

program
  .command('vibe <prompt>')
  .description('使用自然语言进行代码修改')
  .action(async (prompt: string) => {
    await vibeCommand(prompt);
  });

program.parse(process.argv);
