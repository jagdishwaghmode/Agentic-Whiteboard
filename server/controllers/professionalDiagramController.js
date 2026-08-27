import { generateProfessionalDiagramPipeline } from '../services/aiOrchestratorService.js';
import { reserveDiagramCredits, refundDiagramCredits } from '../services/creditService.js';

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

    const account = await reserveDiagramCredits(req.user);
    try {
      const { intent, diagram } = await generateProfessionalDiagramPipeline(prompt.trim());
      return res.json({ success: true, intent, diagram, credits: account.credits });
    } catch (generationError) {
      await refundDiagramCredits(req.user, `generation_refund_${Date.now()}`);
      throw generationError;
    }
    // console.log("requested at professional"2)
  }
  catch (error) {
    const message = error.message || 'Unable to generate diagram at this time.';
    res.status(error.statusCode || 500).json({
      success: false,
      message,
    });
  }
};

export default generateProfessionalDiagram;
