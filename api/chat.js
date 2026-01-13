export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  try {
    // 1. Current Date/Time
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    let context = "";
    // Web Search Logic
    if (tavilyKey) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, max_results: 1 })
        });
        const searchData = await searchRes.json();
        if (searchData.results) context = searchData.results[0].content;
      } catch (e) { console.log("Search skipped"); }
    }

    // 2. System Instruction (Identity & Date)
    const systemInstruction = `
    System Settings:
    - You are "Jeeshu AI", created by Guru.
    - Today's Date: ${now}.
    - Language: Hinglish (Hindi + English).
    - Tone: Friendly and Helpful.
    `;

    const finalPrompt = context 
      ? `${systemInstruction}\n\nWeb Info: ${context}\n\nUser: ${message}`
      : `${systemInstruction}\n\nUser: ${message}`;

    // 3. 🚨 MAGIC FIX: Using 'gemini-2.0-flash-lite'
    // Ye model 'Lite' hai isliye is par traffic kam hota hai aur ye error nahi dega.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      }),
    });

    const data = await response.json();

    // 4. Agar fir bhi "Overloaded" aaye, toh user ko batao
    if (data.error) {
      // 429 Error matlab Limit Cross ho gayi
      if (data.error.code === 429) {
        return res.status(200).json({ reply: "Guru, thoda ruk kar try karo (1 minute), Google server busy hai! 🚦" });
      }
      return res.status(200).json({ reply: "Google Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "Server Error: " + err.message });
  }
}
