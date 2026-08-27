import api from './api';

export async function generateProfessionalDiagram(prompt) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Please describe the diagram you want to create.');
  }

  const response = await api.post('/ai/generate-professional-diagram', { prompt });
  return response.data;
}

export default { generateProfessionalDiagram };
