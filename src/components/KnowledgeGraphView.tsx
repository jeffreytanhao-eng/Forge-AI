/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Search, Info, HelpCircle, GitFork, Link2, Code, FileCode, CheckSquare, Layers } from 'lucide-react';
import { CodeGraphNode, CodeGraphEdge, CodeKnowledgeGraph } from '../types';
import { MOCK_KNOWLEDGE_GRAPHS } from '../data/mockData';

interface KnowledgeGraphViewProps {
  workspaceName: 'python_api' | 'ts_utils';
  graphRevision: number;
}

export default function KnowledgeGraphView({ workspaceName, graphRevision }: KnowledgeGraphViewProps) {
  const [graphData, setGraphData] = useState<CodeKnowledgeGraph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<CodeGraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Load graph structures corresponding to target workspace
  useEffect(() => {
    const rawGraph = MOCK_KNOWLEDGE_GRAPHS[workspaceName];
    if (rawGraph) {
      setGraphData(rawGraph);
      setSelectedNode(rawGraph.nodes[0] || null);
    }
  }, [workspaceName, graphRevision]);

  // Find calling relationships
  const connectedEdges = graphData.edges.filter(edge => 
    selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)
  );

  const incomingReferences = graphData.edges.filter(edge => 
    selectedNode && edge.target === selectedNode.id
  ).map(edge => {
    const srcNode = graphData.nodes.find(n => n.id === edge.source);
    return { node: srcNode, rel: edge.type };
  }).filter(item => item.node);

  const outgoingReferences = graphData.edges.filter(edge => 
    selectedNode && edge.source === selectedNode.id
  ).map(edge => {
    const targetNode = graphData.nodes.find(n => n.id === edge.target);
    return { node: targetNode, rel: edge.type };
  }).filter(item => item.node);

  // Compute customized coordinates or styling checks for connections
  const filteredNodes = graphData.nodes.filter(n => 
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.filePath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isEdgeRelated = (edge: CodeGraphEdge) => {
    if (!selectedNode && !hoveredNodeId) return true;
    const targetId = hoveredNodeId || selectedNode?.id;
    return edge.source === targetId || edge.target === targetId;
  };

  return (
    <div id="knowledge_graph_layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh] min-h-[550px] scale-95 animate-fade-in origin-top duration-300">
      
      {/* 1. VISUAL SVG RELATIONSHIPS NODE CANVAS (8 COLUMNS) */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl flex flex-col h-full relative overflow-hidden">
        
        {/* GRAPH HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-855 mb-4 shrink-0 z-10 select-none">
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Platform Dependencies Index (Codebase Knowledge Graph)
            </h3>
            <p className="text-xs text-slate-400">Semantic indexing maps imports structure, callers sequences, and file boundaries</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search symbols, functions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-305 focus:outline-none focus:border-indigo-505 transition-colors"
            />
          </div>
        </div>

        {/* SVG INTERACTIVE STAGE */}
        <div className="flex-1 bg-slate-950/80 rounded-lg border border-slate-905 overflow-hidden relative min-h-[280px]">
          
          <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-slate-400 font-mono space-y-1 select-none z-10">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> File Boundaries</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Function Objects</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Class Structures</div>
          </div>

          <svg className="w-full h-full min-h-[350px]">
            {/* DEF PATH ARROWS */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
            </defs>

            {/* DRAW EDGES (LINES) */}
            {graphData.edges.map((edge, eidx) => {
              const srcNode = graphData.nodes.find(n => n.id === edge.source);
              const targetNode = graphData.nodes.find(n => n.id === edge.target);
              
              if (!srcNode || !targetNode) return null;

              const isHighlighted = isEdgeRelated(edge);
              
              return (
                <g key={`edge-${eidx}`} className="transition-all duration-300">
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isHighlighted ? '#6366f1' : '#334155'}
                    strokeWidth={isHighlighted ? 1.8 : 0.8}
                    strokeDasharray={edge.type === 'imports' ? '4,4' : undefined}
                    markerEnd={`url(#${isHighlighted ? 'arrow-active' : 'arrow'})`}
                  />
                  {/* Subtle label in middle of hover lines */}
                  {isHighlighted && (
                    <text
                      x={((srcNode.x || 0) + (targetNode.x || 0)) / 2}
                      y={((srcNode.y || 0) + (targetNode.y || 0)) / 2 - 4}
                      fill="#818cf8"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none bg-slate-950 px-1 rounded pointer-events-none"
                    >
                      {edge.type}
                    </text>
                  )}
                </g>
              );
            })}

            {/* DRAW NODES */}
            {graphData.nodes.map(node => {
              const ndX = node.x || 100;
              const ndY = node.y || 100;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isMatchedBySearch = searchTerm ? node.label.toLowerCase().includes(searchTerm.toLowerCase()) : true;

              // Node Category Color Mapping
              const colorClass = 
                node.type === 'file' ? 'fill-blue-500' :
                node.type === 'class' ? 'fill-rose-500' :
                'fill-amber-500';

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer group"
                >
                  {/* Outer selection glow */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={ndX}
                      cy={ndY}
                      r={15}
                      className="fill-indigo-500/20 stroke-indigo-505/30 stroke-dashed stroke-2 animate-pulse"
                    />
                  )}

                  {/* Core category colored circle */}
                  <circle
                    cx={ndX}
                    cy={ndY}
                    r={isSelected ? 8 : 6}
                    className={`${colorClass} transition-all duration-300 group-hover:scale-125`}
                    stroke="#020617"
                    strokeWidth={1.5}
                  />

                  {/* Render symbol labeling text */}
                  <text
                    x={ndX}
                    y={ndY - 12}
                    fill={isMatchedBySearch ? (isSelected ? '#818cf8' : '#e2e8f0') : '#475569'}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                    className="select-none pointer-events-none transition-all"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. SYMBOL INSPECTOR DETAILS PANEL (4 COLUMNS) */}
      <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
        
        {/* METADATA INSPECTOR */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl flex-1 flex flex-col justify-between overflow-hidden">
          
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 scrollbar-none">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-855 select-none">
              <Info className="w-4.5 h-4.5 text-indigo-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-350 font-bold">Symbol Inspector</span>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                
                {/* Node type header */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-855">
                  <div className="flex items-center gap-2.5">
                    {selectedNode.type === 'file' ? <FileCode className="w-4.5 h-4.5 text-blue-400" /> : <Code className="w-4.5 h-4.5 text-amber-400" />}
                    <div>
                      <span className="text-xs uppercase font-mono text-slate-500 tracking-wider font-semibold">{selectedNode.type} Object</span>
                      <h4 className="font-semibold text-slate-205 text-sm font-mono mt-0.5">{selectedNode.label}</h4>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-900 mt-3 pt-2 text-[10.5px] font-mono text-slate-400">
                    Path: <span className="text-indigo-350">{selectedNode.filePath}</span>
                  </div>
                </div>

                {/* Incoming relationships (Callers / Imports source) */}
                <div className="space-y-2 select-none">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Caller References / Inward Links ({incomingReferences.length})</div>
                  {incomingReferences.length > 0 ? (
                    <div className="space-y-1.5">
                      {incomingReferences.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/65 border border-slate-900 text-xs font-mono">
                          <span className="text-slate-300">{ref.node?.label}</span>
                          <span className="text-[9.5px] text-indigo-400 uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-indigo-950/40 rounded border border-indigo-900/30">
                            {ref.rel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 block pl-1">No registered inbound calling references.</span>
                  )}
                </div>

                {/* Outgoing relationships (Called functions / Imports Targets) */}
                <div className="space-y-2 select-none">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Imports / Outward Links ({outgoingReferences.length})</div>
                  {outgoingReferences.length > 0 ? (
                    <div className="space-y-1.5">
                      {outgoingReferences.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/65 border border-slate-900 text-xs font-mono">
                          <span className="text-slate-300">{ref.node?.label}</span>
                          <span className="text-[9.5px] text-emerald-450 uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-emerald-950/20 rounded border border-emerald-900/30">
                            {ref.rel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 block pl-1">No registered outbound link bindings.</span>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-mono">Hover or select custom nodes on structural dependency graph to view properties.</span>
              </div>
            )}

          </div>

          <div className="border-t border-slate-800 pt-3 mt-4 text-[10px] font-mono text-slate-500 leading-relaxed select-none">
            <b>INFO:</b> Graph vertices update on-demand whenever compilation checks find new code revisions or imports directives in the current workspace files.
          </div>

        </div>

      </div>

    </div>
  );
}
