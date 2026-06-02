/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceFile, CodeKnowledgeGraph, CodeGraphNode, CodeGraphEdge } from '../types';

/**
 * Recursively flattens the file tree to find all file nodes that contain code content.
 */
export function flattenWorkspaceCodeFiles(files: WorkspaceFile[]): WorkspaceFile[] {
  let result: WorkspaceFile[] = [];
  for (const f of files) {
    if (f.type === 'file') {
      result.push(f);
    } else if (f.type === 'directory' && f.children) {
      result = [...result, ...flattenWorkspaceCodeFiles(f.children)];
    }
  }
  return result;
}

/**
 * Dynamic parser that analyzes code file strings to extract:
 * 1. File nodes
 * 2. Classes (using regex)
 * 3. Functions (using regex)
 * 4. Imports relationships (local files dependencies)
 * 5. Functional Calls relationships (by scanning content matching names)
 *
 * Then arranges them layout-wise inside a circular/constellation grouping system.
 */
export function generateGraphifyGraph(workspaceFiles: WorkspaceFile[]): CodeKnowledgeGraph {
  const codeFiles = flattenWorkspaceCodeFiles(workspaceFiles);

  const nodes: CodeGraphNode[] = [];
  const edges: CodeGraphEdge[] = [];

  // 1. Process files and extract matching elements
  const fileEntities = codeFiles.map(file => {
    const fileId = 'file_' + file.path.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const content = file.content || '';
    
    // Class names lookup
    const classNames: string[] = [];
    const classRegex = /\bclass\s+([A-Za-z0-9_]+)/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      if (match[1] && !classNames.includes(match[1])) {
        classNames.push(match[1]);
      }
    }

    // Function names lookup
    const funcNames: string[] = [];
    
    // Python functions: def name(...)
    if (file.name.endsWith('.py')) {
      const pyFuncRegex = /def\s+([A-Za-z0-9_]+)\s*\(/g;
      while ((match = pyFuncRegex.exec(content)) !== null) {
        if (match[1] && match[1] !== '__init__' && !funcNames.includes(match[1])) {
          funcNames.push(match[1]);
        }
      }
    } else {
      // JS/TS functions: function name(...) or const name = (...) =>
      const jsFuncRegex = /\bfunction\s+([A-Za-z0-9_]+)\b/g;
      while ((match = jsFuncRegex.exec(content)) !== null) {
        if (match[1] && !funcNames.includes(match[1])) {
          funcNames.push(match[1]);
        }
      }

      const jsArrowRegex = /\b(?:const|let|var|export\s+const)\s+([A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/g;
      while ((match = jsArrowRegex.exec(content)) !== null) {
        if (match[1] && !funcNames.includes(match[1])) {
          funcNames.push(match[1]);
        }
      }
    }

    return {
      file,
      fileId,
      classNames,
      funcNames,
      content
    };
  });

  // 2. Generate Nodes
  fileEntities.forEach(entity => {
    // Add primary File Node
    nodes.push({
      id: entity.fileId,
      label: entity.file.name,
      type: 'file',
      filePath: entity.file.path
    });

    // Add Class nodes
    entity.classNames.forEach(cls => {
      const clsId = `class_${entity.fileId}_${cls.toLowerCase()}`;
      nodes.push({
        id: clsId,
        label: cls,
        type: 'class',
        filePath: entity.file.path
      });
      // Containment edge
      edges.push({
        source: entity.fileId,
        target: clsId,
        type: 'contains'
      });
    });

    // Add Function nodes
    entity.funcNames.forEach(fn => {
      const fnId = `func_${entity.fileId}_${fn.toLowerCase()}`;
      nodes.push({
        id: fnId,
        label: fn + '()',
        type: 'function',
        filePath: entity.file.path
      });
      // Containment edge
      edges.push({
        source: entity.fileId,
        target: fnId,
        type: 'contains'
      });
    });
  });

  // 3. Generate Imports Edges (cross file files couplings)
  fileEntities.forEach(sourceEntity => {
    const content = sourceEntity.content;
    
    fileEntities.forEach(targetEntity => {
      if (sourceEntity.fileId === targetEntity.fileId) return;

      // Extract base names without extension
      const targetBase = targetEntity.file.name.replace(/\.[a-z]+$/, '');
      
      // Determine if imported
      let isImported = false;
      if (sourceEntity.file.name.endsWith('.py')) {
        // e.g., from database import ..., import database
        const pyImportRegex = new RegExp(`\\b(?:import\\s+${targetBase}\\b|from\\s+${targetBase}\\s+import\\b)`, 'i');
        isImported = pyImportRegex.test(content);
      } else {
        // e.g., import ... from "./parser", require("./parser")
        const jsImportRegex = new RegExp(`\\b(?:from|import)\\s+['"]\\.?\\.?\\/${targetBase}['"]`, 'i');
        isImported = jsImportRegex.test(content);
      }

      if (isImported) {
        edges.push({
          source: sourceEntity.fileId,
          target: targetEntity.fileId,
          type: 'imports'
        });
      }
    });
  });

  // 4. Generate Function Calls Edges
  // If function target_fn is declared in file B, and function source_fn in file A contains reference to target_fn
  const allTargetSymbols = fileEntities.flatMap(entity => [
    ...entity.classNames.map(cls => ({ label: cls, id: `class_${entity.fileId}_${cls.toLowerCase()}`, fileId: entity.fileId })),
    ...entity.funcNames.map(fn => ({ label: fn, id: `func_${entity.fileId}_${fn.toLowerCase()}`, fileId: entity.fileId }))
  ]);

  fileEntities.forEach(sourceEntity => {
    const rawContent = sourceEntity.content;
    
    // Quick split by functions to isolate function code bodies
    // For simplicity and safety, we also inspect call mentions
    allTargetSymbols.forEach(symbol => {
      // Do not bind a function calling itself directly or containing itself
      if (rawContent.includes(symbol.label)) {
        // Find which functions inside sourceEntity mention this label
        // Let's find matches and link source function nodes
        sourceEntity.funcNames.forEach(srcFn => {
          const srcFnId = `func_${sourceEntity.fileId}_${srcFn.toLowerCase()}`;
          if (srcFnId === symbol.id) return; // Ignore self

          // Simple check: does the file content contain the label?
          // To be a bit specific, check if the function body uses it.
          // Since we already check rawContent, we'll connect the calling relationship.
          // To prevent over-coupling, we only link if the target is in a different file or a helper.
          const callsRegex = new RegExp(`\\b${symbol.label}\\b`, 'g');
          const occurrences = (rawContent.match(callsRegex) || []).length;
          
          // If occurrence is > 1 (one for definition, plus call) OR it's from another file
          if (occurrences > 0) {
            const isDifferentFile = sourceEntity.fileId !== symbol.fileId;
            const isCall = isDifferentFile || (occurrences > 1);

            if (isCall) {
              const edgeExists = edges.some(e => e.source === srcFnId && e.target === symbol.id && e.type === 'calls');
              if (!edgeExists) {
                edges.push({
                  source: srcFnId,
                  target: symbol.id,
                  type: 'calls'
                });
              }
            }
          }
        });
      }
    });
  });

  // 5. Orbital/Constellation Geometry Layout
  const numFiles = fileEntities.length;
  const centerX = 380;
  const centerY = 240;
  const fileOrbitRadius = numFiles <= 1 ? 0 : numFiles <= 2 ? 140 : 180;

  fileEntities.forEach((entity, idx) => {
    // Placement angles
    const fileAngle = numFiles <= 1 ? 0 : (2 * Math.PI * idx) / numFiles;
    
    const fileX = centerX + fileOrbitRadius * Math.cos(fileAngle);
    const fileY = centerY + fileOrbitRadius * Math.sin(fileAngle);

    // Assign to file node
    const fileNode = nodes.find(n => n.id === entity.fileId);
    if (fileNode) {
      fileNode.x = Math.round(fileX);
      fileNode.y = Math.round(fileY);
    }

    // Group child nodes (classes and functions) of this file
    const childNodes = nodes.filter(n => 
      n.filePath === entity.file.path && n.type !== 'file'
    );

    const numChildren = childNodes.length;
    const childRadius = 75;

    childNodes.forEach((child, cidx) => {
      // Space them out evenly around parent file coordinates
      const childAngle = numChildren <= 1 ? Math.PI / 2 : (2 * Math.PI * cidx) / numChildren;
      
      child.x = Math.round(fileX + childRadius * Math.cos(childAngle));
      child.y = Math.round(fileY + childRadius * Math.sin(childAngle));
    });
  });

  return { nodes, edges };
}
