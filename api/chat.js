export default async function handler(req, res) {
    // 1. Sirf POST allow karein
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Sirf POST allowed hai Guru!" });
    }

    const { message } = req.body;
    
    // Key uthayein (Jo bhi naam aapne set kiya ho)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!geminiKey) {
        return res.status(500).json({ reply: "Key nahi mili Guru! Vercel Settings check karo." });
    }

    const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    try {
        // --- CHANGE: URL me 'v1beta' hata kar 'v1' kar diya ---
        // Aur model 'gemini-1.5-flash' use kar rahe hain
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Current Date: ${today}. You are Jeeshu AI, a helpful and funny assistant. Reply in Hinglish. User said: ${message}`
                        }]
                    }]
                }),
            }
        );

        const data = await response.json();

        // Agar ab bhi Google Error de
        if (data.error) {
            console.error("Google Error:", data.error);
            return res.status(500).json({ reply: `Error: ${data.error.message}` });
        }

        // Success!
        const botReply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: botReply });

    } catch (error) {
        return res.status(500).json({ reply: `Server Crash: ${error.message}` });
    }
}
