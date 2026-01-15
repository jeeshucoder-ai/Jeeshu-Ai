export default async function handler(req, res) {
  // Sirf POST request allow karo
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  
  // Vercel se keys uthao
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  // Aaj ki Taareekh (India Time)
  const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });
  const systemPrompt = `Current Date: ${today}. You are Jeeshu AI. Keep it funny, short & helpful (Hinglish).`;

  try {
    // --- 1. IMAGE GENERATION ---
    if (type === "image_gen") {
      if (!hfKey) return res.json({ reply: "HF Key missing hai settings me!" });
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );
      
      if (!response.ok) return res.json({ reply: "Image server busy hai. Baad me try karna! 🎨" });
      
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ reply: "Ye lijiye tasveer! 🖼️", image: `data:image/jpeg;base64,${base64Image}` });
    }

    // --- 2. CHAT (GEMINI FLASH - NO FILTERS) 🚀 ---
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt} User: ${message}` }] }],
              // 👇 SAARI ROK-TOK HATANE KA JADOO (Safety Filters: OFF)
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            })
          }
        );

        const data = await response.json();

        // Agar kisi wajah se error aaye, to wo error user ko dikhao (Debugging ke liye)
        if (data.error) {
             throw new Error(data.error.message);
        }

        // Agar Safety ne fir bhi roka (Rare case)
        if (data.promptFeedback && data.promptFeedback.blockReason) {
             return res.json({ reply: `Guru, Gemini ne baat rok di! Reason: ${data.promptFeedback.blockReason}` });
        }

        if (data.candidates && data.candidates[0].content) {
          return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        }
      } catch (e) {
        console.error("Gemini Error:", e.message);
        // Agar Gemini fail hua to neeche backup par jayega...
      }
    }

    // --- 3. BACKUP (Hugging Face) ---
    if (hfKey) {
       const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct/v1/chat/completions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "microsoft/Phi-3-mini-4k-instruct",
            messages: [{ role: "user", content: message }],
            max_tokens: 500
          }),
        }
      );
      const hfData = await hfResponse.json();
      const reply = hfData.choices?.[0]?.message?.content || "Backup Server bhi busy hai Guru!";
      return res.status(200).json({ reply: reply });
    }

    // Agar dono fail huye
    return res.json({ reply: "Guru, Technical Error! Gemini aur Backup dono fail ho gaye." });

  } catch (err) {
    return res.status(500).json({ reply: "Server Crash: " + err.message });
  }
}
