export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { lesson, segment, question } = req.body || {};
  if (!question) return res.status(400).json({ error: "Missing question" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });

  const SYSTEM_PROMPT = `You are Professor Aiden Quest... (PASTE YOUR LATEST QUEST INSTRUCTIONS HERE)
Hard rules: stay in Lesson 1 scope, be concise, no follow-on suggestions, end with: "When you’re ready, say Next to continue the lesson."`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Context: ${lesson} / ${segment}\nStudent question: ${question}` }
  ];

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5", // you can change
      messages,
      temperature: 0.2
    })
  });

  const out = await r.json();
  const answer = out?.choices?.[0]?.message?.content || "";
  return res.status(200).json({ answer });
}
