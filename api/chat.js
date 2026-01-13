export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "POST request bhejo guru!" });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // Sabse latest aur universal URL 'gemini-1.5-flash-latest'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are Jeeshu AI. User message: ${message}` }] }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      // Agar ye fail hua, toh hum ek backup model try karenge (Gemini Pro)
      const backupResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        }),
      });
      const backupData = await backupResponse.json();
      
      if (backupData.error) {
        return res.status(500).json({ reply: "Gemini Error: " + backupData.error.message });
      }
      return res.status(200).json({ reply: backupData.candidates[0].content.parts[0].text });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Jeeshu abhi busy hai...";
    res.status(200).json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ reply: "Server error: Network ka chakkar hai!" });
  }
}
