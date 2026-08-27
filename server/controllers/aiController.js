import { generateDiagram, generateMermaidCode } from '../services/aiService.js';
import { generateMermaidSvg } from '../services/krokiService.js';
import { extractMermaidCode } from '../utils/extractMermaidCode.js';
import { layoutDiagram } from '../utils/layoutEngine.js';
import {
  validateCreateDiagram,
  validateModifyDiagram,
  applyModifyOperations,
  DiagramValidationError,
} from '../services/diagramValidator.js';

export const generateAIDiagram = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const rawDiagram = await generateDiagram(prompt.trim());
    const validated = validateCreateDiagram(rawDiagram);
    const laidOut = layoutDiagram(validated);

    res.json({ success: true, diagram: laidOut });
  } catch (error) {
    if (error instanceof DiagramValidationError) {
      return res.status(422).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const modifyAIDiagram = async (req, res, next) => {
  try {
    const { prompt, currentDiagram } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    if (!currentDiagram || !Array.isArray(currentDiagram.nodes)) {
      return res.status(400).json({ success: false, message: 'Current diagram state is required' });
    }

    const rawResponse = await generateDiagram(prompt.trim(), currentDiagram);
    const modifyResponse = validateModifyDiagram(rawResponse);
    const updatedDiagram = applyModifyOperations(currentDiagram, modifyResponse);
    const validated = validateCreateDiagram(updatedDiagram);
    const laidOut = layoutDiagram(validated);

    res.json({ success: true, diagram: laidOut });
  } catch (error) {
    if (error instanceof DiagramValidationError) {
      return res.status(422).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const generateDiagramWithKroki = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const rawMermaid = await generateMermaidCode(prompt.trim());
    const mermaidCode = extractMermaidCode(rawMermaid);
    const svg = await generateMermaidSvg(mermaidCode);

    res.json({
      success: true,
      mermaidCode,
      svg,
    });
  } catch (error) {
    const message = error.message || 'Diagram rendering failed. Please try again.';
    res.status(400).json({
      success: false,
      message,
    });
  }
};
