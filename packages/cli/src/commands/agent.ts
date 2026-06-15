import chalk from 'chalk';
import prompts from 'prompts';
import { AgentRegistry, AgentBuilder } from '@forge-ai/core';
import { getDefaultAgent, setDefaultAgent } from '../config.js';

export function registerAgentCommand(program: any): void {
  const agentCommand = program
    .command('agent')
    .description('Agent 管理');

  agentCommand
    .command('list')
    .description('列出可用 Agent')
    .action(() => {
      const agents = AgentRegistry.getAllAgents();
      const defaultAgentId = getDefaultAgent();

      if (agents.length === 0) {
        console.log(chalk.yellow('没有已注册的 Agent'));
        return;
      }

      console.log(chalk.blue.bold('\n可用 Agent 列表：\n'));

      for (const agent of agents) {
        const isDefault = agent.id === defaultAgentId;
        const prefix = isDefault ? chalk.green('★ ') : '  ';
        const defaultTag = isDefault ? chalk.gray(' [默认]') : '';

        console.log(`${prefix}${chalk.cyan(agent.id.padEnd(20))} ${agent.name}${defaultTag}`);
        console.log(`  ${chalk.gray(agent.description)}`);
        if (agent.icon) {
          console.log(`  图标: ${agent.icon}`);
        }
        console.log('');
      }
    });

  agentCommand
    .command('use <id>')
    .description('设置默认 Agent')
    .action((id: string) => {
      const agent = AgentRegistry.getAgent(id);
      if (!agent) {
        console.log(chalk.red(`未找到 Agent: ${id}`));
        console.log(chalk.gray('可用 Agent:'), AgentRegistry.getAllAgents().map(a => a.id).join(', '));
        return;
      }
      setDefaultAgent(id);
      console.log(chalk.green(`默认 Agent 已切换为: ${agent.name} (${id})`));
    });

  agentCommand
    .command('create')
    .description('交互式创建新 Agent')
    .action(async () => {
      const response = await prompts([
        {
          type: 'text',
          name: 'id',
          message: 'Agent ID（唯一标识）',
          validate: (val: string) => val.length > 0 ? true : '请输入 Agent ID',
        },
        {
          type: 'text',
          name: 'name',
          message: 'Agent 名称',
          validate: (val: string) => val.length > 0 ? true : '请输入 Agent 名称',
        },
        {
          type: 'text',
          name: 'description',
          message: '描述',
        },
        {
          type: 'text',
          name: 'systemPrompt',
          message: '系统提示词（System Prompt）',
        },
        {
          type: 'text',
          name: 'model',
          message: '模型 ID（如 gpt-4o, claude-3-5-sonnet）',
        },
        {
          type: 'multiselect',
          name: 'tools',
          message: '选择可用工具',
          choices: [
            { title: 'read_file', value: 'read_file' },
            { title: 'edit_file', value: 'edit_file' },
            { title: 'execute_command', value: 'execute_command' },
            { title: 'search_codebase', value: 'search_codebase' },
          ],
        },
      ]);

      if (!response.id || !response.name) {
        console.log(chalk.yellow('创建已取消'));
        return;
      }

      const agent = new AgentBuilder(response.id)
        .setName(response.name)
        .setDescription(response.description || `Agent ${response.id}`)
        .setSystemPrompt(response.systemPrompt || '')
        .setModel(response.model || '')
        .setTemperature(0.7);

      for (const tool of response.tools || []) {
        agent.addTool(tool);
      }

      const builtAgent = agent.build();
      AgentRegistry.register(builtAgent);
      console.log(chalk.green(`\n✅ Agent "${response.name}" (${response.id}) 创建成功`));
    });
}