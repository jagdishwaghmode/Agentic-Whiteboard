import api from './api';

export async function generateEditableDiagram(prompt) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Please describe the diagram you want to create.');
  }

  const response = await api.post('/ai/generate-editable-diagram', { prompt });
  return response.data.diagram;
}

export default { generateEditableDiagram };
