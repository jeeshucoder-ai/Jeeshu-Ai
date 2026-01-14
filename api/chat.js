export default async function handler(req, res) {
  // Sirf POST request allow karo
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;

  try {
    // --- 1. IMAGE GENERATION (Hugging Face) ---
    if (type === "image_gen") {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) return res.json({ reply: "Guru, HF_API_KEY missing hai Vercel me!" });

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
        reply: "Ye lijiye Guru, tasveer taiyar hai! 🎨", 
        image: `data:image/jpeg;base64,${base64Image}` 
      });
    }

    // --- 2. NORMAL CHAT (Gemini 1.5 Flash - Stable) ---
    // Keys load karo
    const keys = [
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_API_KEY
    ].filter(k => k); // Jo khali hain unhe hatao

    if (keys.length === 0) return res.json({ reply: "Guru, Vercel me API Key dalna bhul gaye aap! 🔑" });

    // Random Key pick karo (Rotation)
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${randomKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "You are Jeeshu AI, a helpful assistant. Keep answers short.\n\nUser: " + message }] }]
        }),
      }
    );

    const data = await response.json();

    // Agar error aaya to wo dikhao
    if (data.error) {
      console.error("Gemini Error:", data.error);
      return res.json({ reply: `Error aa gaya Guru: ${data.error.message}` });
    }

    // Sahi jawab nikalo
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Main samajh nahi paya, dubara bolo?";
    
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Server Crash ho gaya Guru! 🔴 Log check karo." });
  }
}
