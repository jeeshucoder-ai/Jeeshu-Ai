export default async function handler(req, res) {
    // 1. Sirf POST requests allow karein
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Sirf POST allowed hai Guru!" });
    }

    // 2. User ka message nikalein
    const { message } = req.body;

    // 3. Vercel se Key uthayein
    const geminiKey = process.env.GEMINI_API_KEY;

    // Check karein ki Key mili ya nahi
    if (!geminiKey) {
        return res.status(500).json({ reply: "Guru, Vercel Settings me GEMINI_API_KEY nahi mili!" });
    }

    // 4. Aaj ki Tareekh (Date Context)
    const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });

    try {
        // --- GOOGLE GEMINI CALL START ---
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            // Jeeshu ki Personality aur User ka Message
                            text: `Current Date: ${today}. You are Jeeshu AI, a funny, desi and helpful assistant. Reply in Hinglish (Hindi + English mix). User said: ${message}`
                        }]
                    }]
                }),
            }
        );

        const data = await response.json();

        // Agar Google ne koi Error bheja hai (Jaise Key invalid)
        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        // --- SUCCESS ---
        // Jawab nikalein aur bhej dein
        const botReply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: botReply });

    } catch (error) {
        // Agar Server crash hua
        console.error("Server Error:", error);
        return res.status(500).json({ reply: `Server Crash: ${error.message}` });
    }
}
