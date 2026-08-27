import { reviewDiagram } from '../services/geminiService.js';

export async function reviewerAgent(prompt, intent, plannedDiagram) {
  return reviewDiagram(prompt, intent, plannedDiagram);
}

export default reviewerAgent;
