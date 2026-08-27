const generateId = () => Math.random().toString(36).substring(2, 10);

const STROKE_COLOR = '#1e1e1e';
const BACKGROUND_COLOR = '#a5d8ff';
const TEXT_COLOR = '#1e1e1e';

const createBaseElement = (type, overrides = {}) => ({
  id: generateId(),
  type,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  angle: 0,
  strokeColor: STROKE_COLOR,
  backgroundColor: BACKGROUND_COLOR,
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
  boundElements: null,
  updated: Date.now(),
  link: null,
  locked: false,
  ...overrides,
});

const createShapeForNode = (node, groupId) => {
  const { x, y, width, height, type = 'rectangle' } = node;

  const baseProps = {
    x,
    y,
    width,
    height,
    groupIds: groupId ? [groupId] : [],
  };

  if (type === 'ellipse') {
    return createBaseElement('ellipse', {
      ...baseProps,
      backgroundColor: '#b2f2bb',
    });
  }

  if (type === 'diamond') {
    return createBaseElement('diamond', {
      ...baseProps,
      backgroundColor: '#ffec99',
    });
  }

  return createBaseElement('rectangle', {
    ...baseProps,
    backgroundColor: '#a5d8ff',
  });
};

const createTextForNode = (node, groupId) => {
  const { x, y, width, height, label = '' } = node;
  const fontSize = 16;
  const textWidth = Math.max(width - 16, 60);
  const textHeight = 24;

  return createBaseElement('text', {
    x: x + (width - textWidth) / 2,
    y: y + (height - textHeight) / 2,
    width: textWidth,
    height: textHeight,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    text: label,
    originalText: label,
    fontSize,
    fontFamily: 2, // 2 = System Sans-Serif font for guaranteed visible rendering
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: null,
    groupIds: groupId ? [groupId] : [],
    lineHeight: 1.25,
    roundness: null,
  });
};

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

const createArrow = (fromNode, toNode, label = '') => {
  const { startX, startY, endX, endY } = getConnectionPoints(fromNode, toNode);

  const arrow = createBaseElement('arrow', {
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
    backgroundColor: 'transparent',
    startArrowhead: null,
    endArrowhead: 'arrow',
    points: [
      [0, 0],
      [endX - startX, endY - startY],
    ],
    roundness: { type: 2 },
  });

  const elements = [arrow];

  if (label) {
    const midX = startX + (endX - startX) / 2;
    const midY = startY + (endY - startY) / 2;

    elements.push(
      createBaseElement('text', {
        x: midX - 40,
        y: midY - 20,
        width: 80,
        height: 20,
        strokeColor: TEXT_COLOR,
        backgroundColor: 'transparent',
        text: label,
        fontSize: 14,
        fontFamily: 2,
        textAlign: 'center',
        verticalAlign: 'middle',
        originalText: label,
        lineHeight: 1.25,
        roundness: null,
      })
    );
  }

  return elements;
};

export const diagramToExcalidraw = (diagram) => {
  const elements = [];
  const nodeMap = new Map();

  for (const node of diagram.nodes || []) {
    const groupId = generateId();
    const shape = createShapeForNode(node, groupId);
    const text = createTextForNode(node, groupId);

    elements.push(shape, text);
    nodeMap.set(node.id, node);
  }

  for (const connection of diagram.connections || []) {
    const fromNode = nodeMap.get(connection.from);
    const toNode = nodeMap.get(connection.to);

    if (fromNode && toNode) {
      elements.push(...createArrow(fromNode, toNode, connection.label));
    }
  }

  return elements;
};

export const excalidrawToDiagram = (elements) => {
  if (!Array.isArray(elements)) {
    return { title: 'Current Diagram', nodes: [], connections: [] };
  }

  const shapes = elements.filter(
    (el) =>
      el &&
      !el.isDeleted &&
      ['rectangle', 'ellipse', 'diamond'].includes(el.type)
  );

  const texts = elements.filter((el) => el && !el.isDeleted && el.type === 'text');
  const arrows = elements.filter((el) => el && !el.isDeleted && el.type === 'arrow');

  const textByGroup = new Map();
  texts.forEach((t) => {
    const gid = t.groupIds?.[0];
    if (gid && t.text) textByGroup.set(gid, t.text);
    if (t.containerId && t.text) textByGroup.set(t.containerId, t.text);
  });

  const nodes = shapes.map((shape, index) => {
    const gid = shape.groupIds?.[0];
    const textLabel = (gid ? textByGroup.get(gid) : null) || textByGroup.get(shape.id) || 'Node';
    return {
      id: shape.id || `node_${index}`,
      type: shape.type,
      label: textLabel,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  });

  const shapeByPosition = new Map();
  nodes.forEach((n) => shapeByPosition.set(n.id, n));

  const findNearestNode = (x, y) => {
    let nearest = null;
    let minDist = Infinity;

    for (const node of nodes) {
      const cx = node.x + node.width / 2;
      const cy = node.y + node.height / 2;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  };

  const connections = arrows
    .map((arrow) => {
      const startX = arrow.x;
      const startY = arrow.y;
      const endX = arrow.x + (arrow.points?.[1]?.[0] || arrow.width);
      const endY = arrow.y + (arrow.points?.[1]?.[1] || arrow.height);

      const fromNode = findNearestNode(startX, startY);
      const toNode = findNearestNode(endX, endY);

      if (!fromNode || !toNode || fromNode.id === toNode.id) return null;

      return { from: fromNode.id, to: toNode.id, label: '' };
    })
    .filter(Boolean);

  return {
    title: 'Current Diagram',
    nodes: nodes.map(({ id, type, label }) => ({ id, type, label })),
    connections,
  };
};

export default diagramToExcalidraw;
