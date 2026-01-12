export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Error: Only POST allowed" });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ reply: "Error: API Key missing!" });
  }

  try {
    // Yahan maine version 'v1' aur model 'gemini-pro' kar diya hai
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are Jeeshu AI, a helpful assistant. Reply in Hinglish. User message: ${message}` }]
        }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ reply: "Gemini Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu abhi soch raha hai... 🤔";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ reply: "Server Error: Connection failed!" });
  }
}
