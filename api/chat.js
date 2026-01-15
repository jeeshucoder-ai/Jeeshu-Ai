export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  
  // Vercel se keys uthao
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  if (!geminiKey) return res.json({ reply: "Guru, GEMINI_API_KEY missing hai!" });

  try {
    // --- 1. IMAGE GENERATION (Hugging Face) ---
    if (type === "image_gen") {
      if (!hfKey) return res.json({ reply: "HF Key missing hai image ke liye!" });
      
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
      return res.status(200).json({ 
        reply: "Ye lijiye Guru, tasveer! 🖼️", 
        image: `data:image/jpeg;base64,${base64Image}` 
      });
    }

    // --- 2. CHAT (STABLE V1 URL) 🧠 ---
    // Hum 'beta' hata kar seedha 'v1' use kar rahe hain
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "You are Jeeshu AI. Keep it short & funny (Hinglish). User: " + message }] }]
        }),
      }
    );

    const data = await response.json();

    // Agar 1.5 Flash fail ho, to purana 'gemini-pro' try karo (Backup)
    if (data.error) {
      console.log("1.5 Flash V1 failed, trying Gemini Pro V1...");
      const retryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "You are Jeeshu AI. Keep it short. User: " + message }] }]
          }),
        }
      );
      const retryData = await retryResponse.json();
      
      if (retryData.error) {
         return res.json({ reply: `Guru, ab bhi error hai: ${retryData.error.message}` });
      }
      
      const retryReply = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.status(200).json({ reply: retryReply });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Main samajh nahi paya...";
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    return res.status(500).json({ reply: "Server Error aa gaya Guru!" });
  }
}
