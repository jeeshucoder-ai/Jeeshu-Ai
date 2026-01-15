export default async function handler(req, res) {
  // Sirf POST request allow karo
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;
  const hfKey = process.env.HF_API_KEY;

  if (!hfKey) {
    return res.status(500).json({ reply: "Guru, Vercel me HF_API_KEY missing hai!" });
  }

  try {
    // ---------------------------------------------------------
    // SCENARIO 1: IMAGE GENERATION (Via Hugging Face)
    // ---------------------------------------------------------
    if (type === "image_gen") {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );

      if (!response.ok) {
        // Agar HF Image server busy ho
        return res.json({ reply: "Guru, Drawing room busy hai. 10 sec baad try karna! 🎨" });
      }

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ 
        reply: "Ye lijiye Guru, tasveer taiyar hai! 🖼️", 
        image: `data:image/jpeg;base64,${base64Image}` 
      });
    }

    // ---------------------------------------------------------
    // SCENARIO 2: CHAT (Via Hugging Face - Qwen Model) 🧠
    // (Ab Gemini ki zarurat nahi, ye HF se chalega)
    // ---------------------------------------------------------
    
    // Hum 'Qwen/Qwen2.5-72B-Instruct' use karenge jo DeepSeek level ka hai
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${hfKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-72B-Instruct",
          messages: [
            { role: "system", content: "You are Jeeshu AI. Help the user. Keep answers short and friendly (Hinglish)." },
            { role: "user", content: message }
          ],
          max_tokens: 500
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
       // Agar Qwen busy hai, to chota model try karo (Backup)
       console.log("Switching to Backup Model...");
       const backupResponse = await fetch(
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
      const backupData = await backupResponse.json();
      return res.status(200).json({ reply: backupData.choices?.[0]?.message?.content || "Server busy hai Guru!" });
    }

    const aiReply = data.choices?.[0]?.message?.content || "Soch mein pad gaya...";
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Server Error aa gaya Guru!" });
  }
}
