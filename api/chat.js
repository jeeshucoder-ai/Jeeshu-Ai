export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

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

    // --- 2. CHAT SYSTEM (AUTO-DETECT + BACKUP) 🧠 ---

    // STEP A: Try Gemini Auto-Detect
    if (geminiKey) {
      try {
        // 1. Pehle pucho kaunse models hain (Auto-Scan)
        const listReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        const listData = await listReq.json();

        let targetModel = "models/gemini-1.5-flash"; // Default

        // 2. List me se sabse naya 'generateContent' wala model dhundo
        if (listData.models) {
          const validModel = listData.models.find(m => 
            m.name.includes("gemini") && 
            m.supportedGenerationMethods.includes("generateContent")
          );
          if (validModel) targetModel = validModel.name;
        }

        // 3. Us Model se baat karo
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "You are Jeeshu AI. Keep answers short & funny (Hinglish). User: " + message }] }]
            })
          }
        );
        
        const data = await response.json();
        if (!data.error && data.candidates) {
          return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        }
        console.log("Gemini Failed, switching to Backup...", data.error);
        
      } catch (geminiError) {
        console.log("Gemini Network Error", geminiError);
      }
    }

    // STEP B: FAIL-SAFE BACKUP (Hugging Face - Phi-3) 🛡️
    // Agar Gemini fail hua, to ye chalega. Error nahi dikhega.
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
      const reply = hfData.choices?.[0]?.message?.content || "Server thoda busy hai, par main sun raha hoon!";
      return res.status(200).json({ reply: reply });
    }

    return res.status(200).json({ reply: "Guru, dono keys check karo settings me!" });

  } catch (err) {
    return res.status(500).json({ reply: "Server Error aa gaya Guru!" });
  }
}
