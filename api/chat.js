export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  // Aaj ki Taareekh (India Time)
  const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });

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
      
      if (!response.ok) return res.json({ reply: "Image server busy hai. Baad me try karna! 🎨" });
      
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ reply: "Ye lijiye tasveer! 🖼️", image: `data:image/jpeg;base64,${base64Image}` });
    }

    // --- 2. CHAT (GEMINI 2.5 FLASH - BETA VERSION) 🚀 ---
    if (geminiKey) {
      try {
        // 👇 Note: Hum 'v1beta' use kar rahe hain kyunki 2.5 abhi naya hai
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Current Date: ${today}. You are Jeeshu AI. Keep it short & funny (Hinglish). User: ${message}` }] }],
              // Safety Filters OFF (Taaki wo kisi topic par atke nahi)
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

        // Error Checking
        if (data.error) {
           console.log("Gemini 2.5 Error:", data.error.message);
           throw new Error(data.error.message);
        }

        if (data.candidates && data.candidates[0].content) {
          return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        }
      } catch (geminiError) {
        // Agar 2.5 Beta fail ho, toh wapas Backup par
        console.log("Switching to Backup...");
      }
    }

    // --- 3. BACKUP (Hugging Face - Phi-3) ---
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
      const reply = hfData.choices?.[0]?.message?.content || "Server thoda busy hai!";
      return res.status(200).json({ reply: reply });
    }

    return res.json({ reply: "Guru, Technical Error! Keys check kar lo." });

  } catch (err) {
    return res.status(500).json({ reply: "Server Crash: " + err.message });
  }
}
