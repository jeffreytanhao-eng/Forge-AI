import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { GraphNode, GraphEdge, CodeGraph } from './types.js';

export class GraphBuilder {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private nodeIdCounter = 0;
  private projectRoot: string;
  private existingNodes: Map<string, GraphNode> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  private generateNodeId(): string {
    return `node_${++this.nodeIdCounter}`;
  }

  private getNodeKey(name: string, filePath: string): string {
    return `${name}::${filePath}`;
  }

  private addNode(node: GraphNode): void {
    const key = this.getNodeKey(node.name, node.filePath);
    if (!this.nodes.has(key)) {
      this.nodes.set(key, node);
    }
  }

  private addEdge(sourceKey: string, targetKey: string, type: GraphEdge['type']): void {
    if (this.nodes.has(sourceKey) && this.nodes.has(targetKey)) {
      this.edges.push({ source: sourceKey, target: targetKey, type });
    }
  }

  setExistingGraph(graph: CodeGraph): void {
    for (const node of graph.nodes) {
      const key = this.getNodeKey(node.name, node.filePath);
      this.existingNodes.set(key, node);
    }
    this.nodeIdCounter = graph.nodes.length;
  }

  async build(): Promise<CodeGraph> {
    this.nodes = new Map();
    this.edges = [];
    this.nodeIdCounter = 0;

    const files = this.collectFiles(this.projectRoot);
    const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    for (const file of tsFiles) {
      this.analyzeFile(file);
    }

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      metadata: {
        projectName: path.basename(this.projectRoot),
        totalFiles: tsFiles.length,
        totalNodes: this.nodes.size,
        totalEdges: this.edges.length,
        builtAt: new Date().toISOString(),
      },
    };
  }

  async buildIncremental(changedFiles: string[]): Promise<CodeGraph> {
    for (const file of changedFiles) {
      const ext = path.extname(file);
      if (ext === '.ts' || ext === '.tsx') {
        this.analyzeFile(file);
      }
    }

    const allNodes = Array.from(this.nodes.values());
    const existingNodesList = Array.from(this.existingNodes.values());

    return {
      nodes: [...existingNodesList, ...allNodes],
      edges: this.edges,
      metadata: {
        projectName: path.basename(this.projectRoot),
        totalFiles: 0,
        totalNodes: existingNodesList.length + allNodes.length,
        totalEdges: this.edges.length,
        builtAt: new Date().toISOString(),
      },
    };
  }

  private collectFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
            results.push(...this.collectFiles(fullPath));
          }
        } else if (entry.isFile()) {
          results.push(fullPath);
        }
      }
    } catch {
    }
    return results;
  }

  private analyzeFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');

      const fileNode: GraphNode = {
        id: this.generateNodeId(),
        type: 'file',
        name: path.basename(filePath),
        filePath: relativePath,
      };
      const fileKey = this.getNodeKey(fileNode.name, fileNode.filePath);
      this.addNode(fileNode);

      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      this.walkNode(sourceFile, sourceFile, relativePath, fileKey);
    } catch {
    }
  }

  private walkNode(node: ts.Node, sourceFile: ts.SourceFile, relativePath: string, fileKey: string): void {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      const importClause = node.importClause;

      if (importClause) {
        let importedName = '';
        if (importClause.name) {
          importedName = importClause.name.text;
        } else if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
          importedName = importClause.namedBindings.elements.map(e => e.name.text).join(', ');
        }

        if (importedName) {
          const importNode: GraphNode = {
            id: this.generateNodeId(),
            type: 'import',
            name: importedName,
            filePath: relativePath,
            metadata: { module: moduleSpecifier },
          };
          const importKey = this.getNodeKey(importNode.name, importNode.filePath);
          this.addNode(importNode);
          this.addEdge(fileKey, importKey, 'imports');
        }
      }
    }

    if (ts.isClassDeclaration(node) && node.name) {
      const classNode: GraphNode = {
        id: this.generateNodeId(),
        type: 'class',
        name: node.name.text,
        filePath: relativePath,
      };
      const classKey = this.getNodeKey(classNode.name, classNode.filePath);
      this.addNode(classNode);
      this.addEdge(fileKey, classKey, 'contains');

      if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
          for (const type of clause.types) {
            const parentName = type.expression.getText(sourceFile);
            const parentKey = this.getNodeKey(parentName, '');
            if (this.nodes.has(parentKey)) {
              this.addEdge(classKey, parentKey, 'extends');
            }
          }
        }
      }
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      const funcNode: GraphNode = {
        id: this.generateNodeId(),
        type: 'function',
        name: node.name.text,
        filePath: relativePath,
      };
      const funcKey = this.getNodeKey(funcNode.name, funcNode.filePath);
      this.addNode(funcNode);
      this.addEdge(fileKey, funcKey, 'contains');
    }

    if (ts.isInterfaceDeclaration(node) && node.name) {
      const ifaceNode: GraphNode = {
        id: this.generateNodeId(),
        type: 'interface',
        name: node.name.text,
        filePath: relativePath,
      };
      const ifaceKey = this.getNodeKey(ifaceNode.name, ifaceNode.filePath);
      this.addNode(ifaceNode);
      this.addEdge(fileKey, ifaceKey, 'contains');
    }

    if (ts.isTypeAliasDeclaration(node) && node.name) {
      const typeNode: GraphNode = {
        id: this.generateNodeId(),
        type: 'type',
        name: node.name.text,
        filePath: relativePath,
      };
      const typeKey = this.getNodeKey(typeNode.name, typeNode.filePath);
      this.addNode(typeNode);
      this.addEdge(fileKey, typeKey, 'contains');
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const varNode: GraphNode = {
            id: this.generateNodeId(),
            type: 'variable',
            name: decl.name.text,
            filePath: relativePath,
          };
          const varKey = this.getNodeKey(varNode.name, varNode.filePath);
          this.addNode(varNode);
          this.addEdge(fileKey, varKey, 'contains');
        }
      }
    }

    ts.forEachChild(node, child => this.walkNode(child, sourceFile, relativePath, fileKey));
  }
}