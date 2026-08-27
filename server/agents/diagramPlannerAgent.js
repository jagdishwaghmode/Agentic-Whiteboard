import { planDiagram } from '../services/geminiService.js';

export async function plannerAgent(prompt, intent) {
  return planDiagram(prompt, intent);
}

export default plannerAgent;
