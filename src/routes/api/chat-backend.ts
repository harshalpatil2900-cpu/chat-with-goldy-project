import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

type Mode = "general" | "coding" | "study";

const SYSTEM_PROMPTS: Record<Mode, string> = {
  general:
    "You are Goldy, a friendly and smart AI assistant. Give short and helpful answers.",

  coding:
    "You are Goldy Coding Mentor. Explain code simply with examples.",

  study:
    "You are Goldy Study Booster. Teach topics step by step in simple words.",
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

          // ✅ Current Date + Time
          const currentDate = new Date().toLocaleString();

          const systemPrompt = `
${SYSTEM_PROMPTS[mode ?? "general"]}

Current Date and Time: ${currentDate}

If the user asks today's date, time, day, month, or year,
always use this real current date and time.
`;

          const userText = messages
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n");

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
                        text: `${systemPrompt}\n\n${userText}`,
                      },
                    ],
                  },
                ],
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            console.error("Gemini API error:", data);

            return Response.json(
              { error: "Gemini API error" },
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
            { error: "Server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});