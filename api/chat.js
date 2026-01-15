export default async function handler(req, res) {
  // Sirf POST request allow karo
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;

  // 👇 AB YE SECURE HAI: Vercel se Keys uthayega
  const geminiKey = process.env.GEMINI_API_KEY; 
  const hfKey = process.env.HF_API_KEY;

  if (!geminiKey) {
    return res.json({ reply: "Guru, Vercel me GEMINI_API_KEY missing hai!" });
  }

  try {
    // ---------------------------------------------------------
    // SCENARIO 1: IMAGE GENERATION (Hugging Face)
    // ---------------------------------------------------------
    if (type === "image_gen") {
      if (!hfKey) return res.json({ reply: "Guru, HF_API_KEY missing hai!" });

      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );

      if (!response.ok) return res.json({ reply: "Image server busy hai, baad me try karna! 🎨" });

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ 
        reply: "Ye lijiye Guru, tasveer! 🖼️", 
        image: `data:image/jpeg;base64,${base64Image}` 
      });
    }

    // ---------------------------------------------------------
    // SCENARIO 2: CHAT (GEMINI 1.5 FLASH) 🚀
    // ---------------------------------------------------------
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "You are Jeeshu AI. Keep it short, helpful & funny (Hinglish). User: " + message }] }]
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini Error:", data.error);
      return res.json({ reply: "Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Main samajh nahi paya...";
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    return res.status(500).json({ reply: "Server Error aa gaya!" });
  }
}
