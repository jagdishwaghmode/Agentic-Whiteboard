import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

/**
 * Uses ELK.js to calculate professional graph layout with orthogonal edge routing,
 * generous component spacing, and layer group containers.
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
    if (type === 'client' || type === 'gateway') return { width: 230, height: 95 };
    if (type === 'database' || type === 'cache') return { width: 220, height: 95 };
    if (type === 'diamond' || type === 'decision') return { width: 230, height: 105 };
    return { width: 230, height: 95 };
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
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.spacing.nodeNode': '110',
          'elk.spacing.edgeNode': '65',
          'elk.padding': '[top=75,left=55,bottom=55,right=55]',
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
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': isFlowDiagram ? '120' : '140',
      'elk.spacing.edgeNode': '75',
      'elk.layered.spacing.nodeNodeBetweenLayers': isFlowDiagram ? '180' : '250',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.padding': '[top=60,left=60,bottom=60,right=60]',
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
  const edgePointsMap = new Map();

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
          width: child.width || 200,
          height: child.height || 85,
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

  // Process ELK calculated edge sections
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
    x: 100 + (i % 3) * 280,
    y: 200 + Math.floor(i / 3) * 200,
    width: 220,
    height: 90,
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
