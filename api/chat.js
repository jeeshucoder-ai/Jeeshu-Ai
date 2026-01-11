export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: "You are Jeeshu AI, a helpful assistant." },
          { role: "user", content: message }
        ]
      })
    });

    const raw = await response.text();

    // 🔥 DEBUG LOG
    console.log("RAW GROK RESPONSE:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({ reply: "Invalid AI response" });
    }

    const reply =
      data?.choices?.[0]?.message?.content ??
      "Grok API connected, but no reply (credit / permission issue)";

    res.status(200).json({ reply });

  } catch (err) {
    res.status(500).json({ reply: "Server error: " + err.message });
  }
}
