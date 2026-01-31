export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Sirf POST allowed hai Guru!" });
  }

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ reply: "Server Error: API Key missing in Vercel." });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `System: You are Jeeshu AI. User: ${message}` }] }]
      }),
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply.";
    return res.status(200).json({ reply: botReply });

  } catch (error) {
    return res.status(500).json({ reply: `Error: ${error.message}` });
  }
}
