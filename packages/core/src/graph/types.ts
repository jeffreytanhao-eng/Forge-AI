export interface GraphNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'interface' | 'type' | 'variable' | 'import';
  name: string;
  filePath: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'imports' | 'extends' | 'implements' | 'calls' | 'defines' | 'contains';
}

export interface CodeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    projectName: string;
    totalFiles: number;
    totalNodes: number;
    totalEdges: number;
    builtAt: string;
  };
}

export interface GraphQueryResult {
  node: GraphNode;
  neighbors: Array<{ node: GraphNode; edge: GraphEdge }>;
}

export interface PathResult {
  path: Array<{ node: GraphNode; edge: GraphEdge | null }>;
  found: boolean;
}