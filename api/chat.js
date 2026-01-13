export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  try {
    let context = "";
    
    // 1. Web Search (Agar Key hai toh)
    if (tavilyKey) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, max_results: 1 })
        });
        const searchData = await searchRes.json();
        if (searchData.results) {
          context = searchData.results[0].content;
        }
      } catch (e) {
        console.log("Search skipped");
      }
    }

    // 2. Gemini 2.0 Flash Call (Latest & Best)
    const finalPrompt = context 
      ? `Information: ${context}\n\nUser Question: ${message}\n\nAnswer the user in Hinglish using the information above.`
      : `User Question: ${message}\n\nAnswer in Hinglish (mix of Hindi and English).`;

    // 🚨 Yahan humne aapki list se 'gemini-2.0-flash' chuna hai
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      }),
    });

    const data = await response.json();

    // Error checking
    if (data.error) {
      return res.status(200).json({ reply: "❌ Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "Server Error: " + err.message });
  }
}
