export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY; // Web Search Key

  if (!geminiKey) return res.status(500).json({ reply: "Gemini Key Missing!" });

  try {
    let context = "";

    // 1. Agar Tavily Key hai, toh pehle Internet par Search karo
    if (tavilyKey) {
      try {
        const searchResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: message,
            search_depth: "basic",
            max_results: 3
          })
        });
        const searchData = await searchResponse.json();
        
        // Search results ko text mein badlo
        if (searchData.results) {
          context = searchData.results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join("\n\n");
          console.log("Search Found:", context); // Logs mein dikhega
        }
      } catch (e) {
        console.log("Search Error:", e.message);
      }
    }

    // 2. Ab Gemini ko bolo ki Search Data use karke jawab de
    const finalPrompt = context 
      ? `User Question: ${message}\n\nWeb Search Info:\n${context}\n\nAnswer the user using this info in Hinglish.`
      : `User Question: ${message}\n\nAnswer in Hinglish.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      }),
    });

    const data = await response.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu ko jawab nahi mila.";
    
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ reply: "Error: " + err.message });
  }
}
