export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  // 👇 AAJ KI TAAREEKH AUR TIME NIKALO (India Time)
  const today = new Date().toLocaleString("en-IN", { 
    timeZone: "Asia/Kolkata", 
    dateStyle: "full", 
    timeStyle: "short" 
  });

  try {
    // --- 1. IMAGE GENERATION (Hugging Face) ---
    if (type === "image_gen") {
      if (!hfKey) return res.json({ reply: "HF Key missing hai!" });
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );
      if (!response.ok) return res.json({ reply: "Drawing room busy hai. Baad me aana! 🎨" });
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ reply: "Ye lijiye tasveer! 🖼️", image: `data:image/jpeg;base64,${base64Image}` });
    }

    // --- 2. CHAT SYSTEM (WITH DATE & TIME) 📅 ---

    // Jeeshu ke liye System Prompt (Isme Date jod di hai)
    const systemPrompt = `Current Date & Time in India is: ${today}. You are Jeeshu AI. Keep answers short, helpful & funny (Hinglish).`;

    // STEP A: Try Gemini Auto-Detect
    if (geminiKey) {
      try {
        // Auto-Scan Models
        const listReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        const listData = await listReq.json();
        let targetModel = "models/gemini-1.5-flash"; 
        if (listData.models) {
          const validModel = listData.models.find(m => m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent"));
          if (validModel) targetModel = validModel.name;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt} User says: ${message}` }] }]
            })
          }
        );
        
        const data = await response.json();
        if (!data.error && data.candidates) {
          return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        }
      } catch (e) { console.log("Gemini Error"); }
    }

    // STEP B: FAIL-SAFE BACKUP (Hugging Face) 🛡️
    if (hfKey) {
       const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct/v1/chat/completions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "microsoft/Phi-3-mini-4k-instruct",
            messages: [
                { role: "system", content: systemPrompt }, // Yahan bhi date bhej di
                { role: "user", content: message }
            ],
            max_tokens: 500
          }),
        }
      );
      const hfData = await hfResponse.json();
      const reply = hfData.choices?.[0]?.message?.content || "Server busy hai!";
      return res.status(200).json({ reply: reply });
    }

    return res.status(200).json({ reply: "Keys check karo Guru!" });

  } catch (err) {
    return res.status(500).json({ reply: "Server Error!" });
  }
}
