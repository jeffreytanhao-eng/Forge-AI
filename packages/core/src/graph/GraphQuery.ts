import { CodeGraph, GraphNode, GraphEdge, GraphQueryResult, PathResult } from './types.js';

export class GraphQuery {
  private graph: CodeGraph;

  constructor(graph: CodeGraph) {
    this.graph = graph;
  }

  setGraph(graph: CodeGraph): void {
    this.graph = graph;
  }

  queryNode(name: string): GraphQueryResult[] {
    const results: GraphQueryResult[] = [];

    const matchingNodes = this.graph.nodes.filter(n =>
      n.name.toLowerCase().includes(name.toLowerCase())
    );

    for (const node of matchingNodes) {
      const neighbors: Array<{ node: GraphNode; edge: GraphEdge }> = [];

      for (const edge of this.graph.edges) {
        if (edge.source === node.id || edge.target === node.id) {
          const neighborId = edge.source === node.id ? edge.target : edge.source;
          const neighborNode = this.graph.nodes.find(n => n.id === neighborId);
          if (neighborNode) {
            neighbors.push({ node: neighborNode, edge });
          }
        }
      }

      results.push({ node, neighbors });
    }

    return results;
  }

  shortestPath(nodeA: string, nodeB: string): PathResult {
    const nodeAMatches = this.graph.nodes.filter(n =>
      n.name.toLowerCase().includes(nodeA.toLowerCase())
    );
    const nodeBMatches = this.graph.nodes.filter(n =>
      n.name.toLowerCase().includes(nodeB.toLowerCase())
    );

    if (nodeAMatches.length === 0 || nodeBMatches.length === 0) {
      return { path: [], found: false };
    }

    const startId = nodeAMatches[0].id;
    const endId = nodeBMatches[0].id;

    const adjacency = new Map<string, string[]>();
    for (const edge of this.graph.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
      adjacency.get(edge.source)!.push(edge.target);
      adjacency.get(edge.target)!.push(edge.source);
    }

    const visited = new Set<string>();
    const queue: Array<{ id: string; path: Array<{ node: GraphNode; edge: GraphEdge | null }> }> = [
      { id: startId, path: [{ node: nodeAMatches[0], edge: null }] },
    ];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.id === endId) {
        return { path: current.path, found: true };
      }

      const neighbors = adjacency.get(current.id) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const neighborNode = this.graph.nodes.find(n => n.id === neighborId);
          const connectingEdge = this.graph.edges.find(
            e => (e.source === current.id && e.target === neighborId) ||
                 (e.source === neighborId && e.target === current.id)
          );

          if (neighborNode) {
            queue.push({
              id: neighborId,
              path: [...current.path, { node: neighborNode, edge: connectingEdge || null }],
            });
          }
        }
      }
    }

    return { path: [], found: false };
  }

  findCommunities(): Array<{ id: number; nodes: GraphNode[] }> {
    const visited = new Set<string>();
    const communities: Array<{ id: number; nodes: GraphNode[] }> = [];
    let communityId = 0;

    const adjacency = new Map<string, string[]>();
    for (const edge of this.graph.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
      adjacency.get(edge.source)!.push(edge.target);
      adjacency.get(edge.target)!.push(edge.source);
    }

    for (const node of this.graph.nodes) {
      if (!visited.has(node.id)) {
        const community: GraphNode[] = [];
        const stack = [node.id];
        visited.add(node.id);

        while (stack.length > 0) {
          const currentId = stack.pop()!;
          const currentNode = this.graph.nodes.find(n => n.id === currentId);
          if (currentNode) community.push(currentNode);

          const neighbors = adjacency.get(currentId) || [];
          for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
              visited.add(neighborId);
              stack.push(neighborId);
            }
          }
        }

        communities.push({ id: communityId++, nodes: community });
      }
    }

    return communities.sort((a, b) => b.nodes.length - a.nodes.length);
  }

  getStats(): { nodeCount: number; edgeCount: number; communityCount: number } {
    return {
      nodeCount: this.graph.nodes.length,
      edgeCount: this.graph.edges.length,
      communityCount: this.findCommunities().length,
    };
  }
}