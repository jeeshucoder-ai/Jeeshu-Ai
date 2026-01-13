export default async function handler(req, res) {
  // 1. Sirf POST request allow karein
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Agar API Key nahi mili toh ye error dega
  if (!apiKey) return res.status(500).json({ reply: "API Key Missing in Vercel Settings!" });

  try {
    // 3. Ye URL sabse zaruri hai - Flash Model use kar rahe hain
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      }),
    });

    const data = await response.json();

    // 4. Agar Google ne error bheja
    if (data.error) return res.status(500).json({ reply: "Gemini Error: " + data.error.message });

    // 5. Sahi jawab nikalna
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu abhi soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ reply: "Server Error: Connection Failed!" });
  }
}
