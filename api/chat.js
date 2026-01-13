export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ reply: "API Key missing in Vercel Settings!" });

  try {
    // Ye combination sabse stable hai aapke liye
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ reply: "Gemini Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu abhi soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ reply: "Server error: Connection fail!" });
  }
}
