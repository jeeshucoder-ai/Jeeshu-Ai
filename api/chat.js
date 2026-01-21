export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    if (!geminiKey) {
      return res.status(200).json({ reply: "❌ Error: API Key abhi bhi link nahi hui hai!" });
    }

    // 👇 YAHAN HAI JAADU: Model name change karke 'gemini-2.0-flash' kar diya
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are Jeeshu AI. Reply in Hinglish. User said: ${message}` }] }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      // Agar 2.0 me bhi error aaye, to screen par dikhega
      return res.status(200).json({ reply: `❌ Model Error: ${data.error.message}` });
    }

    if (data.candidates && data.candidates.length > 0) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(200).json({ reply: "❌ Empty Response from Google." });
    }

  } catch (err) {
    return res.status(200).json({ reply: `❌ Server Crash: ${err.message}` });
  }
}
