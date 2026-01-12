export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Error: Only POST allowed" });
  }

  const { message } = req.body; // Frontend se 'message' naam ka data aana chahiye
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ reply: "Error: Gemini API Key missing in Vercel Settings!" });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `User: ${message}. (You are Jeeshu AI, reply in Hinglish)` }] 
        }]
      }),
    });

    const data = await response.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu abhi so raha hai... 😴";
    
    res.status(200).json({ reply: aiReply });
  } catch (err) {
    res.status(500).json({ reply: "Server Error: Connection failed" });
  }
}
