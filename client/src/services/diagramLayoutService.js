import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

/**
 * Calculates graph layout with global ELK orthogonal edge routing,
 * generous component spacing, and dynamic group bounding boxes.
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

  const isFlowDiagram = ['flowchart', 'workflow', 'process-flow'].includes(semanticDiagram.diagramType);
  const elkDirection = isFlowDiagram ? 'DOWN' : direction === 'LEFT_TO_RIGHT' ? 'RIGHT' : 'DOWN';

  const nodeDimension = (type) => {
    if (type === 'client' || type === 'gateway') return { width: 240, height: 95 };
    if (type === 'database' || type === 'cache') return { width: 230, height: 95 };
    if (type === 'diamond' || type === 'decision') return { width: 240, height: 105 };
    return { width: 240, height: 95 };
  };

  // Pass nodes directly to ELK at root level for global coordinate assignment
  const rootChildren = nodes.map((node) => {
    const dims = nodeDimension(node.type);
    return {
      id: node.id,
      width: dims.width,
      height: dims.height,
      labels: [{ text: node.label }],
      nodeData: node,
    };
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
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': isFlowDiagram ? '130' : '150',
      'elk.spacing.edgeNode': '85',
      'elk.layered.spacing.nodeNodeBetweenLayers': isFlowDiagram ? '200' : '260',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.padding': '[top=80,left=80,bottom=80,right=80]',
    },
    children: rootChildren,
    edges: elkEdges,
  };

  try {
    const layoutResult = await elk.layout(graph);
    return processElkResult(layoutResult, semanticDiagram, groups);
  } catch (err) {
    console.warn('ELK layout failed, falling back to grid layout:', err.message);
    return fallbackGridLayout(semanticDiagram);
  }
}

function processElkResult(layoutResult, semanticDiagram, originalGroups) {
  const nodesWithCoords = [];
  const edgePointsMap = new Map();

  if (Array.isArray(layoutResult.children)) {
    layoutResult.children.forEach((child) => {
      if (child.nodeData) {
        nodesWithCoords.push({
          ...child.nodeData,
          x: child.x || 0,
          y: child.y || 0,
          width: child.width || 240,
          height: child.height || 95,
        });
      }
    });
  }

  // Calculate dynamic bounding boxes for layer group containers
  const nodeMapByGroup = new Map();
  nodesWithCoords.forEach((node) => {
    if (node.group) {
      if (!nodeMapByGroup.has(node.group)) nodeMapByGroup.set(node.group, []);
      nodeMapByGroup.get(node.group).push(node);
    }
  });

  const groupsWithBounds = (originalGroups || []).map((grp) => {
    const memberNodes = nodeMapByGroup.get(grp.id) || [];
    if (memberNodes.length === 0) {
      return { ...grp, x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    memberNodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const paddingX = 45;
    const paddingTop = 60; // Extra space for layer group title header
    const paddingBottom = 45;

    return {
      id: grp.id,
      label: grp.label,
      description: grp.description,
      x: minX - paddingX,
      y: minY - paddingTop,
      width: maxX - minX + paddingX * 2,
      height: maxY - minY + paddingTop + paddingBottom,
    };
  }).filter((g) => g.width > 0 && g.height > 0);

  // Process ELK calculated orthogonal edge sections
  if (Array.isArray(layoutResult.edges)) {
    layoutResult.edges.forEach((edge) => {
      if (Array.isArray(edge.sections) && edge.sections.length > 0) {
        const sec = edge.sections[0];
        const points = [];
        if (sec.startPoint) points.push({ x: sec.startPoint.x, y: sec.startPoint.y });
        if (Array.isArray(sec.bendPoints)) {
          sec.bendPoints.forEach((bp) => points.push({ x: bp.x, y: bp.y }));
        }
        if (sec.endPoint) points.push({ x: sec.endPoint.x, y: sec.endPoint.y });

        if (edge.relData) {
          edgePointsMap.set(edge.id, points);
        }
      }
    });
  }

  const relationshipsWithBendPoints = (semanticDiagram.relationships || []).map((rel, idx) => {
    const edgeId = `e_${rel.from}_${rel.to}_${idx}`;
    return {
      ...rel,
      bendPoints: edgePointsMap.get(edgeId) || null,
    };
  });

  return {
    title: semanticDiagram.title,
    direction: semanticDiagram.direction,
    groups: groupsWithBounds,
    nodes: nodesWithCoords,
    relationships: relationshipsWithBendPoints,
  };
}

function fallbackGridLayout(semanticDiagram) {
  const nodes = (semanticDiagram.nodes || []).map((n, i) => ({
    ...n,
    x: 100 + (i % 3) * 300,
    y: 200 + Math.floor(i / 3) * 220,
    width: 240,
    height: 95,
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
