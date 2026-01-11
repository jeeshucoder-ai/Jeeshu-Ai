export default async function handler(req, res) {
  // Sirf POST requests allow karo
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Sirf POST method chalta hai" });
  }

  try {
    const { message } = req.body;

    // Check message
    if (!message) {
      return res.status(400).json({ reply: "Message to likho bhai! 📝" });
    }

    // API key environment variable se
    const apiKey = process.env.DEEPSEEK_API_KEY;

    console.log("API Key present:", !!apiKey);
    console.log("User message:", message);

    // DeepSeek API call
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are Jeeshu AI, a friendly Hindi-English assistant." },
          { role: "user", content: message }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    console.log("DeepSeek Response:", data);

    // Agar API error
    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(500).json({ 
        reply: `API Error: ${data.error?.message || "Kuch to gadbad hai"}` 
      });
    }

    // Reply nikalo
    const reply = data?.choices?.[0]?.message?.content || "Jeeshu soch raha hai... 🤔";

    // Success reply
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ reply: "Server error! Thoda wait karo. 😅" });
  }
}
