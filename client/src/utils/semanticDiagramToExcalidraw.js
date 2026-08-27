/**
 * Converts ELK-positioned semantic diagrams (with layer groups, nodes, and relationships)
 * into 100% native, individually editable Excalidraw elements.
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
  roughness: 1,
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

  return { startX, startY, endX, endY };
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

    const groupContainerId = generateId();

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
      opacity: 80,
    });

    const headerText = createBaseElement('text', {
      x: grp.x + 16,
      y: grp.y + 12,
      width: Math.max(grp.label.length * 10, 120),
      height: 24,
      strokeColor: '#334155',
      backgroundColor: 'transparent',
      text: grp.label,
      originalText: grp.label,
      fontSize: 16,
      fontFamily: 2, // Sans-serif
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
      groupIds: [groupId],
    });

    const fontSize = 16;
    const textWidth = Math.max(node.width - 20, 60);
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
      fontFamily: 1, // Virgil hand-drawn
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: 18,
      containerId: shapeElement.id,
      groupIds: [groupId],
      lineHeight: 1.25,
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

  // 3. Render Native Arrows & Connection Labels
  relationships.forEach((rel) => {
    const source = nodeMap.get(rel.from);
    const target = nodeMap.get(rel.to);

    if (!source || !target) return;

    const { startX, startY, endX, endY } = getConnectionPoints(
      source.nodeData,
      target.nodeData
    );

    const arrowElement = createBaseElement('arrow', {
      x: startX,
      y: startY,
      width: endX - startX,
      height: endY - startY,
      strokeColor: '#475569',
      backgroundColor: 'transparent',
      startArrowhead: null,
      endArrowhead: 'arrow',
      points: [
        [0, 0],
        [endX - startX, endY - startY],
      ],
      startBinding: {
        elementId: source.shapeElement.id,
        focus: 0,
        gap: 4,
      },
      endBinding: {
        elementId: target.shapeElement.id,
        focus: 0,
        gap: 4,
      },
      roundness: null,
    });

    source.shapeElement.boundElements.push({ id: arrowElement.id, type: 'arrow' });
    target.shapeElement.boundElements.push({ id: arrowElement.id, type: 'arrow' });

    elements.push(arrowElement);

    if (rel.label) {
      const midX = startX + (endX - startX) / 2;
      const midY = startY + (endY - startY) / 2;
      const labelText = String(rel.label);
      const labelWidth = Math.max(labelText.length * 9, 60);

      const labelElement = createBaseElement('text', {
        x: midX - labelWidth / 2,
        y: midY - 20,
        width: labelWidth,
        height: 20,
        strokeColor: '#334155',
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        text: labelText,
        originalText: labelText,
        fontSize: 13,
        fontFamily: 2,
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: 13,
        lineHeight: 1.25,
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
