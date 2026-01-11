export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are Jeeshu AI, a friendly Hindi-English assistant." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    console.log("DEEPSEEK RESPONSE:", data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "Jeeshu thoda confuse ho gaya 😅";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ reply: "Server error 😢" });
  }
}
