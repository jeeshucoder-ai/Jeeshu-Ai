export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Error: Only POST allowed" });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // Naya aur Sahi URL (v1 version ke saath)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message }]
        }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ reply: "Gemini Error: " + data.error.message });
    }

    // Jawab nikalne ka sahi tarika
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu abhi soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ reply: "Server Error: Connection failed!" });
  }
}
