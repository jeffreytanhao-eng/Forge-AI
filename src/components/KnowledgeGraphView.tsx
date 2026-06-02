/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Search, Info, HelpCircle, GitFork, Link2, Code, FileCode, CheckSquare, Layers, Sparkles, RefreshCw, BarChart2, Activity } from 'lucide-react';
import { CodeGraphNode, CodeGraphEdge, CodeKnowledgeGraph, WorkspaceFile } from '../types';
import { MOCK_KNOWLEDGE_GRAPHS } from '../data/mockData';
import { generateGraphifyGraph } from '../utils/graphify';

interface KnowledgeGraphViewProps {
  workspaceName: 'python_api' | 'ts_utils' | 'forge_platform';
  workspaceFiles: WorkspaceFile[];
  graphRevision: number;
  onUpdateGraph?: () => void;
}

export default function KnowledgeGraphView({ workspaceName, workspaceFiles, graphRevision, onUpdateGraph }: KnowledgeGraphViewProps) {
  const [graphData, setGraphData] = useState<CodeKnowledgeGraph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<CodeGraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Layout View Mode selection
  const [layoutMode, setLayoutMode] = useState<'orbit' | 'starfield' | 'grid'>('orbit');

  // Interactive dynamic compilation scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeScanLog, setActiveScanLog] = useState('');
  const [showScanCompleteBanner, setShowScanCompleteBanner] = useState(false);

  // Load default fallback graph on file changes or revision trigger
  useEffect(() => {
    // If we have workspaceFiles, let's use the dynamic compiler by default on tab loaded
    const dynamicGraph = generateGraphifyGraph(workspaceFiles);
    if (dynamicGraph && dynamicGraph.nodes.length > 0) {
      setGraphData(dynamicGraph);
      setSelectedNode(dynamicGraph.nodes[0] || null);
    } else {
      const rawGraph = MOCK_KNOWLEDGE_GRAPHS[workspaceName];
      if (rawGraph) {
        setGraphData(rawGraph);
        setSelectedNode(rawGraph.nodes[0] || null);
      }
    }
  }, [workspaceName, graphRevision, workspaceFiles]);

  // Find relationships
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

  // Filter nodes according to search parameter
  const filteredNodes = graphData.nodes.filter(n => 
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.filePath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isEdgeRelated = (edge: CodeGraphEdge) => {
    if (!selectedNode && !hoveredNodeId) return true;
    const targetId = hoveredNodeId || selectedNode?.id;
    return edge.source === targetId || edge.target === targetId;
  };

  // Trigger dynamic Graphify analyzer compile effect
  const handleTriggerGraphifyScan = () => {
    setIsScanning(true);
    setScanProgress(10);
    setActiveScanLog('Initializing AST tree parser for current environment...');
    setShowScanCompleteBanner(false);

    // Timeline steps
    setTimeout(() => {
      setScanProgress(35);
      setActiveScanLog('Extracting matching keywords: function, class, def, import export declarations...');
    }, 450);

    setTimeout(() => {
      setScanProgress(68);
      setActiveScanLog('Mapping call-graph edges and dependency weights across modules...');
    }, 900);

    setTimeout(() => {
      setScanProgress(90);
      setActiveScanLog('Executing orbital layout constellation coordinates algorithm...');
    }, 1300);

    setTimeout(() => {
      const dynamicGraph = generateGraphifyGraph(workspaceFiles);
      setGraphData(dynamicGraph);
      setSelectedNode(dynamicGraph.nodes[0] || null);
      
      setScanProgress(100);
      setActiveScanLog(`Completed! Parsed ${dynamicGraph.nodes.length} nodes and ${dynamicGraph.edges.length} linkages successfully.`);
      setIsScanning(false);
      setShowScanCompleteBanner(true);
      onUpdateGraph?.();
    }, 1700);
  };

  // Compute stats metrics
  const filesCount = graphData.nodes.filter(n => n.type === 'file').length;
  const functionsCount = graphData.nodes.filter(n => n.type === 'function').length;
  const classesCount = graphData.nodes.filter(n => n.type === 'class').length;
  const relationDensity = graphData.nodes.length > 0 
    ? ((graphData.edges.length / graphData.nodes.length) * 10).toFixed(1) 
    : '0.0';

  return (
    <div id="knowledge_graph_layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh] min-h-[580px] scale-95 animate-fade-in origin-top duration-300">
      
      {/* 1. VISUAL SVG RELATIONSHIPS NODE CANVAS (8 COLUMNS) */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl flex flex-col h-full relative overflow-hidden">
        
        {/* GRAPH HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-855 mb-4 shrink-0 z-10 select-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bgColor bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Layers className="w-5 h-5 text-indigo-400" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm leading-tight">
                  Graphify AST Codebase Knowledge Graph
                </h3>
                <p className="text-[11px] text-slate-400">Semantic parsing maps imports structure, callable sequences, and workspace boundaries</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Run Graphify Scan with Sparkling trigger */}
            <button
              onClick={handleTriggerGraphifyScan}
              disabled={isScanning}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-400 disabled:opacity-50 text-slate-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg active:scale-95 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Tokenizing AST...' : 'Graphify Project'}
            </button>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Find node parameters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* TIMELINE PROGRESS MODAL */}
        {isScanning && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between select-none">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-pulse text-indigo-400" />
                  AST Compiler Micro-Tokenizing
                </span>
                <span className="text-sm font-mono font-bold text-indigo-300">{scanProgress}%</span>
              </div>

              {/* Progress track */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_#6366f1]"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-900 rounded font-mono text-[10px] text-slate-400 h-16 overflow-y-auto leading-relaxed scrollbar-none select-none">
                <span className="text-indigo-400 mr-1.5">➜</span>
                {activeScanLog}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic statistics readout */}
        <div className="grid grid-cols-4 gap-3 bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg mb-3 shrink-0 text-center font-mono text-[11px] select-none text-slate-400">
          <div>
            Files: <span className="text-blue-400 font-bold ml-1">{filesCount}</span>
          </div>
          <div>
            Classes: <span className="text-rose-400 font-bold ml-1">{classesCount}</span>
          </div>
          <div>
            Functions: <span className="text-amber-400 font-bold ml-1">{functionsCount}</span>
          </div>
          <div>
            Relative Density: <span className="text-emerald-400 font-bold ml-1">{relationDensity}</span>
          </div>
        </div>

        {/* SVG INTERACTIVE STAGE */}
        <div className="flex-1 bg-slate-950/80 rounded-lg border border-slate-905 overflow-hidden relative min-h-[300px]">
          
          <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-slate-400 font-mono space-y-1 select-none z-10">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" /> File Scope</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" /> Function Symbol</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> Class Entity</div>
          </div>

          <div className="absolute top-3 right-3 bg-slate-900/95 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-slate-400 font-mono select-none z-10 flex gap-2">
            <span className="text-[9px] uppercase font-bold text-slate-500">Visualization:</span>
            <span className="text-indigo-400 font-semibold uppercase">Dynamically Orbiting</span>
          </div>

          {/* Banner notification */}
          {showScanCompleteBanner && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-950/80 border border-emerald-800 rounded-lg py-2 px-3 text-xs text-emerald-400 z-10 font-sans flex items-center justify-between select-none animate-bounce origin-bottom">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Codebase dynamic compilation indexing complete. Node weights and local caller rings loaded.</span>
              </span>
              <button onClick={() => setShowScanCompleteBanner(false)} className="text-emerald-500 font-mono text-[9px] uppercase border border-emerald-800/40 rounded px-1">Close</button>
            </div>
          )}

          <svg className="w-full h-full min-h-[350px]">
            {/* DEF PATH ARROWS */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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
            {filteredNodes.map(node => {
              const ndX = node.x || 100;
              const ndY = node.y || 100;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isMatchedBySearch = searchTerm ? node.label.toLowerCase().includes(searchTerm.toLowerCase()) : true;

              // Node Category Color Mapping
              const colorClass = 
                node.type === 'file' ? 'fill-blue-500 shadow-blue-500/20' :
                node.type === 'class' ? 'fill-rose-500 shadow-rose-500/20' :
                'fill-amber-500 shadow-amber-500/20';

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
                      r={14}
                      className="fill-indigo-500/20 stroke-indigo-500/30 stroke-dashed stroke-2 animate-pulse"
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
          
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-none">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-855 select-none">
              <Info className="w-4.5 h-4.5 text-indigo-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-350 font-bold flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Symbol Inspector
              </span>
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
                    File Path: <span className="text-indigo-350">{selectedNode.filePath}</span>
                  </div>
                </div>

                {/* Incoming relationships (Callers / Imports source) */}
                <div className="space-y-2 select-none">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Caller References ({incomingReferences.length})</div>
                  {incomingReferences.length > 0 ? (
                    <div className="space-y-1.5">
                      {incomingReferences.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/65 border border-slate-900 text-xs font-mono">
                          <span className="text-slate-300">{ref.node?.label}</span>
                          <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-indigo-950/40 rounded border border-indigo-900/30">
                            {ref.rel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-650 block pl-1">No registered inward callers.</span>
                  )}
                </div>

                {/* Outgoing relationships (Called functions / Imports Targets) */}
                <div className="space-y-2 select-none">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Imports & Targets ({outgoingReferences.length})</div>
                  {outgoingReferences.length > 0 ? (
                    <div className="space-y-1.5">
                      {outgoingReferences.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/65 border border-slate-900 text-xs font-mono">
                          <span className="text-slate-300">{ref.node?.label}</span>
                          <span className="text-[9px] text-emerald-450 uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-emerald-950/20 rounded border border-emerald-900/30">
                            {ref.rel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-650 block pl-1">No registered outbound linkages.</span>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-705 animate-pulse" />
                <span className="text-xs font-mono">Select code vertices in diagram or query search metrics above to inspect properties.</span>
              </div>
            )}

          </div>

          <div className="border-t border-slate-800 pt-3.5 mt-3 text-[10px] font-mono text-slate-500 leading-relaxed select-none">
            <b>PRO-TIP:</b> Click <b>Graphify Project</b> above anytime to parse physical file edits dynamically, recompute token hashes, and auto-position calling vertices.
          </div>

        </div>

      </div>

    </div>
  );
}
