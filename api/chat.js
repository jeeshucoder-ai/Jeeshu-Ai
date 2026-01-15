export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;

  try {
    // --- 1. IMAGE GENERATION (Ye waisa hi rahega) ---
    if (type === "image_gen") {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) return res.json({ reply: "Guru, HF Key missing hai!" });

      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );

      if (!response.ok) throw new Error("Image Server Busy");

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ 
        reply: "Ye lijiye Guru, tasveer! 🎨", 
        image: `data:image/jpeg;base64,${base64Image}` 
      });
    }

    // --- 2. SMART CHAT SYSTEM (Auto-Fallback) 🧠 ---
    
    // Keys load karo
    const keys = [
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_API_KEY
    ].filter(k => k);

    if (keys.length === 0) return res.json({ reply: "Guru, API Key nahi mili Vercel me!" });

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    // Helper function jo API call karega
    async function callGemini(modelName) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${randomKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "You are Jeeshu AI. Keep answers short and simple. User: " + message }] }]
          }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message); // Agar error aaye to batao
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    let aiReply = "";

    try {
      // KOSHISH 1: Sabse Naya aur Tez Model (1.5 Flash)
      aiReply = await callGemini("gemini-1.5-flash");
    } catch (error1) {
      console.log("1.5 Flash Failed, trying Pro...", error1.message);
      try {
        // KOSHISH 2: Purana Reliable Model (Gemini Pro)
        // Note: Hum 'v1beta' use kar rahe hain jo Pro ke liye sahi hai
        aiReply = await callGemini("gemini-pro");
      } catch (error2) {
        console.log("Pro Failed too...", error2.message);
        return res.json({ reply: "Guru, Google ke saare models busy hain ya API Key purani ho gayi hai. Nayi Key bana lo!" });
      }
    }
    
    // Agar jawab mil gaya to bhejo
    return res.status(200).json({ reply: aiReply || "Samajh nahi aaya..." });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Server Error aa gaya Guru!" });
  }
}
