import { callGeminiJSON } from './geminiService.js';
import { DIAGRAM_SYSTEM_PROMPT } from '../prompts/diagramSystemPrompt.js';
import { validateDiagram } from '../utils/validateDiagram.js';

export async function generateEditableDiagramService(prompt) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Please describe the diagram you want to create.');
  }

  const parsed = await callGeminiJSON(DIAGRAM_SYSTEM_PROMPT, prompt.trim());
  return validateDiagram(parsed);
}

export default { generateEditableDiagramService };
