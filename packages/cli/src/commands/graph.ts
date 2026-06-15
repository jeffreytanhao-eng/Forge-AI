import chalk from 'chalk';
import { GraphBuilder, GraphQuery, GraphCache } from '@forge-ai/core';

export function registerGraphCommand(program: any): void {
  const graphCommand = program
    .command('graph')
    .description('知识图谱管理');

  graphCommand
    .command('build')
    .description('构建项目知识图谱')
    .action(async () => {
      console.log(chalk.blue('正在构建知识图谱...'));
      const builder = new GraphBuilder(process.cwd());
      const graph = await builder.build();
      console.log(chalk.green(`图谱构建完成:`));
      console.log(`  ${chalk.cyan('节点:')} ${graph.metadata.totalNodes}`);
      console.log(`  ${chalk.cyan('边:')} ${graph.metadata.totalEdges}`);
      console.log(`  ${chalk.cyan('文件:')} ${graph.metadata.totalFiles}`);
      const cache = new GraphCache();
      cache.saveGraph(graph);
      console.log(chalk.gray('图谱已缓存'));
    });

  graphCommand
    .command('query <name>')
    .description('查询节点及其邻居')
    .action(async (name: string) => {
      const cache = new GraphCache();
      const graph = cache.loadGraph();
      if (!graph) {
        console.log(chalk.yellow('未找到缓存图谱，请先运行 forge graph build'));
        return;
      }

      const query = new GraphQuery(graph);
      const results = query.queryNode(name);

      if (results.length === 0) {
        console.log(chalk.yellow(`未找到节点: ${name}`));
        return;
      }

      for (const result of results) {
        console.log(chalk.blue.bold(`\n节点: ${result.node.name}`));
        console.log(`  ${chalk.gray('类型:')} ${result.node.type}`);
        console.log(`  ${chalk.gray('文件:')} ${result.node.filePath}`);

        if (result.neighbors.length > 0) {
          console.log(`  ${chalk.gray('邻居:')}`);
          for (const neighbor of result.neighbors) {
            console.log(`    ${chalk.cyan(neighbor.node.name)} (${neighbor.node.type}) [${neighbor.edge.type}]`);
          }
        }
      }
    });

  graphCommand
    .command('path <a> <b>')
    .description('查询两节点间最短路径')
    .action(async (a: string, b: string) => {
      const cache = new GraphCache();
      const graph = cache.loadGraph();
      if (!graph) {
        console.log(chalk.yellow('未找到缓存图谱，请先运行 forge graph build'));
        return;
      }

      const query = new GraphQuery(graph);
      const result = query.shortestPath(a, b);

      if (!result.found) {
        console.log(chalk.yellow(`未找到从 "${a}" 到 "${b}" 的路径`));
        return;
      }

      console.log(chalk.blue.bold(`\n从 "${a}" 到 "${b}" 的最短路径:\n`));
      for (let i = 0; i < result.path.length; i++) {
        const step = result.path[i];
        const prefix = i === 0 ? '  ' : '  → ';
        console.log(`${prefix}${chalk.cyan(step.node.name)} (${step.node.type})`);
        if (step.edge) {
          console.log(`      ${chalk.gray(`[${step.edge.type}]`)}`);
        }
      }
    });

  graphCommand
    .command('stats')
    .description('图谱统计信息')
    .action(async () => {
      const cache = new GraphCache();
      const graph = cache.loadGraph();
      if (!graph) {
        console.log(chalk.yellow('未找到缓存图谱，请先运行 forge graph build'));
        return;
      }

      const query = new GraphQuery(graph);
      const stats = query.getStats();

      console.log(chalk.blue.bold('\n知识图谱统计\n'));
      console.log(`  ${chalk.cyan('项目:')} ${graph.metadata.projectName}`);
      console.log(`  ${chalk.cyan('节点数:')} ${stats.nodeCount}`);
      console.log(`  ${chalk.cyan('边数:')} ${stats.edgeCount}`);
      console.log(`  ${chalk.cyan('社区数:')} ${stats.communityCount}`);
      console.log(`  ${chalk.cyan('构建时间:')} ${graph.metadata.builtAt}`);

      const typeCounts = new Map<string, number>();
      for (const node of graph.nodes) {
        typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1);
      }
      console.log(`  ${chalk.gray('\n节点类型分布:')}`);
      for (const [type, count] of typeCounts) {
        console.log(`    ${type}: ${count}`);
      }
    });

  graphCommand
    .command('update')
    .description('增量更新知识图谱')
    .action(async () => {
      const cache = new GraphCache();
      const existingGraph = cache.loadGraph();
      const changedFiles = cache.getChangedFiles();

      if (changedFiles.length === 0) {
        console.log(chalk.yellow('没有文件变更'));
        return;
      }

      console.log(chalk.blue(`检测到 ${changedFiles.length} 个文件变更，正在增量更新...`));
      const builder = new GraphBuilder(process.cwd());
      if (existingGraph) {
        builder.setExistingGraph(existingGraph);
      }
      const graph = await builder.buildIncremental(changedFiles);
      cache.saveGraph(graph);
      console.log(chalk.green('增量更新完成'));
      console.log(`  ${chalk.cyan('处理文件:')} ${changedFiles.length}`);
      console.log(`  ${chalk.cyan('总节点数:')} ${graph.metadata.totalNodes}`);
    });
}