const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;  // Environment variable से API key लें
  const BASE_URL = 'https://api.generativelanguage.googleapis.com/v1beta1';

  try {
    // पहले models list करें (optional, लेकिन recommended)
    const modelsResponse = await axios.get(`${BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    console.log('Available Models:', modelsResponse.data);

    // अब content generate करें (example model: text-bison-001, आप list से change करें)
    const modelName = 'models/text-bison-001';  // Valid model name use करें
    const prompt = req.body.prompt || 'Hello, tell me about AI.';  // Request से prompt लें

    const generateResponse = await axios.post(
      `${BASE_URL}/models/${modelName}:generateContent`,
      { prompt: { text: prompt } },
      { headers: { 'Authorization': `Bearer ${API_KEY}` } }
    );

    res.status(200).json({ response: generateResponse.data });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'API call failed' });
  }
}
