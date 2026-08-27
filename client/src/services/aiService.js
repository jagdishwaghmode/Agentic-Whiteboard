import { aiAPI } from './api';

export const generateDiagram = async (prompt) => {
  const response = await aiAPI.generate(prompt);
  return response.data.diagram;
};

export const modifyDiagram = async (prompt, currentDiagram) => {
  const response = await aiAPI.modify(prompt, currentDiagram);
  return response.data.diagram;
};

export const generateDiagramWithKroki = async (prompt) => {
  const response = await aiAPI.generateDiagramWithKroki(prompt);
  return response.data;
};

export default { generateDiagram, modifyDiagram, generateDiagramWithKroki };
