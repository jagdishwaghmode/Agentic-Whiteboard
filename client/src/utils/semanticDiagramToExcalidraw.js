/**
 * Converts ELK-positioned semantic diagrams (with layer groups, nodes, and relationships)
 * into 100% native, individually editable Excalidraw elements with sharp, non-wavy orthogonal lines.
 */

const generateId = () => `elem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const SHAPE_MAP = {
  client: { shape: 'rectangle', bg: '#e7f5ff', stroke: '#1c7ed6' },
  gateway: { shape: 'rectangle', bg: '#fff9db', stroke: '#f59f00' },
  service: { shape: 'rectangle', bg: '#a5d8ff', stroke: '#1971c2' },
  database: { shape: 'ellipse', bg: '#b2f2bb', stroke: '#2b8a3e' },
  cache: { shape: 'ellipse', bg: '#d3f9d8', stroke: '#37b24d' },
  'external-system': { shape: 'rectangle', bg: '#f1f3f5', stroke: '#495057' },
  decision: { shape: 'diamond', bg: '#ffec99', stroke: '#e67700' },
  start: { shape: 'ellipse', bg: '#d3f9d8', stroke: '#2b8a3e' },
  end: { shape: 'ellipse', bg: '#ffe3e3', stroke: '#e03131' },
  process: { shape: 'rectangle', bg: '#e7f5ff', stroke: '#1c7ed6' },
  entity: { shape: 'rectangle', bg: '#f3d9fa', stroke: '#9c36b5' },
  topic: { shape: 'ellipse', bg: '#fff3bf', stroke: '#e67700' },
  input: { shape: 'rectangle', bg: '#dbeafe', stroke: '#2563eb' },
  output: { shape: 'rectangle', bg: '#dbeafe', stroke: '#2563eb' },
  queue: { shape: 'rectangle', bg: '#eebefa', stroke: '#ae3ec9' },
};

const createBaseElement = (type, overrides = {}) => ({
  id: generateId(),
  type,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: '#a5d8ff',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 0, // Disable wavy hand-drawn lines for crisp straight lines
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: type === 'rectangle' ? { type: 3 } : null,
  seed: Math.floor(Math.random() * 100000),
  version: 1,
  versionNonce: Math.floor(Math.random() * 100000),
  isDeleted: false,
  boundElements: [],
  updated: Date.now(),
  link: null,
  locked: false,
  ...overrides,
});

const getConnectionPoints = (fromNode, toNode) => {
  const fromCenterX = fromNode.x + fromNode.width / 2;
  const fromCenterY = fromNode.y + fromNode.height / 2;
  const toCenterX = toNode.x + toNode.width / 2;
  const toCenterY = toNode.y + toNode.height / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  let startX, startY, endX, endY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      startX = fromNode.x + fromNode.width;
      startY = fromCenterY;
      endX = toNode.x;
      endY = toCenterY;
    } else {
      startX = fromNode.x;
      startY = fromCenterY;
      endX = toNode.x + toNode.width;
      endY = toCenterY;
    }
  } else {
    if (dy > 0) {
      startX = fromCenterX;
      startY = fromNode.y + fromNode.height;
      endX = toCenterX;
      endY = toNode.y;
    } else {
      startX = fromCenterX;
      startY = fromNode.y;
      endX = toCenterX;
      endY = toNode.y + toNode.height;
    }
  }

  return { startX, startY, endX, endY, dx, dy };
};

export function semanticDiagramToExcalidraw(diagram) {
  if (!diagram || !Array.isArray(diagram.nodes)) {
    return { elements: [], boundingBox: null };
  }

  const { groups = [], nodes = [], relationships = [] } = diagram;

  const elements = [];
  const nodeMap = new Map();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 1. Render Group Container Rectangles & Labels
  groups.forEach((grp) => {
    if (!grp.width || !grp.height) return;

    const containerRect = createBaseElement('rectangle', {
      x: grp.x,
      y: grp.y,
      width: grp.width,
      height: grp.height,
      strokeColor: '#94a3b8',
      backgroundColor: '#f8fafc',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'dashed',
      roughness: 0,
      opacity: 70,
    });

    const headerText = createBaseElement('text', {
      x: grp.x + 20,
      y: grp.y + 14,
      width: Math.max(grp.label.length * 10, 140),
      height: 26,
      strokeColor: '#334155',
      backgroundColor: 'transparent',
      text: grp.label,
      originalText: grp.label,
      fontSize: 16,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      baseline: 16,
      autoResize: true,
    });

    elements.push(containerRect, headerText);

    minX = Math.min(minX, grp.x);
    minY = Math.min(minY, grp.y);
    maxX = Math.max(maxX, grp.x + grp.width);
    maxY = Math.max(maxY, grp.y + grp.height);
  });

  // 2. Render Native Node Shapes and Bound Text Elements
  nodes.forEach((node) => {
    const groupId = generateId();
    const config = SHAPE_MAP[node.type] || SHAPE_MAP.service;
    const label = String(node.label || 'Component');

    const shapeElement = createBaseElement(config.shape, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      backgroundColor: config.bg,
      strokeColor: config.stroke,
      roughness: 0, // Sharp crisp shape outline
      groupIds: [groupId],
    });

    // Dynamic font size based on text length
    let fontSize = 14;
    if (label.length > 30) fontSize = 11;
    else if (label.length > 20) fontSize = 12;
    else if (label.length > 15) fontSize = 13;

    const textWidth = Math.max(node.width - 24, 60);
    const textHeight = 24;

    const textElement = createBaseElement('text', {
      x: node.x + (node.width - textWidth) / 2,
      y: node.y + (node.height - textHeight) / 2,
      width: textWidth,
      height: textHeight,
      strokeColor: '#1e1e1e',
      backgroundColor: 'transparent',
      text: label,
      originalText: label,
      fontSize,
      fontFamily: 1, // Virgil hand-drawn font
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: fontSize,
      containerId: shapeElement.id,
      groupIds: [groupId],
      lineHeight: 1.2,
      autoResize: true,
    });

    shapeElement.boundElements = [{ id: textElement.id, type: 'text' }];

    elements.push(shapeElement, textElement);
    nodeMap.set(node.id, { shapeElement, textElement, nodeData: node });

    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  // 3. Render Crisp Non-Wavy Orthogonal Arrow Lines & Labels
  relationships.forEach((rel) => {
    const source = nodeMap.get(rel.from);
    const target = nodeMap.get(rel.to);

    if (!source || !target) return;

    const { startX, startY, endX, endY, dx, dy } = getConnectionPoints(
      source.nodeData,
      target.nodeData
    );

    let points = [];

    if (Array.isArray(rel.bendPoints) && rel.bendPoints.length >= 2) {
      const relStartX = rel.bendPoints[0].x;
      const relStartY = rel.bendPoints[0].y;
      points = rel.bendPoints.map((bp) => [bp.x - relStartX, bp.y - relStartY]);
    } else {
      if (Math.abs(dx) > Math.abs(dy)) {
        const midX = dx / 2;
        points = [
          [0, 0],
          [midX, 0],
          [midX, dy],
          [dx, dy],
        ];
      } else {
        const midY = dy / 2;
        points = [
          [0, 0],
          [0, midY],
          [dx, midY],
          [dx, dy],
        ];
      }
    }

    const arrowElement = createBaseElement('arrow', {
      x: startX,
      y: startY,
      width: endX - startX,
      height: endY - startY,
      strokeColor: '#334155',
      backgroundColor: 'transparent',
      strokeWidth: 2,
      roughness: 0, // 0 = 100% crisp straight line without wavy wobbles
      roundness: null, // Sharp 90-degree right angle corners
      startArrowhead: null,
      endArrowhead: 'arrow',
      points,
      startBinding: {
        elementId: source.shapeElement.id,
        focus: 0,
        gap: 8,
      },
      endBinding: {
        elementId: target.shapeElement.id,
        focus: 0,
        gap: 8,
      },
    });

    source.shapeElement.boundElements.push({ id: arrowElement.id, type: 'arrow' });
    target.shapeElement.boundElements.push({ id: arrowElement.id, type: 'arrow' });

    elements.push(arrowElement);

    // Calculate longest segment along the orthogonal path to place the label cleanly
    if (rel.label && points.length >= 2) {
      let maxLen = -1;
      let labelX = startX;
      let labelY = startY;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const segDx = p2[0] - p1[0];
        const segDy = p2[1] - p1[1];
        const len = Math.sqrt(segDx * segDx + segDy * segDy);

        if (len > maxLen) {
          maxLen = len;
          labelX = startX + p1[0] + segDx / 2;
          labelY = startY + p1[1] + segDy / 2;
        }
      }

      const labelText = String(rel.label);
      const labelWidth = Math.max(labelText.length * 7.5, 55);

      const labelElement = createBaseElement('text', {
        x: labelX - labelWidth / 2,
        y: labelY - 10,
        width: labelWidth,
        height: 18,
        strokeColor: '#334155',
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        roughness: 0,
        opacity: 100,
        text: labelText,
        originalText: labelText,
        fontSize: 11,
        fontFamily: 2,
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: 11,
        lineHeight: 1.2,
        autoResize: true,
      });

      elements.push(labelElement);
    }
  });

  const boundingBox =
    minX !== Infinity
      ? {
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX,
          height: maxY - minY,
          centerX: minX + (maxX - minX) / 2,
          centerY: minY + (maxY - minY) / 2,
        }
      : null;

  return { elements, boundingBox };
}

export default semanticDiagramToExcalidraw;
