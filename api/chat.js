export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  
  // Vercel se keys uthao
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  if (!geminiKey) return res.json({ reply: "Guru, GEMINI_API_KEY missing hai settings me!" });

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

    // --- 2. SMART CHAT (AUTO-RETRY SYSTEM) 🧠 ---
    
    // Ye list hai models ki. Ek fail hoga to agla try karega.
    const modelsToTry = [
      "gemini-1.5-flash",       // Sabse Naya
      "gemini-1.5-flash-latest", // Alternate Name
      "gemini-pro",             // Old Faithful (Ye kabhi fail nahi hota)
      "gemini-1.0-pro"          // Backup
    ];

    let aiReply = "";
    let lastError = "";

    // Loop chalayenge: Ek-ek karke model try karo
    for (const modelName of modelsToTry) {
      console.log(`Trying model: ${modelName}...`);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "You are Jeeshu AI. Keep it short & funny (Hinglish). User: " + message }] }]
            }),
          }
        );

        const data = await response.json();

        // Agar is model me error aaya, to agle model par jao (continue)
        if (data.error) {
          console.log(`Model ${modelName} failed:`, data.error.message);
          lastError = data.error.message;
          continue; 
        }

        // Agar sahi jawab mila, to loop roko aur jawab le lo
        if (data.candidates && data.candidates[0].content) {
          aiReply = data.candidates[0].content.parts[0].text;
          break; // Success! Loop khatam.
        }
      } catch (err) {
        console.log(`Network Error on ${modelName}`);
      }
    }

    // Agar saare models fail ho gaye tab error dikhao
    if (!aiReply) {
      return res.json({ reply: `Guru, Google ke saare models naaraaz hain. Last Error: ${lastError}` });
    }

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    return res.status(500).json({ reply: "Server Error aa gaya Guru!" });
  }
}
