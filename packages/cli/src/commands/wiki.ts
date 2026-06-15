import chalk from 'chalk';
import { KnowledgeBase, defaultKnowledgeBase } from '@forge-ai/core';

export function registerWikiCommand(program: any, kb: KnowledgeBase = defaultKnowledgeBase): void {
  const wikiCommand = program
    .command('wiki')
    .description('Wiki 知识库管理');

  wikiCommand
    .command('import <file>')
    .description('导入文档到知识库')
    .action(async (file: string) => {
      try {
        console.log(chalk.blue(`正在导入: ${file}`));
        const doc = await kb.importFile(file);
        console.log(chalk.green(`导入成功: ${doc.title} (${doc.id})`));
        const stats = kb.getStats();
        console.log(chalk.gray(`知识库统计: ${stats.docCount} 个文档, ${stats.chunkCount} 个块`));
      } catch (err) {
        console.log(chalk.red(`导入失败: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });

  wikiCommand
    .command('query <question>')
    .description('搜索知识库')
    .action((question: string) => {
      const results = kb.search(question, 5);

      if (results.length === 0) {
        console.log(chalk.yellow('未找到相关结果'));
        return;
      }

      console.log(chalk.blue.bold(`\n搜索: "${question}"\n`));
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        console.log(`${chalk.cyan(`${i + 1}.`)} ${chalk.white(r.title)}`);
        console.log(`   ${chalk.gray('相关度:')} ${(r.score * 100).toFixed(1)}%`);
        console.log(`   ${chalk.gray(r.content.slice(0, 300))}${r.content.length > 300 ? '...' : ''}`);
        console.log('');
      }
    });

  wikiCommand
    .command('list')
    .description('列出知识库中文档')
    .action(() => {
      const docs = kb.getAllDocuments();

      if (docs.length === 0) {
        console.log(chalk.yellow('知识库为空'));
        return;
      }

      console.log(chalk.blue.bold(`\n知识库文档 (共 ${docs.length} 个):\n`));

      for (const doc of docs) {
        console.log(`  ${chalk.cyan(doc.id.padEnd(35))} ${chalk.white(doc.title)}`);
        console.log(`  ${' '.repeat(37)}${chalk.gray(doc.fileType)} | ${doc.createdAt.slice(0, 10)}`);
        console.log('');
      }
    });

  wikiCommand
    .command('export <path>')
    .description('导出知识库到 JSON 文件')
    .action(async (outputPath: string) => {
      try {
        const json = kb.exportToJSON();
        const fs = await import('fs/promises');
        await fs.writeFile(outputPath, json, 'utf-8');
        console.log(chalk.green(`知识库已导出到: ${outputPath}`));
      } catch (err) {
        console.log(chalk.red(`导出失败: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });

  wikiCommand
    .command('merge <path>')
    .description('合并另一个知识库 JSON 文件')
    .action(async (importPath: string) => {
      try {
        const fs = await import('fs/promises');
        const json = await fs.readFile(importPath, 'utf-8');
        const count = kb.importFromJSON(json, true);
        console.log(chalk.green(`合并完成: 处理了 ${count} 个文档`));
        const stats = kb.getStats();
        console.log(chalk.gray(`知识库统计: ${stats.docCount} 个文档, ${stats.chunkCount} 个块`));
      } catch (err) {
        console.log(chalk.red(`合并失败: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });
}