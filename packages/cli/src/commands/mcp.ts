import chalk from 'chalk';
import { MCPRegistry, MCPClient, filesystemMCPConfig, gitMCPConfig, terminalMCPConfig } from '@forge-ai/core';
import { MCPClientConfig } from '@forge-ai/core';

function registerBuiltinServices(): void {
  try {
    MCPRegistry.register(filesystemMCPConfig);
    MCPRegistry.register(gitMCPConfig);
    MCPRegistry.register(terminalMCPConfig);
  } catch {
  }
}

export function registerMCPCommand(program: any): void {
  registerBuiltinServices();

  const mcpCommand = program
    .command('mcp')
    .description('MCP 服务管理');

  mcpCommand
    .command('list')
    .description('列出已注册的 MCP 服务')
    .action(() => {
      const services = MCPRegistry.getAllServices();

      if (services.length === 0) {
        console.log(chalk.yellow('没有已注册的 MCP 服务'));
        return;
      }

      console.log(chalk.blue.bold('\nMCP 服务列表：\n'));

      for (const svc of services) {
        const statusColor = svc.status === 'connected' ? chalk.green :
          svc.status === 'error' ? chalk.red :
          svc.status === 'connecting' ? chalk.yellow :
          chalk.gray;

        console.log(`  ${chalk.cyan(svc.id.padEnd(20))} ${statusColor(svc.status)}`);
        console.log(`  ${chalk.gray('传输方式:')} ${svc.config.transport}`);
        if (svc.config.command) {
          console.log(`  ${chalk.gray('命令:')} ${svc.config.command} ${(svc.config.args || []).join(' ')}`);
        }
        if (svc.config.url) {
          console.log(`  ${chalk.gray('URL:')} ${svc.config.url}`);
        }
        if (svc.lastError) {
          console.log(`  ${chalk.red('错误:')} ${svc.lastError}`);
        }
        console.log('');
      }
    });

  mcpCommand
    .command('add <id>')
    .description('添加 MCP 服务')
    .option('--command <cmd>', 'stdio 模式的命令')
    .option('--args <args>', '命令参数（逗号分隔）')
    .option('--url <url>', 'HTTP 模式的 URL')
    .action((id: string, options: any) => {
      if (MCPRegistry.hasService(id)) {
        console.log(chalk.yellow(`MCP 服务 "${id}" 已存在`));
        return;
      }

      if (!options.command && !options.url) {
        console.log(chalk.red('请指定 --command 或 --url'));
        return;
      }

      const config: MCPClientConfig = {
        id,
        name: id,
        transport: options.url ? 'http' : 'stdio',
        command: options.command,
        args: options.args ? options.args.split(',') : [],
        url: options.url,
      };

      MCPRegistry.register(config);
      console.log(chalk.green(`MCP 服务 "${id}" 已添加`));
    });

  mcpCommand
    .command('remove <id>')
    .description('移除 MCP 服务')
    .action((id: string) => {
      if (!MCPRegistry.hasService(id)) {
        console.log(chalk.yellow(`MCP 服务 "${id}" 不存在`));
        return;
      }
      MCPRegistry.unregister(id);
      console.log(chalk.green(`MCP 服务 "${id}" 已移除`));
    });

  mcpCommand
    .command('connect')
    .description('连接所有 MCP 服务')
    .action(async () => {
      console.log(chalk.blue('正在连接 MCP 服务...'));
      await MCPRegistry.connectAll();
      const services = MCPRegistry.getAllServices();
      for (const svc of services) {
        const statusIcon = svc.status === 'connected' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${svc.id}: ${svc.status}`);
      }
    });

  mcpCommand
    .command('disconnect')
    .description('断开所有 MCP 服务')
    .action(async () => {
      console.log(chalk.blue('正在断开 MCP 服务...'));
      await MCPRegistry.disconnectAll();
      console.log(chalk.green('所有 MCP 服务已断开'));
    });

  mcpCommand
    .command('test <id> <tool>')
    .description('测试调用 MCP 工具')
    .action(async (id: string, tool: string) => {
      const client = MCPRegistry.getClient(id);
      if (!client) {
        console.log(chalk.red(`MCP 服务 "${id}" 不存在`));
        return;
      }

      try {
        await client.connect();
        console.log(chalk.blue(`调用工具: ${tool}`));
        const result = await client.callTool(tool, {});
        console.log(chalk.green('结果:'));
        for (const content of result.content) {
          if (content.type === 'text') {
            console.log(content.text);
          }
        }
      } catch (err) {
        console.log(chalk.red(`调用失败: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });
}