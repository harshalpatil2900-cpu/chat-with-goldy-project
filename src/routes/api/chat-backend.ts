import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

type Mode = "general" | "coding" | "study";

const MODEL_NAME = "gemini-2.5-flash-lite";

const SYSTEM_PROMPTS: Record<Mode, string> = {
  general: `
You are Goldy, an advanced AI assistant.

Rules:
- Always respond in valid Markdown
- Always start with a heading
- Use headings, bullet points, tables, and bold keywords
- Give clear, structured, ChatGPT-style answers
- Never give one big paragraph
- End with a short summary
`,

  coding: `
You are Goldy Coding Mentor.

Rules:
- Explain code step by step
- Use proper code blocks with language names
- Mention time and space complexity when useful
- Give beginner-friendly explanations
- Use Markdown formatting
`,

  study: `
You are Goldy Study Booster.

Rules:
- Teach in simple words
- Use headings and bullet points
- Give examples and summaries
- Explain step by step
- Use Markdown formatting
`,
};

const ChatSchema = z.object({
  mode: z.enum(["general", "coding", "study"]).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    }),
  ),
});

function needsRealTimeData(text: string): boolean {
  const realTimeKeywords = [
    "price",
    "rate",
    "today",
    "current",
    "now",
    "latest",
    "live",
    "stock",
    "crypto",
    "bitcoin",
    "gold",
    "silver",
    "weather",
    "news",
    "score",
    "match",
    "rupee",
    "dollar",
    "petrol",
    "diesel",
    "nifty",
    "sensex",
  ];

  const lower = text.toLowerCase();
  return realTimeKeywords.some((kw) => lower.includes(kw));
}

async function getRealTimeContext(
  query: string,
  apiKey: string,
): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Give the most current useful context for this user query: "${query}". If exact real-time data is unavailable, clearly say it may vary.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 700,
          },
        }),
      },
    );

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      ""
    );
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/api/chat-backend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const parsed = ChatSchema.safeParse(body);

          if (!parsed.success) {
            return Response.json(
              { error: "Invalid request" },
              { status: 400 },
            );
          }

          const { messages, mode } = parsed.data;

          const apiKey = process.env.GEMINI_API_KEY;

          if (!apiKey) {
            return Response.json(
              { error: "GEMINI_API_KEY not configured" },
              { status: 500 },
            );
          }

          const currentDate = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            dateStyle: "full",
            timeStyle: "short",
          });

          const lastUserMessage =
            messages.filter((m) => m.role === "user").pop()?.content || "";

          let realTimeContext = "";

          if (needsRealTimeData(lastUserMessage)) {
            realTimeContext = await getRealTimeContext(lastUserMessage, apiKey);
          }

          const systemPrompt = `
${SYSTEM_PROMPTS[mode ?? "general"]}

Current Date and Time in India: ${currentDate}

If user asks date/time/day/month/year, use this current date and time.

${
  realTimeContext
    ? `Useful current context:
${realTimeContext}`
    : ""
}
`;

          const conversationHistory = messages
            .map((m) =>
              m.role === "user"
                ? `User: ${m.content}`
                : `Assistant: ${m.content}`,
            )
            .join("\n\n");

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nAssistant:`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.2,
                  topP: 0.9,
                  topK: 40,
                  maxOutputTokens: 2048,
                },
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            console.error("Gemini API error:", data);

            const errorCode = data?.error?.code;

            return Response.json(
              {
                error:
                  errorCode === 429
                    ? "Goldy is taking a short break due to high demand. Please wait 30 seconds and try again! 🙏"
                    : "Goldy is currently working on the backend. Please try again in a moment! ⚙️",
              },
              { status: 500 },
            );
          }

          const aiText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response generated.";

          return Response.json({
            content: aiText,
          });
        } catch (error) {
          console.error(error);

          return Response.json(
            {
              error:
                "Goldy is currently working on the backend. Please try again in a moment! ⚙️",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});