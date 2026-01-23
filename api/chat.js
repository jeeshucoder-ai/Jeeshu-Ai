export default async function handler(req, res) {
    // 1. Sirf POST requests allow karein
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Sirf POST allowed hai Guru!" });
    }

    const { message } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY; // Ya GOOGLE_API_KEY agar wo use kiya hai

    if (!geminiKey) {
        return res.status(500).json({ reply: "Guru, Vercel Settings me Key nahi mili!" });
    }

    const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });

    try {
        // --- CHANGE: Using 'gemini-pro' (Most Stable Model) ---
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Current Date: ${today}. You are Jeeshu AI, a funny, desi and helpful assistant. Reply in Hinglish. User said: ${message}`
                        }]
                    }]
                }),
            }
        );

        const data = await response.json();

        // Error Check
        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        // Success
        const botReply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ reply: `Server Crash: ${error.message}` });
    }
}
