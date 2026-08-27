/**
 * Converts ELK-positioned semantic diagrams into 100% native, individually editable Excalidraw elements.
 * Generates professional architecture diagrams with clear icon headers, perfectly separated text,
 * pastel layer containers, and crisp 90-degree orthogonal vector lines.
 */

const generateId = () => `elem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const COMPONENT_ICONS = {
  client: { icon: '💻', bg: '#f0f9ff', stroke: '#0284c7' },
  user: { icon: '👤', bg: '#f0f9ff', stroke: '#0284c7' },
  users: { icon: '👥', bg: '#f0f9ff', stroke: '#0284c7' },
  device: { icon: '📱', bg: '#f0f9ff', stroke: '#0284c7' },
  gateway: { icon: '🌐', bg: '#fffbeb', stroke: '#d97706' },
  vpc: { icon: '🛡️', bg: '#fffbeb', stroke: '#d97706' },
  service: { icon: '🖥️', bg: '#eff6ff', stroke: '#2563eb' },
  docker: { icon: '🐳', bg: '#eff6ff', stroke: '#2563eb' },
  server: { icon: '🖥️', bg: '#eff6ff', stroke: '#2563eb' },
  database: { icon: '🛢️', bg: '#f0fdf4', stroke: '#16a34a' },
  cache: { icon: '⚡', bg: '#ecfdf5', stroke: '#059669' },
  email: { icon: '📧', bg: '#fce7f3', stroke: '#db2777' },
  slack: { icon: '💬', bg: '#fce7f3', stroke: '#db2777' },
  queue: { icon: '📦', bg: '#fae8ff', stroke: '#c026d3' },
  auth: { icon: '🔑', bg: '#f3e8ff', stroke: '#7e22ce' },
  ai: { icon: '✨', bg: '#ede9fe', stroke: '#6d28d9' },
  'external-system': { icon: '☁️', bg: '#f8fafc', stroke: '#475569' },
  decision: { icon: '❖', bg: '#fef9c3', stroke: '#ca8a04' },
  start: { icon: '▶', bg: '#f0fdf4', stroke: '#16a34a' },
  end: { icon: '■', bg: '#fef2f2', stroke: '#dc2626' },
  process: { icon: '⚙️', bg: '#eff6ff', stroke: '#2563eb' },
  entity: { icon: '📋', bg: '#faf5ff', stroke: '#9333ea' },
  topic: { icon: '💡', bg: '#fffbeb', stroke: '#d97706' },
};

const GROUP_PALETTES = [
  { bg: '#f8fafc', stroke: '#3b82f6', labelColor: '#1d4ed8' }, // Frontend / Slate Blue
  { bg: '#fffbeb', stroke: '#f97316', labelColor: '#c2410c' }, // API & Backend / Warm Amber
  { bg: '#f0fdf4', stroke: '#10b981', labelColor: '#047857' }, // Processing / Mint Green
  { bg: '#faf5ff', stroke: '#a855f7', labelColor: '#6b21a8' }, // Data / Purple
  { bg: '#eff6ff', stroke: '#6366f1', labelColor: '#4338ca' }, // Cloud / Indigo
];

const createBaseElement = (type, overrides = {}) => ({
  id: generateId(),
  type,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: '#eff6ff',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 0, // 100% crisp straight vector lines
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

  // 1. Render Layer Group Containers with Pastel Backgrounds & Clean Dashed Outlines
  groups.forEach((grp, idx) => {
    if (!grp.width || !grp.height) return;

    const palette = GROUP_PALETTES[idx % GROUP_PALETTES.length];

    const containerRect = createBaseElement('rectangle', {
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

    const headerText = createBaseElement('text', {
      x: grp.x + 24,
      y: grp.y + 16,
      width: Math.max(grp.label.length * 10, 160),
      height: 26,
      strokeColor: palette.labelColor,
      backgroundColor: 'transparent',
      text: grp.label,
      originalText: grp.label,
      fontSize: 16,
      fontFamily: 2, // Sans-serif font
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

  // 2. Render Component Node Cards (Icon Header + Clear Title Text Below, NO Overlaps!)
  nodes.forEach((node) => {
    const groupId = generateId();
    const config = COMPONENT_ICONS[node.type] || COMPONENT_ICONS.service;
    const label = String(node.label || 'Component');

    // Outer Node Container Box
    const shapeElement = createBaseElement('rectangle', {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      backgroundColor: config.bg,
      strokeColor: config.stroke,
      strokeWidth: 2,
      roughness: 0,
      roundness: { type: 3 },
      groupIds: [groupId],
    });

    // Top Icon Symbol (placed cleanly in top section of node box)
    const iconElement = createBaseElement('text', {
      x: node.x + (node.width - 30) / 2,
      y: node.y + 14,
      width: 30,
      height: 24,
      strokeColor: '#0f172a',
      backgroundColor: 'transparent',
      text: config.icon,
      originalText: config.icon,
      fontSize: 20,
      fontFamily: 2,
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: 20,
      groupIds: [groupId],
      autoResize: true,
    });

    // Component Label (placed cleanly in lower section below icon, ZERO OVERLAP!)
    let fontSize = 13;
    if (label.length > 28) fontSize = 10.5;
    else if (label.length > 18) fontSize = 11.5;

    const textWidth = Math.max(node.width - 20, 60);
    const textHeight = 36;

    const textElement = createBaseElement('text', {
      x: node.x + (node.width - textWidth) / 2,
      y: node.y + 46,
      width: textWidth,
      height: textHeight,
      strokeColor: '#0f172a',
      backgroundColor: 'transparent',
      text: label,
      originalText: label,
      fontSize,
      fontFamily: 2, // Modern clean sans-serif font
      textAlign: 'center',
      verticalAlign: 'top',
      baseline: fontSize,
      containerId: shapeElement.id,
      groupIds: [groupId],
      lineHeight: 1.25,
      autoResize: true,
    });

    shapeElement.boundElements = [{ id: textElement.id, type: 'text' }];

    elements.push(shapeElement, iconElement, textElement);
    nodeMap.set(node.id, { shapeElement, textElement, nodeData: node });

    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  // 3. Render Crisp Non-Wavy Orthogonal Vector Arrow Lines & Clean Connection Badges
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
      roughness: 0,
      roundness: null, // Sharp 90-degree corners
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

    // Render clean relationship label in white pill badge on longest path segment
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
