import chalk from 'chalk';
import { SkillRegistry, SkillRuntime, CodeReviewSkill, RefactorSkill, TestGenerateSkill } from '@forge-ai/core';

function registerBuiltinSkills(): void {
  const skills = SkillRegistry.getAll();
  if (!skills.find(s => s.id === 'code-review')) SkillRegistry.register(new CodeReviewSkill());
  if (!skills.find(s => s.id === 'refactor')) SkillRegistry.register(new RefactorSkill());
  if (!skills.find(s => s.id === 'test-generate')) SkillRegistry.register(new TestGenerateSkill());
}

export function registerSkillCommand(program: any): void {
  registerBuiltinSkills();
  const runtime = new SkillRuntime();

  const skillCommand = program
    .command('skill')
    .description('Skill 管理');

  skillCommand
    .command('list')
    .description('列出已安装的 Skill')
    .action(() => {
      const skills = SkillRegistry.getAll();

      if (skills.length === 0) {
        console.log(chalk.yellow('没有已安装的 Skill'));
        return;
      }

      console.log(chalk.blue.bold(`\n已安装的 Skill (共 ${skills.length} 个):\n`));
      for (const skill of skills) {
        console.log(`  ${chalk.cyan(skill.id.padEnd(25))} v${skill.version}  ${chalk.white(skill.name)}`);
        console.log(`  ${' '.repeat(27)}${chalk.gray(skill.description)}`);
        console.log(`  ${' '.repeat(27)}${chalk.gray('分类:')} ${skill.category}`);
        console.log('');
      }
    });

  skillCommand
    .command('run <id>')
    .description('运行指定 Skill')
    .option('-p, --param <params>', '参数 JSON 字符串')
    .action(async (id: string, options: any) => {
      const skill = SkillRegistry.get(id);
      if (!skill) {
        console.log(chalk.red(`未找到 Skill: ${id}`));
        return;
      }

      let params: Record<string, unknown> = {};
      if (options.param) {
        try {
          params = JSON.parse(options.param);
        } catch {
          console.log(chalk.red('参数格式错误，请使用 JSON 格式'));
          return;
        }
      }

      console.log(chalk.blue(`正在执行 Skill: ${skill.name}...\n`));
      const startTime = Date.now();

      for await (const chunk of runtime.executeStream(skill, { parameters: params })) {
        if (chunk.type === 'delta' && chunk.text) {
          process.stdout.write(chunk.text);
        }
        if (chunk.type === 'done' && chunk.text) {
          console.log('');
          console.log(chalk.green(`\n✅ 执行完成 (${Date.now() - startTime}ms)`));
        }
        if (chunk.type === 'error') {
          console.log(chalk.red(`\n❌ 执行失败: ${chunk.error}`));
        }
      }
    });

  skillCommand
    .command('install <path>')
    .description('从 JSON 文件安装 Skill')
    .action(async (filePath: string) => {
      try {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf-8');
        const count = SkillRegistry.importFromJSON(content);
        console.log(chalk.green(`成功安装 ${count} 个 Skill`));
      } catch (err) {
        console.log(chalk.red(`安装失败: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });

  skillCommand
    .command('export')
    .description('导出所有 Skill 到 JSON')
    .action(() => {
      const json = SkillRegistry.exportToJSON();
      console.log(json);
    });
}