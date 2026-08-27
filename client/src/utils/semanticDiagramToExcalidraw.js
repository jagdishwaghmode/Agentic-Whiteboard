/**
 * Converts ELK-positioned semantic diagrams into 100% native, individually editable Excalidraw elements.
 * Generates AWS-grade architecture diagrams matching Miro reference design with distinct icon cards,
 * perfectly centered text labels below icons, pastel layer containers, and crisp 90-degree vector lines.
 */

const generateId = () => `elem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const COMPONENT_PALETTES = {
  client: { icon: '🌐', bg: '#f0f9ff', stroke: '#0284c7', iconBg: '#0284c7', iconColor: '#ffffff' },
  user: { icon: '👤', bg: '#f0f9ff', stroke: '#0284c7', iconBg: '#0284c7', iconColor: '#ffffff' },
  users: { icon: '👥', bg: '#f0f9ff', stroke: '#0284c7', iconBg: '#0284c7', iconColor: '#ffffff' },
  device: { icon: '📱', bg: '#f0f9ff', stroke: '#0284c7', iconBg: '#0284c7', iconColor: '#ffffff' },
  gateway: { icon: '</>', bg: '#fffbeb', stroke: '#d97706', iconBg: '#d97706', iconColor: '#ffffff' },
  vpc: { icon: '🛡️', bg: '#fffbeb', stroke: '#d97706', iconBg: '#d97706', iconColor: '#ffffff' },
  service: { icon: 'λ', bg: '#fff7ed', stroke: '#ea580c', iconBg: '#ea580c', iconColor: '#ffffff' },
  lambda: { icon: 'λ', bg: '#fff7ed', stroke: '#ea580c', iconBg: '#ea580c', iconColor: '#ffffff' },
  docker: { icon: '🐳', bg: '#eff6ff', stroke: '#2563eb', iconBg: '#2563eb', iconColor: '#ffffff' },
  server: { icon: '🖥️', bg: '#eff6ff', stroke: '#2563eb', iconBg: '#2563eb', iconColor: '#ffffff' },
  database: { icon: '🛢️', bg: '#f0fdf4', stroke: '#16a34a', iconBg: '#16a34a', iconColor: '#ffffff' },
  s3: { icon: '🛢️', bg: '#f0fdf4', stroke: '#16a34a', iconBg: '#16a34a', iconColor: '#ffffff' },
  cache: { icon: '⚡', bg: '#ecfdf5', stroke: '#059669', iconBg: '#059669', iconColor: '#ffffff' },
  email: { icon: '📧', bg: '#fce7f3', stroke: '#db2777', iconBg: '#db2777', iconColor: '#ffffff' },
  slack: { icon: '💬', bg: '#fce7f3', stroke: '#db2777', iconBg: '#db2777', iconColor: '#ffffff' },
  queue: { icon: '📦', bg: '#fae8ff', stroke: '#c026d3', iconBg: '#c026d3', iconColor: '#ffffff' },
  auth: { icon: '🔒', bg: '#fef2f2', stroke: '#dc2626', iconBg: '#dc2626', iconColor: '#ffffff' },
  ai: { icon: '✨', bg: '#faf5ff', stroke: '#9333ea', iconBg: '#9333ea', iconColor: '#ffffff' },
  analytics: { icon: '📊', bg: '#fdf2f8', stroke: '#db2777', iconBg: '#db2777', iconColor: '#ffffff' },
  'external-system': { icon: '☁️', bg: '#f8fafc', stroke: '#475569', iconBg: '#475569', iconColor: '#ffffff' },
  decision: { icon: '❖', bg: '#fef9c3', stroke: '#ca8a04', iconBg: '#ca8a04', iconColor: '#ffffff' },
  start: { icon: '▶', bg: '#f0fdf4', stroke: '#16a34a', iconBg: '#16a34a', iconColor: '#ffffff' },
  end: { icon: '■', bg: '#fef2f2', stroke: '#dc2626', iconBg: '#dc2626', iconColor: '#ffffff' },
  process: { icon: '⚙️', bg: '#eff6ff', stroke: '#2563eb', iconBg: '#2563eb', iconColor: '#ffffff' },
  entity: { icon: '📋', bg: '#faf5ff', stroke: '#9333ea', iconBg: '#9333ea', iconColor: '#ffffff' },
  topic: { icon: '💡', bg: '#fffbeb', stroke: '#d97706', iconBg: '#d97706', iconColor: '#ffffff' },
};

const GROUP_PALETTES = [
  { bg: '#fffbeb', stroke: '#f97316', labelColor: '#c2410c' }, // Frontend / Warm Amber
  { bg: '#fff8f0', stroke: '#ea580c', labelColor: '#9a3412' }, // Backend / Warm Orange
  { bg: '#f0fdf4', stroke: '#16a34a', labelColor: '#15803d' }, // Region / Mint Green
  { bg: '#faf5ff', stroke: '#9333ea', labelColor: '#7e22ce' }, // Cloud / Purple
  { bg: '#f0f9ff', stroke: '#0284c7', labelColor: '#0369a1' }, // Edge / Slate Blue
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
  roughness: 0, // 100% crisp vector lines
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

  // 1. Render Layer Container Boxes with Pastel Backgrounds & Clean Dashed Outlines
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

  // 2. Render AWS-Grade Component Nodes (Card + Icon Square Badge + Centered Title Text)
  nodes.forEach((node) => {
    const groupId = generateId();
    const config = COMPONENT_PALETTES[node.type] || COMPONENT_PALETTES.service;
    const label = String(node.label || 'Component');

    // Outer Card Box
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

    // Icon Badge Square (36x36 centered at top of card)
    const badgeSize = 36;
    const iconBadge = createBaseElement('rectangle', {
      x: node.x + (node.width - badgeSize) / 2,
      y: node.y + 12,
      width: badgeSize,
      height: badgeSize,
      backgroundColor: config.iconBg,
      strokeColor: config.stroke,
      strokeWidth: 1.5,
      roughness: 0,
      roundness: { type: 3 },
      groupIds: [groupId],
    });

    // Icon Symbol Text centered inside icon badge
    const iconText = createBaseElement('text', {
      x: node.x + (node.width - 28) / 2,
      y: node.y + 18,
      width: 28,
      height: 24,
      strokeColor: config.iconColor,
      backgroundColor: 'transparent',
      text: config.icon,
      originalText: config.icon,
      fontSize: 18,
      fontFamily: 2,
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: 18,
      groupIds: [groupId],
      autoResize: true,
    });

    // Component Title Text centered horizontally below icon badge (ZERO OVERLAP!)
    let fontSize = 12.5;
    if (label.length > 28) fontSize = 10.5;
    else if (label.length > 18) fontSize = 11.5;

    const textWidth = Math.max(node.width - 16, 60);
    const textHeight = 36;

    const textElement = createBaseElement('text', {
      x: node.x + (node.width - textWidth) / 2,
      y: node.y + 54,
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
      groupIds: [groupId],
      lineHeight: 1.2,
      autoResize: true,
    });

    shapeElement.boundElements = [{ id: textElement.id, type: 'text' }];

    elements.push(shapeElement, iconBadge, iconText, textElement);
    nodeMap.set(node.id, { shapeElement, textElement, nodeData: node });

    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  // 3. Render Crisp Non-Wavy Orthogonal Vector Arrow Lines & Connection Badges
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
      roundness: null, // Crisp 90-degree corners
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
