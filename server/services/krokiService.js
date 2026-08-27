import zlib from 'zlib';

/**
 * Generates an SVG vector diagram from Mermaid code using Kroki.io (POST & GET base64url),
 * with local vector SVG fallback if network is offline or Kroki is unreachable.
 */

const createFallbackSvg = (mermaidCode) => {
  const lines = mermaidCode
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('flowchart') && !l.startsWith('graph'));

  const nodes = new Map();
  const connections = [];

  lines.forEach((line) => {
    const parts = line.split(/-->|---|==>|->/);
    if (parts.length >= 2) {
      const leftRaw = parts[0].trim();
      const rightRaw = parts[1].trim();

      const parseNode = (raw) => {
        const match = raw.match(/([a-zA-Z0-9_]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?/);
        if (!match) return { id: raw, label: raw };
        const id = match[1];
        const label = match[2] || match[3] || match[4] || id;
        return { id, label };
      };

      const fromNode = parseNode(leftRaw);
      const toNode = parseNode(rightRaw);

      if (!nodes.has(fromNode.id)) nodes.set(fromNode.id, fromNode.label);
      if (!nodes.has(toNode.id)) nodes.set(toNode.id, toNode.label);

      connections.push({ from: fromNode.id, to: toNode.id });
    }
  });

  const nodeList = Array.from(nodes.entries());
  const boxWidth = 180;
  const boxHeight = 60;
  const spacing = 60;
  const startX = 50;
  const startY = 80;

  const totalWidth = Math.max(800, startX + nodeList.length * (boxWidth + spacing));

  let svgElements = `<rect width="100%" height="100%" fill="#ffffff" rx="8"/>`;

  nodeList.forEach(([id, label], index) => {
    const x = startX + index * (boxWidth + spacing);
    const y = startY;

    svgElements += `
      <g transform="translate(${x}, ${y})">
        <rect width="${boxWidth}" height="${boxHeight}" fill="#e7f5ff" stroke="#1c7ed6" stroke-width="2" rx="8"/>
        <text x="${boxWidth / 2}" y="${boxHeight / 2 + 5}" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#1864ab" text-anchor="middle">${escapeXml(label)}</text>
      </g>
    `;

    if (index < nodeList.length - 1) {
      const arrowStartX = x + boxWidth;
      const arrowStartY = y + boxHeight / 2;
      const arrowEndX = arrowStartX + spacing;
      const arrowEndY = arrowStartY;

      svgElements += `
        <g>
          <line x1="${arrowStartX}" y1="${arrowStartY}" x2="${arrowEndX - 6}" y2="${arrowEndY}" stroke="#495057" stroke-width="2" marker-end="url(#arrow)"/>
        </g>
      `;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 220" width="${totalWidth}" height="220">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#495057"/>
      </marker>
    </defs>
    ${svgElements}
  </svg>`;
};

const escapeXml = (unsafe) => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export async function generateMermaidSvg(mermaidCode) {
  const baseUrl = (process.env.KROKI_BASE_URL || 'https://kroki.io').replace(/\/+$/, '');
  const krokiUrl = `${baseUrl}/mermaid/svg`;

  if (!mermaidCode || typeof mermaidCode !== 'string' || !mermaidCode.trim()) {
    throw new Error('Unable to generate a valid diagram. Please try a different prompt.');
  }

  const cleanCode = mermaidCode.trim();

  // 1. Try POST request (5s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(krokiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Whiteboard/1.0',
      },
      body: cleanCode,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const svg = await response.text();
      if (svg && svg.includes('<svg')) {
        return svg;
      }
    }
  } catch (err) {
    console.warn('Kroki POST attempt skipped/failed, trying GET fallback:', err.message);
  }

  // 2. Try GET request with zlib deflated base64url code (5s timeout)
  try {
    const compressed = zlib.deflateSync(Buffer.from(cleanCode, 'utf-8'));
    const base64Url = compressed
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const getUrl = `${baseUrl}/mermaid/svg/${base64Url}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(getUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Whiteboard/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const svg = await response.text();
      if (svg && svg.includes('<svg')) {
        return svg;
      }
    }
  } catch (err) {
    console.warn('Kroki GET attempt skipped/failed:', err.message);
  }

  // 3. Fallback to vector SVG generator
  return createFallbackSvg(cleanCode);
}

export default { generateMermaidSvg };
