export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) return res.json({ reply: "Guru, Vercel me GEMINI_API_KEY missing hai!" });

  try {
    // Hum seedha Google se baat karenge aur jo error aayega wo dikhayenge
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "You are Jeeshu AI. User: " + message }] }]
        })
      }
    );

    const data = await response.json();

    // 🛑 AGAR ERROR AAYA TO WO DIKHAO (Chupao mat)
    if (data.error) {
      return res.json({ reply: `⚠️ **Google Error:** ${data.error.message}` });
    }

    // Agar sab sahi raha
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Empty response from Google.";
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    return res.status(500).json({ reply: `🔴 **Server Crash:** ${err.message}` });
  }
}
