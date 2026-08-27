/**
 * Converts ELK-positioned semantic diagrams (with layer groups, nodes, and relationships)
 * into 100% native, individually editable Excalidraw elements with color-coded layer blocks
 * and highlighted header badges (Miro / AWS style).
 */

const generateId = () => `elem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

// Distinct color theme palette per node category
const SHAPE_MAP = {
  client: { shape: 'rectangle', bg: '#ffe8cc', stroke: '#d9480f' },
  gateway: { shape: 'rectangle', bg: '#fff3bf', stroke: '#f59f00' },
  service: { shape: 'rectangle', bg: '#d0ebff', stroke: '#1971c2' },
  database: { shape: 'ellipse', bg: '#d3f9d8', stroke: '#2b8a3e' },
  cache: { shape: 'ellipse', bg: '#e6fcf5', stroke: '#0ca678' },
  'external-system': { shape: 'rectangle', bg: '#f1f3f5', stroke: '#495057' },
  decision: { shape: 'diamond', bg: '#ffec99', stroke: '#e67700' },
  start: { shape: 'ellipse', bg: '#d3f9d8', stroke: '#2b8a3e' },
  end: { shape: 'ellipse', bg: '#ffe3e3', stroke: '#e03131' },
  process: { shape: 'rectangle', bg: '#e7f5ff', stroke: '#1c7ed6' },
  entity: { shape: 'rectangle', bg: '#f3d9fa', stroke: '#9c36b5' },
  topic: { shape: 'ellipse', bg: '#fff3bf', stroke: '#e67700' },
  input: { shape: 'rectangle', bg: '#ffe8cc', stroke: '#d9480f' },
  output: { shape: 'rectangle', bg: '#d0ebff', stroke: '#1971c2' },
  queue: { shape: 'rectangle', bg: '#f3d9fa', stroke: '#9c36b5' },
};

// Miro / AWS Style Layer Group Color Palettes
const GROUP_PALETTES = [
  { bg: '#fff4e6', stroke: '#f59f00', labelColor: '#d9480f', badgeBg: '#ffe8cc' }, // Orange (Frontend Layer)
  { bg: '#fff9db', stroke: '#e67700', labelColor: '#b55800', badgeBg: '#fff3bf' }, // Amber (Backend / API Layer)
  { bg: '#e7f5ff', stroke: '#1c7ed6', labelColor: '#1971c2', badgeBg: '#d0ebff' }, // Blue (Processing / Core Services)
  { bg: '#ebfbee', stroke: '#37b24d', labelColor: '#2b8a3e', badgeBg: '#d3f9d8' }, // Green (Data / Storage Layer)
  { bg: '#f3d9fa', stroke: '#ae3ec9', labelColor: '#9c36b5', badgeBg: '#eebefa' }, // Purple (AI / Intelligence Layer)
  { bg: '#ffe3e3', stroke: '#f03e3e', labelColor: '#c92a2a', badgeBg: '#ffc9c9' }, // Red (Security / External Layer)
];

function getGroupPalette(label = '', idx = 0) {
  const l = (label || '').toLowerCase();
  if (l.includes('front') || l.includes('client') || l.includes('ui') || l.includes('web') || l.includes('console')) {
    return GROUP_PALETTES[0];
  }
  if (l.includes('api') || l.includes('backend') || l.includes('gateway') || l.includes('server')) {
    return GROUP_PALETTES[1];
  }
  if (l.includes('core') || l.includes('process') || l.includes('service') || l.includes('module') || l.includes('engine')) {
    return GROUP_PALETTES[2];
  }
  if (l.includes('data') || l.includes('storage') || l.includes('db') || l.includes('database') || l.includes('region')) {
    return GROUP_PALETTES[3];
  }
  if (l.includes('ai') || l.includes('ml') || l.includes('model') || l.includes('assessment') || l.includes('intelligence')) {
    return GROUP_PALETTES[4];
  }
  return GROUP_PALETTES[idx % GROUP_PALETTES.length];
}

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

  // 1. Render Color-Coded Group Container Rectangles & Highlighted Header Badges
  groups.forEach((grp, grpIdx) => {
    if (!grp.width || !grp.height) return;

    const palette = getGroupPalette(grp.label, grpIdx);
    const groupContainerId = generateId();

    // Group Outer Container Box with Color Tint & Dashed Border
    const containerRect = createBaseElement('rectangle', {
      id: groupContainerId,
      x: grp.x,
      y: grp.y,
      width: grp.width,
      height: grp.height,
      strokeColor: palette.stroke,
      backgroundColor: palette.bg,
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'dashed',
      roughness: 0,
      opacity: 85,
    });

    // Highlighted Header Label Pill/Badge (Miro AWS style)
    const labelText = String(grp.label || 'Layer Block');
    const badgeWidth = Math.max(labelText.length * 10, 140);
    const badgeHeight = 28;

    // Centered or Top-Left Header Badge Rectangle
    const badgeRect = createBaseElement('rectangle', {
      x: grp.x + (grp.width - badgeWidth) / 2,
      y: grp.y + 12,
      width: badgeWidth,
      height: badgeHeight,
      strokeColor: palette.stroke,
      backgroundColor: palette.badgeBg,
      fillStyle: 'solid',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 95,
      roundness: { type: 3 },
    });

    const headerText = createBaseElement('text', {
      x: badgeRect.x,
      y: badgeRect.y + 4,
      width: badgeWidth,
      height: badgeHeight - 8,
      strokeColor: palette.labelColor,
      backgroundColor: 'transparent',
      text: labelText,
      originalText: labelText,
      fontSize: 14,
      fontFamily: 2, // Sans-serif bold
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: 14,
      containerId: badgeRect.id,
      lineHeight: 1.2,
      autoResize: true,
    });

    badgeRect.boundElements = [{ id: headerText.id, type: 'text' }];

    elements.push(containerRect, badgeRect, headerText);

    minX = Math.min(minX, grp.x);
    minY = Math.min(minY, grp.y);
    maxX = Math.max(maxX, grp.x + grp.width);
    maxY = Math.max(maxY, grp.y + grp.height);
  });

  // 2. Render Native Node Shapes with Color-Mapped Theme Styles
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
      strokeWidth: 2,
      groupIds: [groupId],
    });

    const fontSize = 15;
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

  // 3. Render Native Arrow Connections & Relationship Labels
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
