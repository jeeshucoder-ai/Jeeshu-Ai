export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Only POST allowed" });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // Sabse stable URL format for 2026
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

    // Agar model nahi mil raha to ye error handle karega
    if (data.error) {
      return res.status(500).json({ reply: "Gemini Error: " + data.error.message });
    }

    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      res.status(200).json({ reply: aiReply });
    } else {
      res.status(200).json({ reply: "Jeeshu abhi reply nahi de pa raha hai." });
    }

  } catch (err) {
    res.status(500).json({ reply: "Server Error: Connection Failed!" });
  }
}
