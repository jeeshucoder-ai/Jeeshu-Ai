export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. Check: Kya Key Vercel tak pahunch rahi hai?
    if (!geminiKey) {
      return res.status(200).json({ reply: "❌ Error: Vercel ko GEMINI_API_KEY nahi mil rahi. Settings > Env Variables check karo." });
    }

    // 2. Direct Call to Google (Debugging Mode)
    // Hum 'gemini-1.5-flash' use karenge kyunki ye sabse reliable hai test ke liye
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `User said: ${message}. Reply in Hinglish shortly.` }] }]
        })
      }
    );

    const data = await response.json();

    // 3. Agar Google ne Error diya, to wo Error screen par dikhao
    if (data.error) {
      return res.status(200).json({ reply: `❌ Google Error: ${data.error.message} (Code: ${data.error.code})` });
    }

    // 4. Success!
    if (data.candidates && data.candidates.length > 0) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(200).json({ reply: "❌ Empty Response: Google ne khali message bheja." });
    }

  } catch (err) {
    return res.status(200).json({ reply: `❌ Server Crash: ${err.message}` });
  }
}
