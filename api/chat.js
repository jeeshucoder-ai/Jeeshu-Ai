export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const { message, type } = req.body;

  // 👇 GURU, YAHAN AAPKI KEY HAI. (Agar galti se purani ho, to nayi daal dena)
  const hfKey = "Hf_BFkIFYXNOOngArmfHcZLJHGmPDhUrrvWrm"; 

  try {
    // --- 1. IMAGE GENERATION ---
    if (type === "image_gen") {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: message }),
        }
      );

      if (!response.ok) return res.json({ reply: "Image Server abhi aaram kar raha hai. 1 min baad aana! 😴" });

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return res.status(200).json({ 
        reply: "Ye lijiye Guru, tasveer! 🎨", 
        image: `data:image/jpeg;base64,${base64Image}` 
      });
    }

    // --- 2. CHAT (FAST MODEL: Phi-3 Mini) 🚀 ---
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${hfKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          model: "microsoft/Phi-3-mini-4k-instruct",
          messages: [
            { role: "system", content: "You are Jeeshu AI. Keep answers short, helpful and funny." },
            { role: "user", content: message }
          ],
          max_tokens: 500
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
       console.log("Error:", data.error);
       return res.status(200).json({ reply: "Guru, abhi dimag thoda thanda hai (Loading...). Dobara pucho!" });
    }

    const aiReply = data.choices?.[0]?.message?.content || "Hmph, kuch samajh nahi aaya.";
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    return res.status(500).json({ reply: "Server Crash! 🔴" });
  }
}
