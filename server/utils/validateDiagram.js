const SUPPORTED_SHAPES = ['rectangle', 'ellipse', 'diamond'];
const SUPPORTED_DIAGRAM_TYPES = [
  'flowchart',
  'system-architecture',
  'sequence',
  'mind-map',
  'process-flow',
  'database-schema',
  'generic',
];

export class DiagramValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DiagramValidationError';
  }
}

export function validateDiagram(data) {
  if (!data || typeof data !== 'object') {
    throw new DiagramValidationError('AI returned an invalid diagram structure. Please try again.');
  }

  const diagramType =
    data.diagramType && SUPPORTED_DIAGRAM_TYPES.includes(data.diagramType)
      ? data.diagramType
      : 'flowchart';

  if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
    throw new DiagramValidationError('AI diagram must contain at least one node.');
  }

  if (!Array.isArray(data.connections)) {
    data.connections = [];
  }

  const nodeIds = new Set();
  const validNodes = [];

  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i];
    if (!node || typeof node !== 'object') {
      throw new DiagramValidationError(`Node at index ${i} is invalid.`);
    }

    const id = node.id ? String(node.id).trim() : `node_${i + 1}`;
    if (nodeIds.has(id)) {
      throw new DiagramValidationError(`Duplicate node ID detected: "${id}".`);
    }
    nodeIds.add(id);

    const shape = SUPPORTED_SHAPES.includes(node.shape) ? node.shape : 'rectangle';
    const label = node.label !== undefined && node.label !== null ? String(node.label).trim() : id;
    const x = typeof node.x === 'number' && !isNaN(node.x) ? node.x : i * 250 + 100;
    const y = typeof node.y === 'number' && !isNaN(node.y) ? node.y : 200;
    const width = typeof node.width === 'number' && node.width > 0 ? node.width : 180;
    const height = typeof node.height === 'number' && node.height > 0 ? node.height : 80;

    validNodes.push({
      id,
      shape,
      label,
      x,
      y,
      width,
      height,
    });
  }

  const connectionIds = new Set();
  const validConnections = [];

  for (let i = 0; i < data.connections.length; i++) {
    const conn = data.connections[i];
    if (!conn || typeof conn !== 'object') continue;

    const from = String(conn.from || '').trim();
    const to = String(conn.to || '').trim();

    if (!from || !nodeIds.has(from)) {
      throw new DiagramValidationError(`The generated diagram contains an invalid connection from node "${from}".`);
    }

    if (!to || !nodeIds.has(to)) {
      throw new DiagramValidationError(`The generated diagram contains an invalid connection to node "${to}".`);
    }

    let connId = conn.id ? String(conn.id).trim() : `conn_${from}_${to}_${i}`;
    if (connectionIds.has(connId)) {
      connId = `conn_${from}_${to}_${Date.now()}_${i}`;
    }
    connectionIds.add(connId);

    const label = conn.label !== undefined && conn.label !== null ? String(conn.label).trim() : '';

    validConnections.push({
      id: connId,
      from,
      to,
      label,
    });
  }

  return {
    diagramType,
    nodes: validNodes,
    connections: validConnections,
  };
}

export default { validateDiagram, DiagramValidationError };
