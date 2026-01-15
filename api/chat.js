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
      if (!response.ok) return res.json({ reply: "Image server busy hai. Baad me try karna! 🎨" });
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ reply: "Ye lijiye tasveer! 🖼️", image: `data:image/jpeg;base64,${base64Image}` });
    }

    // --- 2. SMART CHAT (AUTO-DETECT MODEL) 🧠 ---
    if (geminiKey) {
      try {
        // STEP A: Google se pucho kaunse Models available hain
        const listReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        const listData = await listReq.json();

        let bestModel = "models/gemini-1.5-flash"; // Default (Agar list fail ho)

        // List me se wo model dhundo jo 'generateContent' support karta ho
        if (listData.models) {
          // Hum prefer karenge Flash ya Pro
          const validModel = listData.models.find(m => 
            (m.name.includes("gemini-1.5-flash") || m.name.includes("gemini-pro")) && 
            m.supportedGenerationMethods.includes("generateContent")
          );
          if (validModel) {
             bestModel = validModel.name; // E.g., 'models/gemini-1.5-flash-001'
             console.log("Selected Model:", bestModel);
          }
        }

        // STEP B: Us Selected Model se baat karo (Safety Filters OFF)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "You are Jeeshu AI. Keep it short & funny (Hinglish). User: " + message }] }],
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

        if (data.error) throw new Error(data.error.message);
        
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply });

      } catch (geminiError) {
        // Agar Google fail hua to neeche Backup chalega
        console.log("Gemini Failed:", geminiError.message);
      }
    }

    // --- 3. BACKUP (Hugging Face - Jab Google Fail Ho) ---
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
      const reply = hfData.choices?.[0]?.message?.content || "Guru, abhi server thoda busy hai!";
      return res.status(200).json({ reply: reply });
    }

    return res.json({ reply: "Guru, Technical Error! Sab kuch try kar liya." });

  } catch (err) {
    return res.status(500).json({ reply: "Server Crash: " + err.message });
  }
}
