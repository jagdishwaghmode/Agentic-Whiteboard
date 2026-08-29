import { callGeminiJSON } from './geminiService.js';
import { getGeminiConfig } from '../config/geminiConfig.js';

const SYSTEM_PROMPT = `You are a diagram generation assistant. You MUST respond with ONLY valid JSON, no markdown or explanation.

For NEW diagrams, respond with:
{
  "action": "create",
  "title": "Diagram Title",
  "nodes": [
    { "id": "unique_id", "type": "rectangle|ellipse|diamond", "label": "Node Label" }
  ],
  "connections": [
    { "from": "source_id", "to": "target_id", "label": "optional label" }
  ]
}

For MODIFYING existing diagrams, respond with:
{
  "action": "modify",
  "operations": [
    { "type": "addNode", "node": { "id": "...", "type": "rectangle", "label": "..." } },
    { "type": "removeNode", "nodeId": "..." },
    { "type": "addConnection", "from": "...", "to": "...", "label": "..." },
    { "type": "removeConnection", "from": "...", "to": "..." }
  ]
}`;

const MERMAID_SYSTEM_PROMPT = `You are a diagram generation engine.
Convert the user's natural language request into valid Mermaid diagram syntax.
Return ONLY Mermaid source code without markdown code fences.`;

export const generateDiagram = async (prompt, context = null) => {
  const userContent = context
    ? `Current diagram:\n${JSON.stringify(context, null, 2)}\n\nUser request: ${prompt}`
    : prompt;

  return callGeminiJSON(SYSTEM_PROMPT, userContent);
};

export const generateMermaidCode = async (prompt) => {
  const { apiKey, model = 'gemini-3.6-flash' } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${MERMAID_SYSTEM_PROMPT}\n\nUser Request: ${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.replace(/```mermaid\s*/gi, '').replace(/```\s*/g, '').trim() : '';
};

export default { generateDiagram, generateMermaidCode };
