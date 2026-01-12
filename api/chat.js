export default async function handler(req, res) {
    // सिर्फ POST रिक्वेस्ट को अनुमति दें
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Error: Only POST requests allowed" });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ reply: "Message तो लिखो भाई! ✍️" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Error: API Key missing in Vercel settings!" });
    }

    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "You are Jeeshu AI, a helpful assistant. Reply in a mix of Hindi and English." },
                    { role: "user", content: message }
                ],
                max_tokens: 500
            } )
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ reply: "API Error: " + (data.error?.message || "Something went wrong") });
        }

        const aiReply = data.choices?.[0]?.message?.content || "Jeeshu अभी सोच रहा है... 🤔";
        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        return res.status(500).json({ reply: "Server Error: Thoda wait karo. 🛠️" });
    }
}
