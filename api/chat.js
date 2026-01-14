export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;

  // 1. Aapki 3 Keys ka 'Power Pack'
  const apiKeys = [
    process.env.GEMINI_API_KEY, // Purani
    process.env.GEMINI_KEY_2,   // Nayi 1
    process.env.GEMINI_KEY_3    // Nayi 2
  ].filter(k => k); 

  // 2. Random Key Choose Karo
  const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  if (!randomKey) return res.status(500).json({ reply: "Guru, API Keys missing hain!" });

  try {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const tavilyKey = process.env.TAVILY_API_KEY;

    let context = "";
    // Web Search
    if (tavilyKey) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, max_results: 1 })
        });
        const searchData = await searchRes.json();
        if (searchData.results) context = searchData.results[0].content;
      } catch (e) { console.log("Search skipped"); }
    }

    // 3. System Instruction
    const systemInstruction = `
    You are Jeeshu AI, a helpful assistant made by Guru.
    Current Date: ${now}.
    Language: Hinglish (Hindi + English).
    Style: Short, Friendly and Helpful.
    `;
    
    const finalPrompt = context 
      ? `${systemInstruction}\n\nWeb Info: ${context}\n\nUser: ${message}` 
      : `${systemInstruction}\n\nUser: ${message}`;

    // 🚨 FIX: Model Name changed to 'gemini-flash-latest'
    // Ye naam aapki list me maujood tha, isliye ye 100% chalega.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${randomKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
    });

    const data = await response.json();

    if (data.error) {
      // 429 = Too Many Requests (Traffic Jam)
      if (data.error.message.includes("429") || data.error.message.includes("quota")) {
         return res.status(200).json({ reply: "Guru, abhi traffic zyada hai! 🚦 10 second ruk kar try karo." });
      }
      return res.status(200).json({ reply: "Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "Server Error: " + err.message });
  }
}
