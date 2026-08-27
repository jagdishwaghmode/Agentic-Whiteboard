const VALID_NODE_TYPES = ['rectangle', 'ellipse', 'diamond'];
const VALID_ACTIONS = ['create', 'modify'];
const VALID_OPERATION_TYPES = [
  'addNode',
  'removeNode',
  'updateNode',
  'addConnection',
  'removeConnection',
  'updateConnection',
];

export class DiagramValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DiagramValidationError';
  }
}

const validateNode = (node, index) => {
  if (!node || typeof node !== 'object') {
    throw new DiagramValidationError(`Node at index ${index} must be an object`);
  }
  if (!node.id || typeof node.id !== 'string') {
    throw new DiagramValidationError(`Node at index ${index} must have a string id`);
  }
  if (!node.label || typeof node.label !== 'string') {
    throw new DiagramValidationError(`Node at index ${index} must have a string label`);
  }
  if (node.type && !VALID_NODE_TYPES.includes(node.type)) {
    throw new DiagramValidationError(
      `Node "${node.id}" has invalid type. Allowed: ${VALID_NODE_TYPES.join(', ')}`
    );
  }
  return {
    id: node.id,
    type: node.type || 'rectangle',
    label: node.label.trim(),
  };
};

const validateConnection = (connection, index, nodeIds) => {
  if (!connection || typeof connection !== 'object') {
    throw new DiagramValidationError(`Connection at index ${index} must be an object`);
  }
  if (!connection.from || !connection.to) {
    throw new DiagramValidationError(`Connection at index ${index} must have from and to fields`);
  }
  if (!nodeIds.has(connection.from)) {
    throw new DiagramValidationError(`Connection references unknown node: ${connection.from}`);
  }
  if (!nodeIds.has(connection.to)) {
    throw new DiagramValidationError(`Connection references unknown node: ${connection.to}`);
  }
  return {
    from: connection.from,
    to: connection.to,
    label: connection.label?.trim() || '',
  };
};

export const validateCreateDiagram = (diagram) => {
  if (!diagram || typeof diagram !== 'object') {
    throw new DiagramValidationError('Diagram must be an object');
  }

  if (diagram.action !== 'create') {
    throw new DiagramValidationError('Diagram action must be "create"');
  }

  if (!Array.isArray(diagram.nodes) || diagram.nodes.length === 0) {
    throw new DiagramValidationError('Diagram must contain at least one node');
  }

  const nodes = diagram.nodes.map(validateNode);
  const nodeIds = new Set(nodes.map((n) => n.id));

  const connections = (diagram.connections || []).map((c, i) =>
    validateConnection(c, i, nodeIds)
  );

  return {
    action: 'create',
    title: diagram.title?.trim() || 'Untitled Diagram',
    nodes,
    connections,
  };
};

export const validateModifyDiagram = (diagram) => {
  if (!diagram || typeof diagram !== 'object') {
    throw new DiagramValidationError('Modify response must be an object');
  }

  if (diagram.action !== 'modify') {
    throw new DiagramValidationError('Diagram action must be "modify"');
  }

  if (!Array.isArray(diagram.operations) || diagram.operations.length === 0) {
    throw new DiagramValidationError('Modify response must contain operations');
  }

  const operations = diagram.operations.map((op, index) => {
    if (!op || typeof op !== 'object') {
      throw new DiagramValidationError(`Operation at index ${index} must be an object`);
    }
    if (!VALID_OPERATION_TYPES.includes(op.type)) {
      throw new DiagramValidationError(`Invalid operation type: ${op.type}`);
    }
    return op;
  });

  return {
    action: 'modify',
    operations,
  };
};

export const applyModifyOperations = (currentDiagram, modifyResponse) => {
  const diagram = {
    action: 'create',
    title: currentDiagram.title || 'Modified Diagram',
    nodes: [...(currentDiagram.nodes || [])],
    connections: [...(currentDiagram.connections || [])],
  };

  for (const op of modifyResponse.operations) {
    switch (op.type) {
      case 'addNode': {
        const node = validateNode(op.node, 0);
        if (diagram.nodes.some((n) => n.id === node.id)) {
          throw new DiagramValidationError(`Node "${node.id}" already exists`);
        }
        diagram.nodes.push(node);
        break;
      }
      case 'removeNode': {
        diagram.nodes = diagram.nodes.filter((n) => n.id !== op.nodeId && n.id !== op.id);
        diagram.connections = diagram.connections.filter(
          (c) => c.from !== op.nodeId && c.to !== op.nodeId && c.from !== op.id && c.to !== op.id
        );
        break;
      }
      case 'updateNode': {
        const idx = diagram.nodes.findIndex((n) => n.id === op.nodeId || n.id === op.id);
        if (idx === -1) {
          throw new DiagramValidationError(`Node not found for update: ${op.nodeId || op.id}`);
        }
        diagram.nodes[idx] = { ...diagram.nodes[idx], ...op.updates, ...op.node };
        break;
      }
      case 'addConnection': {
        const nodeIds = new Set(diagram.nodes.map((n) => n.id));
        diagram.connections.push(validateConnection(op, 0, nodeIds));
        break;
      }
      case 'removeConnection': {
        diagram.connections = diagram.connections.filter(
          (c) => !(c.from === op.from && c.to === op.to)
        );
        break;
      }
      case 'updateConnection': {
        const idx = diagram.connections.findIndex(
          (c) => c.from === op.from && c.to === op.to
        );
        if (idx === -1) {
          throw new DiagramValidationError(`Connection not found: ${op.from} -> ${op.to}`);
        }
        diagram.connections[idx] = { ...diagram.connections[idx], ...op.updates };
        break;
      }
      default:
        break;
    }
  }

  if (diagram.nodes.length === 0) {
    throw new DiagramValidationError('Diagram must contain at least one node after modifications');
  }

  const nodeIds = new Set(diagram.nodes.map((n) => n.id));
  diagram.connections = diagram.connections.map((c, i) => validateConnection(c, i, nodeIds));

  return diagram;
};
