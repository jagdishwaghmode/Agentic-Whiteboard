import { removeDuplicateRelationships } from './removeDuplicateRelationships.js';

export function validateSemanticDiagram(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Semantic diagram must be a valid object');
  }

  const title = data.title && typeof data.title === 'string' ? data.title.trim() : 'Architecture Diagram';
  const diagramType = data.diagramType || 'high-level-system-architecture';
  const direction = data.direction === 'LEFT_TO_RIGHT' ? 'LEFT_TO_RIGHT' : 'TOP_TO_BOTTOM';

  const groups = Array.isArray(data.groups)
    ? data.groups.map((g, i) => ({
        id: g.id ? String(g.id).trim() : `group_${i}`,
        label: g.label ? String(g.label).trim() : `Group ${i + 1}`,
        description: g.description ? String(g.description).trim() : '',
      }))
    : [];

  const groupIds = new Set(groups.map((g) => g.id));

  if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
    throw new Error('Semantic diagram must contain at least one node');
  }

  const nodeIds = new Set();
  const nodes = [];

  for (let i = 0; i < data.nodes.length; i++) {
    const n = data.nodes[i];
    if (!n || typeof n !== 'object') continue;

    // CRITICAL: Ensure AI did NOT inject coordinates
    delete n.x;
    delete n.y;
    delete n.width;
    delete n.height;

    const id = n.id ? String(n.id).trim() : `node_${i + 1}`;
    if (nodeIds.has(id)) continue;
    nodeIds.add(id);

    const label = n.label ? String(n.label).trim() : id;
    const type = n.type || 'service';
    const group = n.group && groupIds.has(String(n.group).trim()) ? String(n.group).trim() : null;

    nodes.push({
      id,
      label,
      description: n.description ? String(n.description).trim() : '',
      type,
      group,
    });
  }

  const rawRelationships = Array.isArray(data.relationships) ? data.relationships : [];
  const validRelationships = [];

  for (const rel of rawRelationships) {
    if (!rel || typeof rel !== 'object') continue;
    const from = String(rel.from || '').trim();
    const to = String(rel.to || '').trim();

    if (nodeIds.has(from) && nodeIds.has(to)) {
      validRelationships.push({
        from,
        to,
        label: rel.label ? String(rel.label).trim() : '',
        type: rel.type || 'connects',
      });
    }
  }

  const relationships = removeDuplicateRelationships(validRelationships);

  return {
    title,
    diagramType,
    direction,
    groups,
    nodes,
    relationships,
  };
}

export default validateSemanticDiagram;
