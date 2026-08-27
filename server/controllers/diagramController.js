import { generateEditableDiagramService } from '../services/aiDiagramService.js';
import { DiagramValidationError } from '../utils/validateDiagram.js';

export const generateEditableDiagramController = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please describe the diagram you want to create.',
      });
    }

    if (prompt.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is too long (maximum 1000 characters).',
      });
    }

    const diagram = await generateEditableDiagramService(prompt.trim());

    res.json({
      success: true,
      diagram,
    });
  } catch (error) {
    if (error instanceof DiagramValidationError) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    const message = error.message || 'Unable to generate an editable diagram. Please try again.';
    res.status(500).json({
      success: false,
      message,
    });
  }
};

export default { generateEditableDiagramController };
