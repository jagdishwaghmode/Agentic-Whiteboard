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
  const { apiKey, model } = getGeminiConfig();
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'system', content: MERMAID_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model,
      temperature: 0.2,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'AI Agentic Whiteboard',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  return text ? text.replace(/```mermaid\s*/gi, '').replace(/```\s*/g, '').trim() : '';
};

export default { generateDiagram, generateMermaidCode };
