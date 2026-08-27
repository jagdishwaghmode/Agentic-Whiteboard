import { analyzeDiagramIntent } from '../services/geminiService.js';

export async function intentAgent(prompt) {
  return analyzeDiagramIntent(prompt);
}

export default intentAgent;
