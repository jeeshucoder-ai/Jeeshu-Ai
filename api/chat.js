export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Error: Only POST allowed" });
    }

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Error: Gemini API Key missing!" });
    }

    try {
        // Gemini API Call
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `You are Jeeshu AI, a helpful assistant. Reply in a mix of Hindi and English. User says: ${message}` }]
                }]
            } )
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ reply: "Gemini Error: " + (data.error?.message || "Something went wrong") });
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu अभी सोच रहा है... 🤔";
        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        return res.status(500).json({ reply: "Server Error: Thoda wait karo. 🛠️" });
    }
}
