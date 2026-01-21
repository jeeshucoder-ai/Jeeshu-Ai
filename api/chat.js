export default async function handler(req, res) {
  // 1. Method Check (Sirf POST allow karega)
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  
  // Keys uthao environment variables se
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  // Aaj ki Taareekh (India Time)
  const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });

  try {
    // ============================================================
    // PART 1: IMAGE GENERATION (Agar user ne photo mangi)
    // ============================================================
    if (type === "image_gen") {
      if (!hfKey) return res.json({ reply: "HF Key missing hai! Settings check karo." });
      
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

    // ============================================================
    // PART 2: MAIN CHAT (GEMINI 1.5 FLASH) - Most Stable
    // ============================================================
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ 
                  text: `Current Date: ${today}. You are Jeeshu AI, a funny and helpful assistant. Reply in Hinglish (Hindi+English mix). Keep answers short. User said: ${message}` 
                }] 
              }],
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

        // Error Handling: Agar Google ne koi error diya to print karo
        if (data.error) {
           console.log("Gemini Error:", data.error.message);
           // Agar error aaye to hum neeche Backup (Part 3) par jayenge
           throw new Error(data.error.message);
        }

        // Success: Agar jawab aaya to user ko bhej do
        if (data.candidates && data.candidates[0].content) {
          return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        }

      } catch (geminiError) {
        console.log("Gemini failed, switching to Backup...", geminiError.message);
        // Yahan se code seedha Part 3 (Backup) par jayega
      }
    }

    // ============================================================
    // PART 3: BACKUP PLAN (Hugging Face - Phi-3)
    // ============================================================
    // Ye tab chalega agar Gemini fail ho jaye ya Quota khatam ho jaye
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
      const reply = hfData.choices?.[0]?.message?.content || "Server thoda busy hai, baad me aana!";
      return res.status(200).json({ reply: reply });
    }

    // Agar dono keys nahi mili
    return res.json({ reply: "Guru, API Keys set nahi hain. Vercel Settings check karo." });

  } catch (err) {
    return res.status(500).json({ reply: "Server Crash: " + err.message });
  }
}
