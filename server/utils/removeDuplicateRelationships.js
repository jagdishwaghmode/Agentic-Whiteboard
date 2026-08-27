export function removeDuplicateRelationships(relationships) {
  if (!Array.isArray(relationships)) return [];

  const seen = new Set();
  const unique = [];

  for (const rel of relationships) {
    if (!rel || !rel.from || !rel.to) continue;
    if (rel.from === rel.to) continue;

    const key = `${rel.from}-->${rel.to}:${rel.label || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rel);
    }
  }

  return unique;
}

export default removeDuplicateRelationships;
