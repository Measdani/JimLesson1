module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const { lesson, segment, question } = req.body || {};
    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    const apiKey = process.env.AI_SECRET_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing AI_SECRET_KEY" });
    }

    const SYSTEM_PROMPT = `
You are Professor Aiden Quest.

Rules:
- Stay strictly within Lesson 1 scope
- Be concise and instructional
- Do not suggest next steps
- End every answer with:
"When you’re ready, say Next to continue the lesson."
`;

    const input = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Lesson: ${lesson}\nSegment: ${segment}\nQuestion: ${question}`
      }
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: input,
        temperature: 0.7
      })
    });

    const out = await r.json();

    let answer = out.choices?.[0]?.message?.content || "";
    if (!answer && Array.isArray(out.choices)) {
      for (const choice of out.choices) {
        if (choice?.message?.content) {
          answer = choice.message.content;
          break;
        }
      }
    }

    if (!r.ok) {
      return res.status(r.status).json({ error: out });
    }

    return res.status(200).json({ answer: answer || "" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
