export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  try {
    let context = "";
    
    // 1. Web Search (Simple Logic)
    if (tavilyKey) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, max_results: 1 })
        });
        const searchData = await searchRes.json();
        if (searchData.results) context = searchData.results[0].content;
      } catch (e) {} 
    }

    // 2. Gemini ko call karein (Standard Flash Model)
    // Dhyan dein: Kabhi kabhi 'v1beta' ki jagah 'v1' better chalta hai
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: context ? `Context: ${context}\nUser: ${message}` : message }] }]
      }),
    });

    const data = await response.json();

    // 🚨 DOCTOR MODE: Agar Error aaya, toh Models ki List mangwao
    if (data.error) {
      console.log("Error details:", data.error); // Vercel Logs ke liye
      
      // Google se pucho: "Tere paas kya hai?"
      const listReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
      const listData = await listReq.json();
      
      let availableModels = "List nahi mili";
      if (listData.models) {
        // Sirf wahi models dikhao jo Chat kar sakte hain
        availableModels = listData.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map(m => m.name.replace("models/", ""))
          .join(", ");
      }

      return res.status(200).json({ 
        reply: `❌ Model Fail! \n\nGoogle ke paas sirf ye models hain (Inme se koi ek chunenge):\n👇\n${availableModels}` 
      });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu soch raha hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(200).json({ reply: "Server Error: " + err.message });
  }
}
