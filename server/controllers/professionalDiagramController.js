import { generateProfessionalDiagramPipeline } from '../services/aiOrchestratorService.js';

export const generateProfessionalDiagram = async (req, res, next) => {
  console.log("requested at professional")
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

    const { intent, diagram } = await generateProfessionalDiagramPipeline(prompt.trim());
    // console.log(intent, diagram);
    res.json({
      success: true,
      intent,
      diagram,
    });
    // console.log("requested at professional"2)
  }
  catch (error) {
    const message = error.message || 'Unable to generate diagram at this time.';
    res.status(500).json({
      success: false,
      message,
    });
  }
};

export default generateProfessionalDiagram;
