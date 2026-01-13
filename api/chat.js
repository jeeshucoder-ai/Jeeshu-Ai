export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  try {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    
    // Web Search Logic
    let context = "";
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

    const systemInstruction = `You are Jeeshu AI. Today's Date: ${now}. Language: Hinglish. Answer short and sweet.`;
    const finalPrompt = context ? `${systemInstruction}\nInfo: ${context}\nUser: ${message}` : `${systemInstruction}\nUser: ${message}`;

    // 🚨 MASTERMIND LOGIC: 3 Models ki list (Priority wise)
    const backupModels = [
      "gemini-2.0-flash-lite-preview-02-05", // Sabse naya aur fast
      "gemini-2.0-flash-lite",               // Standard Lite
      "gemini-flash-latest"                  // Old Reliable
    ];

    let aiReply = null;
    let lastError = "";

    // Loop chalayenge: Ek fail hua toh dusra try karega
    for (const model of backupModels) {
      try {
        console.log("Trying model:", model); // Logs mein dikhega
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
        });

        const data = await response.json();

        // Agar safalta mili
        if (!data.error && data.candidates) {
          aiReply = data.candidates[0].content.parts[0].text;
          break; // Loop roko, kaam ho gaya
        } else {
          lastError = data.error?.message || "Unknown error";
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!aiReply) {
      return res.status(200).json({ reply: "Abhi Google ke saare servers busy hain Guru! 2 minute chai peekar aana. ☕ (Error: " + lastError + ")" });
    }

    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "Server Error: " + err.message });
  }
}
