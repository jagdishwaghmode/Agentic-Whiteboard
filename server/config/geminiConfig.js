import 'dotenv/config';

export const getGeminiConfig = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey || apiKey.includes('your_') || apiKey.includes('your-')) {
    throw new Error('GEMINI_API_KEY is not configured in server/.env file.');
  }

  return { apiKey, model };
};

export default getGeminiConfig;
