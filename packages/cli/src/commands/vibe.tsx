import chalk from 'chalk';
import ora from 'ora';
import { render } from 'ink';
import React from 'react';
import { AgentRegistry, scanWorkspace, CodingAgent, AgentDiff } from '@forge-ai/core';
import { getDefaultAgent, setDefaultAgent } from '../config.js';
import { AgentSelector } from '../ui/AgentSelector.js';
import { DiffPreview } from '../ui/DiffPreview.js';
import fs from 'fs/promises';
import path from 'path';

export interface VibeOptions {
  agent?: string;
}

export async function vibeCommand(userPrompt: string, options: VibeOptions = {}) {
  console.log(chalk.blue.bold(`\n[Forge] 开始 Vibe Coding`));
  console.log(chalk.gray(`Prompt: ${userPrompt}\n`));

  // 1. 获取或选择 Agent
  let agentId = options.agent || getDefaultAgent();

  if (!agentId) {
    const agents = AgentRegistry.getAllAgents();
    if (agents.length === 0) {
      console.log(chalk.red('没有注册任何 Agent！'));
      return;
    }

    await new Promise<void>((resolve) => {
      const { unmount } = render(
        <AgentSelector
          agents={agents}
          onSelect={(id: string) => {
            agentId = id;
            setDefaultAgent(id);
            unmount();
            resolve();
          }}
        />
      );
    });

    if (!agentId) {
      console.log(chalk.yellow('已取消操作'));
      return;
    }
  }

  const agent = AgentRegistry.getAgent(agentId!);
  if (!agent) {
    console.log(chalk.red(`未找到 Agent: ${agentId}`));
    return;
  }

  console.log(chalk.cyan(`当前使用: ${agent.name}\n`));

  // 2. 扫描项目文件（知识图谱上下文）
  const scanSpinner = ora('正在扫描项目文件...').start();
  const workspaceFiles = await scanWorkspace(process.cwd(), 30, 700);
  scanSpinner.succeed(`已扫描 ${workspaceFiles.length} 个代码文件`);

  // 3. 调用模型
  const spinner = ora('正在生成计划...').start();

  try {
    let result: any = null;

    if (agent.supportsStreaming && agent.sendPromptStream) {
      let accumulated = '';
      for await (const chunk of agent.sendPromptStream(userPrompt, { workspaceFiles })) {
        if (chunk.type === 'delta') {
          accumulated = chunk.fullText;
          spinner.text = `正在生成计划... (${accumulated.length} 字符)`;
        }
        if (chunk.type === 'done') {
          result = chunk.result;
        }
      }
    } else {
      result = await agent.sendPrompt(userPrompt, { workspaceFiles });
    }

    spinner.succeed('模型返回成功');

    // 4. 显示计划
    console.log(chalk.green.bold('\n【执行计划】'));
    console.log(result.plan || '无计划描述');

    if (!result.diffs || result.diffs.length === 0) {
      console.log(chalk.gray('\n模型未返回任何文件变更。'));
      return;
    }

    // 5. 显示 Diff 预览（使用 Ink 组件）
    console.log(chalk.yellow.bold(`\n【变更预览】共 ${result.diffs.length} 个文件`));

    let finalDiffs: any[] = [];

    await new Promise<void>((resolve) => {
      const { unmount } = render(
        <DiffPreview
          diffs={result.diffs}
          onAccept={(diff: AgentDiff) => {
            finalDiffs = [diff];
            unmount();
            resolve();
          }}
          onReject={(diff: AgentDiff) => {
            result.diffs = result.diffs.filter((d: any) => d.file !== diff.file);
            if (result.diffs.length === 0) {
              unmount();
              resolve();
            }
          }}
          onAcceptAll={() => {
            finalDiffs = result.diffs;
            unmount();
            resolve();
          }}
          onRejectAll={() => {
            finalDiffs = [];
            unmount();
            resolve();
          }}
        />
      );
    });

    if (finalDiffs.length === 0) {
      console.log(chalk.yellow('已取消应用变更。'));
      return;
    }

    // 6. 应用变更
    const applySpinner = ora('正在应用变更...').start();

    for (const diff of finalDiffs) {
      const filePath = path.resolve(process.cwd(), diff.file);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, diff.content, 'utf-8');
    }

    applySpinner.succeed(`已成功应用 ${finalDiffs.length} 个文件变更！`);
    console.log(chalk.green('\n✅ Vibe Coding 完成'));
  } catch (error: any) {
    spinner.fail('调用失败');
    console.error(chalk.red(error.message));
  }
}