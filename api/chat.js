export default async function handler(req, res) {
  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // Space wala variable delete karke naya bina space wala banayein
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
  });
  const data = await response.json();
  res.status(200).json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "Error!" });
}
