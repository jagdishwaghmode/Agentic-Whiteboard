/**
 * Factory utility for converting structured AI diagram JSON into native,
 * 100% editable Excalidraw elements (rectangles, ellipses, diamonds, text, arrows).
 */

const generateId = () => `elem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const COLOR_SCHEMES = {
  rectangle: { bg: '#a5d8ff', stroke: '#1c7ed6' }, // Blue
  ellipse: { bg: '#b2f2bb', stroke: '#2b8a3e' },   // Green
  diamond: { bg: '#ffec99', stroke: '#e67700' },   // Yellow
};

/**
 * Adjust node coordinates to prevent overlaps and enforce a minimum 100px gap
 */
const adjustLayoutOverlaps = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const adjusted = nodes.map((n) => ({ ...n }));
  const MIN_GAP = 100;

  adjusted.sort((a, b) => a.x - b.x);

  for (let i = 0; i < adjusted.length; i++) {
    for (let j = i + 1; j < adjusted.length; j++) {
      const nodeA = adjusted[i];
      const nodeB = adjusted[j];

      const overlapX = nodeA.x + nodeA.width + MIN_GAP - nodeB.x;
      const overlapY = Math.abs(nodeA.y - nodeB.y) < 40;

      if (overlapX > 0 && overlapY) {
        nodeB.x += overlapX;
      }
    }
  }

  return adjusted;
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

export function createDiagramElements(diagram) {
  if (!diagram || !Array.isArray(diagram.nodes)) {
    return { elements: [], boundingBox: null };
  }

  const nodes = adjustLayoutOverlaps(diagram.nodes);
  const connections = Array.isArray(diagram.connections) ? diagram.connections : [];

  const elements = [];
  const nodeMap = new Map();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 1. Create Native Shape and Bound Text elements for each node
  nodes.forEach((node) => {
    const groupId = generateId();
    const shapeType = ['rectangle', 'ellipse', 'diamond'].includes(node.shape)
      ? node.shape
      : 'rectangle';

    const colors = COLOR_SCHEMES[shapeType] || COLOR_SCHEMES.rectangle;
    const label = String(node.label || 'Node');

    // Native Shape Element
    const shapeElement = createBaseElement(shapeType, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      backgroundColor: colors.bg,
      strokeColor: colors.stroke,
      groupIds: [groupId],
    });

    const fontSize = 18;
    const textWidth = Math.max(node.width - 20, 60);
    const textHeight = 24;

    // Native Editable Bound Text Element inside Shape
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
      fontFamily: 1, // Hand-drawn Virgil font
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

  // 2. Create Native Arrow elements and connection text labels
  connections.forEach((conn) => {
    const source = nodeMap.get(conn.from);
    const target = nodeMap.get(conn.to);

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
      strokeColor: '#495057',
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
      roundness: { type: 2 },
    });

    source.shapeElement.boundElements.push({ id: arrowElement.id, type: 'arrow' });
    target.shapeElement.boundElements.push({ id: arrowElement.id, type: 'arrow' });

    elements.push(arrowElement);

    // If connection label exists, create native editable text element
    if (conn.label) {
      const midX = startX + (endX - startX) / 2;
      const midY = startY + (endY - startY) / 2;
      const labelText = String(conn.label);
      const labelWidth = Math.max(labelText.length * 10, 60);

      const labelElement = createBaseElement('text', {
        x: midX - labelWidth / 2,
        y: midY - 22,
        width: labelWidth,
        height: 20,
        strokeColor: '#1e1e1e',
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        text: labelText,
        originalText: labelText,
        fontSize: 14,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: 14,
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

export default createDiagramElements;
