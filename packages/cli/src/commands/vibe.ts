import chalk from 'chalk';
import { AgentRegistry } from '@forge-ai/core';

export async function vibeCommand(prompt: string) {
  console.log(chalk.blue(`\n[Forge] 开始 Vibe Coding：${prompt}\n`));

  const agent = AgentRegistry.getCurrentAgent();
  if (!agent) {
    console.log(chalk.red('没有可用的 Agent！'));
    return;
  }

  const result = await agent.sendPrompt(prompt, {
    workspaceFiles: [],
  });

  console.log(chalk.green('\n[计划]'));
  console.log(result.plan);

  if (result.diffs.length > 0) {
    console.log(chalk.yellow('\n[变更预览]'));
    result.diffs.forEach((d, i) => {
      console.log(`${i + 1}. ${d.file} - ${d.description || ''}`);
    });

    console.log(chalk.gray('\n（后续版本将支持确认后自动应用 diffs）'));
  }
}
