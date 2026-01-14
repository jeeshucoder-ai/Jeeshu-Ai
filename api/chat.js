export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type, fileData } = req.body; // 'type' batayega ki chat karni hai ya image

  try {
    // ---------------------------------------------------------
    // SCENARIO 1: IMAGE GENERATION (Agar user ne image mangi)
    // ---------------------------------------------------------
    if (type === "image_gen") {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) return res.status(500).json({ reply: "Guru, HF Key missing hai!" });

      // Hugging Face API (Stable Diffusion XL - Best Quality)
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );

      if (!response.ok) {
        return res.status(200).json({ reply: "Guru, abhi server busy hai. 1 minute baad try karna! (HF Error)" });
      }

      // Image ka Data (Buffer) lo aur Base64 (Text) me badlo taaki chat me dikhe
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const imgDataUrl = `data:image/jpeg;base64,${base64Image}`;

      return res.status(200).json({ 
        reply: "Ye lijiye Guru, aapki tasveer taiyar hai! 🎨", 
        image: imgDataUrl // Image bhi bhej rahe hain
      });
    }

    // ---------------------------------------------------------
    // SCENARIO 2: NORMAL CHAT (Gemini)
    // ---------------------------------------------------------
    
    // Keys Rotation (Aapki 3 keys)
    const apiKeys = [
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_API_KEY
    ].filter(k => k);
    
    const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    
    // --- (Baaki wahi Gemini wala purana logic) ---
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const systemInstruction = `You are Jeeshu AI. Date: ${now}. Language: Hinglish. Keep it short.`;
    
    // Agar user ne photo upload ki hai (Enhance/Analysis ke liye)
    let geminiContentParts = [{ text: `${systemInstruction}\nUser: ${message}` }];
    
    // Agar photo aayi hai (Base64 format me)
    if (fileData) {
        // Note: Photo analysis ke liye Gemini Pro Vision chahiye hota hai, 
        // par abhi hum Flash use kar rahe hain jo text-only hai mostly.
        // Hum user ko bata denge.
        return res.status(200).json({ reply: "Guru, photo mil gayi! Par abhi main sirf nayi photo BANA sakta hoon, purani dekh nahi sakta. (Vision feature coming soon)" });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${randomKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: geminiContentParts }] }),
    });

    const data = await response.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Soch raha hoon...";
    
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server Error: " + err.message });
  }
}
