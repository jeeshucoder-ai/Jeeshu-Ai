export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Only POST allowed" });

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) return res.json({ reply: "Guru, Key missing hai!" });

  try {
    // Google se pucho: "Tumhare paas kaunse models hain?"
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
    const data = await response.json();

    if (data.error) {
      return res.json({ reply: `❌ Error: ${data.error.message}` });
    }

    // List banao
    const models = data.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent")) // Sirf Chat wale models
      .map(m => m.name.replace("models/", "")) // "models/" hata do
      .join("\n");

    return res.json({ reply: `📋 **Available Models List:**\n\n${models}` });

  } catch (err) {
    return res.status(500).json({ reply: "Server Error: " + err.message });
  }
}
