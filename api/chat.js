export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Error: Only POST allowed" });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are Jeeshu AI, a helpful assistant. Reply in Hinglish. User: ${message}` }]
        }]
      }),
    });

    const data = await response.json();

    // Check agar Gemini ne koi error bheja
    if (data.error) {
      return res.status(500).json({ reply: "Gemini Error: " + data.error.message });
    }

    // Sahi rasta reply nikalne ka
    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      res.status(200).json({ reply: aiReply });
    } else {
      res.status(200).json({ reply: "Jeeshu ko samajh nahi aaya, firse puchiye!" });
    }

  } catch (err) {
    res.status(500).json({ reply: "Server Error: Connection failed guru!" });
  }
}
