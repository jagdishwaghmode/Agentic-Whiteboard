/**
 * Extracts clean Mermaid source code from AI responses.
 * Removes markdown wrappers like ```mermaid and ``` fences.
 */

export function extractMermaidCode(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Unable to generate a valid diagram. Please try a different prompt.');
  }

  let cleaned = rawText.trim();

  // Remove ```mermaid ... ``` code blocks
  cleaned = cleaned.replace(/^```mermaid\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/```\s*$/, '');
  cleaned = cleaned.trim();

  // If there's still a ``` inside, strip around it
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  if (!cleaned) {
    throw new Error('Unable to generate a valid diagram. Please try a different prompt.');
  }

  return cleaned;
}

export default { extractMermaidCode };
