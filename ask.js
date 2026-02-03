module.exports = async (req, res) => {
  try {
    // Ensure the request method is POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    // Extract the necessary fields from the request body
    const { lesson, segment, question } = req.body || {};
    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    // Check if the OPENAI_API_KEY is available in the environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });
    }

    // Define a system prompt to instruct the AI
    const SYSTEM_PROMPT = `
    You are Professor Aiden Quest.

    Rules:
    - Stay strictly within Lesson 1 scope.
    - Be concise and instructional.
    - Do not suggest next steps.
    - End every answer with:
    "When you’re ready, say Next to continue the lesson."
    `;

    // Format the user input for the model
    const input = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Lesson: ${lesson}\nSegment: ${segment}\nQuestion: ${question}`
      }
    ];

    // Make the request to OpenAI's completions API
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",  // Replace with the appropriate model
        messages: input,         // Correct parameter is "messages"
        temperature: 0.7
      })
    });

    // Parse the response
    const output = await response.json();

    // Extract the answer from the response
    let answer = output.choices?.[0]?.message?.content || "";

    // If no answer, check if the response structure is different
    if (!answer && Array.isArray(output.choices)) {
      for (const msg of output.choices) {
        if (msg?.message?.content) {
          answer = msg.message.content;
          break;
        }
      }
    }

    // Handle non-OK response
    if (!response.ok) {
      return res.status(response.status).json({ error: output });
    }

    // Send the answer back to the frontend
    return res.status(200).json({ answer: answer || "" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "An error occurred" });
  }
};
