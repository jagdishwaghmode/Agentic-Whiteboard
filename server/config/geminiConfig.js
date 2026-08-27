import 'dotenv/config';

export const getGeminiConfig = () => {
  // Kept under the old export name to avoid changing every agent import.
  // The provider is now OpenRouter with an OpenAI model.
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey || apiKey.includes('your-')) {
    throw new Error('OPENROUTER_API_KEY is not configured in server/.env file.');
  }

  return { apiKey, model };
};

export default getGeminiConfig;
