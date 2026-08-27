import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

/**
 * Uses ELK.js to calculate professional graph layout (coordinates, node spacing, and group containers)
 */
export async function layoutSemanticDiagram(semanticDiagram) {
  if (!semanticDiagram || !Array.isArray(semanticDiagram.nodes)) {
    throw new Error('Invalid semantic diagram provided to layout engine.');
  }

  const {
    title = 'Architecture Diagram',
    direction = 'TOP_TO_BOTTOM',
    groups = [],
    nodes = [],
    relationships = [],
  } = semanticDiagram;

  const elkDirection = direction === 'LEFT_TO_RIGHT' ? 'RIGHT' : 'DOWN';

  const groupMap = new Map();
  groups.forEach((g) => {
    groupMap.set(g.id, {
      id: g.id,
      label: g.label,
      description: g.description,
      children: [],
    });
  });

  const nodeDimension = (type) => {
    if (type === 'client' || type === 'gateway') return { width: 190, height: 80 };
    if (type === 'database' || type === 'cache') return { width: 180, height: 80 };
    if (type === 'diamond' || type === 'decision') return { width: 190, height: 90 };
    return { width: 200, height: 80 };
  };

  const rootChildren = [];

  nodes.forEach((node) => {
    const dims = nodeDimension(node.type);
    const elkNode = {
      id: node.id,
      width: dims.width,
      height: dims.height,
      labels: [{ text: node.label }],
      nodeData: node,
    };

    if (node.group && groupMap.has(node.group)) {
      groupMap.get(node.group).children.push(elkNode);
    } else {
      rootChildren.push(elkNode);
    }
  });

  // Create compound ELK nodes for layer groups
  groupMap.forEach((grp) => {
    if (grp.children.length > 0) {
      rootChildren.push({
        id: grp.id,
        labels: [{ text: grp.label }],
        children: grp.children,
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': elkDirection,
          'elk.spacing.nodeNode': '60',
          'elk.padding': '[top=50,left=30,bottom=30,right=30]',
        },
      });
    }
  });

  const elkEdges = relationships.map((rel, index) => ({
    id: `e_${rel.from}_${rel.to}_${index}`,
    sources: [rel.from],
    targets: [rel.to],
    labels: rel.label ? [{ text: rel.label }] : [],
    relData: rel,
  }));

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': elkDirection,
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
      'elk.layered.nodePlacement.strategy': 'SIMPLE',
      'elk.padding': '[top=50,left=50,bottom=50,right=50]',
    },
    children: rootChildren,
    edges: elkEdges,
  };

  try {
    const layoutResult = await elk.layout(graph);
    return processElkResult(layoutResult, semanticDiagram, groupMap);
  } catch (err) {
    console.warn('ELK layout failed, falling back to grid layout:', err.message);
    return fallbackGridLayout(semanticDiagram);
  }
}

function processElkResult(layoutResult, semanticDiagram, groupMap) {
  const nodesWithCoords = [];
  const groupsWithBounds = [];

  function processChildren(children, parentX = 0, parentY = 0) {
    if (!Array.isArray(children)) return;

    children.forEach((child) => {
      const absX = parentX + (child.x || 0);
      const absY = parentY + (child.y || 0);

      if (child.nodeData) {
        nodesWithCoords.push({
          ...child.nodeData,
          x: absX,
          y: absY,
          width: child.width || 180,
          height: child.height || 80,
        });
      } else if (groupMap.has(child.id)) {
        const grp = groupMap.get(child.id);
        groupsWithBounds.push({
          id: grp.id,
          label: grp.label,
          description: grp.description,
          x: absX,
          y: absY,
          width: child.width || 400,
          height: child.height || 250,
        });

        if (child.children) {
          processChildren(child.children, absX, absY);
        }
      }
    });
  }

  processChildren(layoutResult.children);

  return {
    title: semanticDiagram.title,
    direction: semanticDiagram.direction,
    groups: groupsWithBounds,
    nodes: nodesWithCoords,
    relationships: semanticDiagram.relationships || [],
  };
}

function fallbackGridLayout(semanticDiagram) {
  const nodes = (semanticDiagram.nodes || []).map((n, i) => ({
    ...n,
    x: 100 + (i % 3) * 260,
    y: 200 + Math.floor(i / 3) * 180,
    width: 200,
    height: 80,
  }));

  return {
    title: semanticDiagram.title,
    direction: semanticDiagram.direction,
    groups: semanticDiagram.groups || [],
    nodes,
    relationships: semanticDiagram.relationships || [],
  };
}

export default layoutSemanticDiagram;
