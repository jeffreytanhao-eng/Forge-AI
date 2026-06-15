import chalk from 'chalk';
import { getDefaultAgent, setDefaultAgent, config } from '../config.js';
import { forgeConfig } from '@forge-ai/core';

export function registerConfigCommand(program: any): void {
  const configCommand = program
    .command('config')
    .description('配置管理');

  configCommand
    .command('show')
    .description('显示当前配置')
    .action(() => {
      const cfg = forgeConfig.getAll();
      console.log(chalk.blue.bold('\nForge AI 配置\n'));
      console.log(`  ${chalk.cyan('defaultAgent'.padEnd(25))} ${chalk.white(getDefaultAgent() || '(未设置)')}`);
      if (cfg.model) {
        console.log(`  ${chalk.cyan('model.provider'.padEnd(25))} ${chalk.white(cfg.model.provider || '(未设置)')}`);
        console.log(`  ${chalk.cyan('model.apiKey'.padEnd(25))} ${chalk.gray(cfg.model.apiKey ? '****' + cfg.model.apiKey.slice(-4) : '(未设置)')}`);
        console.log(`  ${chalk.cyan('model.endpoint'.padEnd(25))} ${chalk.white(cfg.model.endpoint || '(未设置)')}`);
        console.log(`  ${chalk.cyan('model.modelName'.padEnd(25))} ${chalk.white(cfg.model.modelName || '(未设置)')}`);
      }
      console.log(`  ${chalk.cyan('configPath'.padEnd(25))} ${chalk.gray(config.path)}\n`);
    });

  configCommand
    .command('set <key> <value>')
    .description('设置配置项（如: config set defaultAgent vibe）')
    .action((key: string, value: string) => {
      switch (key) {
        case 'defaultAgent':
          setDefaultAgent(value);
          console.log(chalk.green(`配置已更新: ${key} = ${value}`));
          break;
        case 'model.provider':
          forgeConfig.set('model.provider', value);
          console.log(chalk.green(`配置已更新: ${key} = ${value}`));
          break;
        case 'model.apiKey':
          forgeConfig.set('model.apiKey', value);
          console.log(chalk.green('配置已更新: model.apiKey'));
          break;
        case 'model.endpoint':
          forgeConfig.set('model.endpoint', value);
          console.log(chalk.green(`配置已更新: ${key} = ${value}`));
          break;
        case 'model.modelName':
          forgeConfig.set('model.modelName', value);
          console.log(chalk.green(`配置已更新: ${key} = ${value}`));
          break;
        default:
          console.log(chalk.yellow(`未知配置项: ${key}`));
          console.log(chalk.gray('可用配置项: defaultAgent, model.provider, model.apiKey, model.endpoint, model.modelName'));
      }
    });
}