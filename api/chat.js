export default async function handler(req, res) {
    // 1. Sirf POST allow karein
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Sirf POST allowed hai Guru!" });
    }

    const { message } = req.body;
    
    // Vercel se GROQ Key uthayein
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
        return res.status(500).json({ reply: "Guru, Vercel me GROQ_API_KEY set nahi hai!" });
    }

    const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    try {
        // --- GROQ API CALL (Llama 3 Model) ---
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // Model: Llama 3 (Super Fast & Smart)
                model: "llama3-8b-8192", 
                messages: [
                    { 
                        role: "system", 
                        content: `Current Date: ${today}. You are Jeeshu AI, a funny, desi, and helpful assistant. You reply in Hinglish (Hindi + English mix). Be short and witty.` 
                    },
                    { 
                        role: "user", 
                        content: message 
                    }
                ]
            })
        });

        const data = await response.json();

        // Error Check
        if (data.error) {
            console.error("Groq Error:", data.error);
            return res.status(500).json({ reply: `Groq Error: ${data.error.message}` });
        }

        // Success!
        const botReply = data.choices[0].message.content;
        return res.status(200).json({ reply: botReply });

    } catch (error) {
        return res.status(500).json({ reply: `Server Crash: ${error.message}` });
    }
}
