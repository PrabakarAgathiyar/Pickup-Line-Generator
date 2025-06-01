const fetch = require("node-fetch");

// In-memory IP rate-limit tracker
const rateLimitMap = new Map();

exports.handler = async (event) => {
  // Always allow any origin (for now)
  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: "OK"
    };
  }

  // Verify OPENAI_API_KEY
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: baseHeaders,
      body: JSON.stringify({ error: "OPENAI_API_KEY is not set" })
    };
  }

  // Rate-limit: max 3 pickup lines per IP per day
  const userIP =
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"] ||
    "unknown";
  const usage = rateLimitMap.get(userIP) || { count: 0, lastUsed: Date.now() };
  const today = new Date().toDateString();
  const lastUsedDay = new Date(usage.lastUsed).toDateString();

  if (usage.count >= 3 && today === lastUsedDay) {
    return {
      statusCode: 429,
      headers: baseHeaders,
      body: JSON.stringify({
        error: "⛔ You’ve reached your daily limit of 3 pickup lines. Please come back tomorrow."
      })
    };
  }

  // Parse & validate JSON body
  let context;
  try {
    const body = JSON.parse(event.body || "{}");
    context = (body.context || "").trim();
    if (!context) throw new Error("Context is required.");
  } catch (err) {
    return {
      statusCode: 400,
      headers: baseHeaders,
      body: JSON.stringify({ error: "Invalid request body", details: err.message })
    };
  }

  // Build the ChatGPT prompt
  const prompt = `
You are a witty romance guru. Generate exactly one clever, shareable pickup line tailored to this context:
"${context}"

The pickup line should be:
- Short and sweet
- Memorable / meme-worthy
- Perfect for “I asked AI for a pickup line and it said…” social posts

Return only that single line (no extra commentary).
`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${apiKey}\`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 60,
        temperature: 0.8
      })
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      return {
        statusCode: openaiRes.status,
        headers: baseHeaders,
        body: JSON.stringify({
          error: "OpenAI API error",
          details: errorData.error?.message || "Unknown error"
        })
      };
    }

    const data = await openaiRes.json();
    const pickupLine = data?.choices?.[0]?.message?.content?.trim();
    if (!pickupLine) throw new Error("Unexpected OpenAI response format");

    // Update rate-limit usage
    rateLimitMap.set(userIP, {
      count: today === lastUsedDay ? usage.count + 1 : 1,
      lastUsed: Date.now()
    });

    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ pickupLine })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: baseHeaders,
      body: JSON.stringify({ error: "Failed to generate pickup line", details: err.message })
    };
  }
};
