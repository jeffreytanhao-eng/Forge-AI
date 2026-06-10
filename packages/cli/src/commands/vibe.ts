import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { AgentRegistry } from '@forge-ai/core';
import fs from 'fs/promises';
import path from 'path';

export async function vibeCommand(userPrompt: string) {
  console.log(chalk.blue.bold(`\n[Forge] 开始 Vibe Coding`));
  console.log(chalk.gray(`Prompt: ${userPrompt}\n`));

  const spinner = ora('正在调用模型...').start();

  // 获取默认 Agent（优先使用已注册的第一个）
  const agents = AgentRegistry.getAllAgents();
  if (agents.length === 0) {
    spinner.fail('没有注册任何 Agent！请先在代码中注册模型。');
    return;
  }

  const agent = agents[0]; // MVP 阶段默认用第一个（后续可做选择器）

  try {
    const result = await agent.sendPrompt(userPrompt, {
      workspaceFiles: [], // 后续接入真实项目文件扫描
    });

    spinner.succeed('模型返回成功');

    // 显示计划
    console.log(chalk.green.bold('\n【执行计划】'));
    console.log(result.plan);

    // 显示变更列表
    if (result.diffs.length > 0) {
      console.log(chalk.yellow.bold(`\n【将修改 ${result.diffs.length} 个文件】`));
      result.diffs.forEach((diff, index) => {
        console.log(`${index + 1}. ${chalk.cyan(diff.file)} ${diff.description ? `- ${diff.description}` : ''}`);
      });

      // 询问是否应用
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: '是否应用以上变更？',
        initial: true,
      });

      if (confirm) {
        const applySpinner = ora('正在应用变更...').start();

        for (const diff of result.diffs) {
          const filePath = path.resolve(process.cwd(), diff.file);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, diff.content, 'utf-8');
        }

        applySpinner.succeed('变更已成功应用到本地文件！');
        console.log(chalk.green('\n✅ Vibe Coding 完成'));
      } else {
        console.log(chalk.yellow('已取消应用变更。'));
      }
    } else {
      console.log(chalk.gray('\n模型未返回任何文件变更。'));
    }
  } catch (error: any) {
    spinner.fail('调用失败');
    console.error(chalk.red(error.message));
  }
}
