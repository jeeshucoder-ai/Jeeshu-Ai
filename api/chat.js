export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  try {
    // 1. Aaj ki Sahi Date aur Time nikalo
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    let context = "";
    // Web Search Logic (Same as before)
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

    // 2. Jeeshu ka "System Prompt" (Dimag) set karo
    const systemInstruction = `
    You are 'Jeeshu AI', a helpful and friendly assistant made by a developer named Guru.
    Current Date & Time in India: ${now}.
    Language: Mix of Hindi and English (Hinglish).
    Tone: Friendly, short, and accurate.
    Note: Never say you are an AI Assistant, always say you are Jeeshu AI.
    `;

    const finalPrompt = context 
      ? `${systemInstruction}\n\nInformation from Web: ${context}\n\nUser Question: ${message}`
      : `${systemInstruction}\n\nUser Question: ${message}`;

    // 3. Call Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      }),
    });

    const data = await response.json();

    if (data.error) return res.status(200).json({ reply: "❌ Error: " + data.error.message });

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "Server Error: " + err.message });
  }
}
