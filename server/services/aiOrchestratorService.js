import { intentAgent } from '../agents/diagramIntentAgent.js';
import { plannerAgent } from '../agents/diagramPlannerAgent.js';
import { reviewerAgent } from '../agents/diagramReviewerAgent.js';
import { validateSemanticDiagram } from '../utils/validateSemanticDiagram.js';

export async function generateProfessionalDiagramPipeline(prompt) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Please describe the diagram you want to create.');
  }

  const cleanPrompt = prompt.trim();

  // 1. Diagram Intent Analysis via Gemini API
  const intent = await intentAgent(cleanPrompt);

  // 2. Diagram Planning via Gemini API
  const rawPlanned = await plannerAgent(cleanPrompt, intent);
  const validatedPlanned = validateSemanticDiagram(rawPlanned);

  // 3. Diagram Review via Gemini API
  let reviewedDiagram;
  try {
    const rawReviewed = await reviewerAgent(cleanPrompt, intent, validatedPlanned);
    reviewedDiagram = validateSemanticDiagram(rawReviewed);
  } catch (err) {
    console.warn('Gemini Reviewer agent skipped or failed, using planned diagram:', err.message);
    reviewedDiagram = validatedPlanned;
  }

  return {
    intent,
    diagram: reviewedDiagram,
  };
}

export default generateProfessionalDiagramPipeline;
