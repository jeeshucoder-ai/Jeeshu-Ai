export default async function handler(req, res) {
  // Sirf POST request allow karo
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;

  try {
    // --- 1. IMAGE GENERATION (Hugging Face) ---
    // (Ye waisa hi rahega jaisa tha)
    if (type === "image_gen") {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) return res.json({ reply: "HF Key missing hai!" });

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

    // --- 2. NORMAL CHAT (BACK TO GEMINI PRO) ✅ ---
    const keys = [
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_API_KEY
    ].filter(k => k);

    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    // 👇 YAHAN CHANGE KIYA HAI: 'gemini-1.5-flash' hatakar 'gemini-pro' laga diya
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${randomKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "You are Jeeshu AI. Keep it short. User: " + message }] }]
        }),
      }
    );

    const data = await response.json();

    // Agar error aaye to check karo
    if (data.error) {
      console.error("Gemini Error:", data.error);
      return res.json({ reply: "Guru, API Key me kuch dikkat hai. Error: " + data.error.message });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Main samajh nahi paya...";
    
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Server Error aa gaya Guru!" });
  }
}
