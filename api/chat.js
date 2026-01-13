export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
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

    // Yahan hum reply ko 'reply' naam ke variable mein pack kar rahe hain
    const cleanReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu soch raha hai...";
    res.status(200).json({ reply: cleanReply });

  } catch (err) {
    res.status(500).json({ reply: "Server error: Connection failed!" });
  }
}
