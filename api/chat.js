export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY; 

  try {
    let context = "";
    let debugInfo = "Search: Skipped | ";

    // 1. Web Search Check (Tavily)
    if (tavilyKey) {
      try {
        const searchResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, max_results: 2 })
        });
        const searchData = await searchResponse.json();
        if (searchData.results) {
          context = searchData.results.map(r => r.content).join("\n");
          debugInfo = "Search: Success | ";
        }
      } catch (e) {
        debugInfo = "Search: Failed (" + e.message + ") | ";
      }
    }

    // 2. Gemini Call
    const finalPrompt = context 
      ? `Context: ${context}\n\nUser: ${message}\n\nAnswer in Hinglish:`
      : `User: ${message}\n\nAnswer in Hinglish:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
    });

    const data = await response.json();

    // 🚨 DEBUGGING: Agar Google ne error diya, toh wo screen par dikhana zaroori hai
    if (data.error) {
      return res.status(200).json({ reply: "❌ Google Error: " + data.error.message });
    }

    // Agar Jawab khali hai, toh pura data dikhao taaki hum fix kar sakein
    if (!data.candidates || !data.candidates[0].content) {
      return res.status(200).json({ reply: "⚠️ Empty Response! Raw Data: " + JSON.stringify(data) });
    }

    const aiReply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "🔥 Server Error: " + err.message });
  }
}
