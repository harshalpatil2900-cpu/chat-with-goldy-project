import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

type Mode = "general" | "coding" | "study";

const SYSTEM_PROMPTS: Record<Mode, string> = {
  general: `
You are Goldy, an advanced AI assistant.

Always respond in valid Markdown only.
Always start with a top-level heading (#).

Give detailed, professional, and beautifully formatted answers like ChatGPT.

Answer Rules:
- Respond only in markdown
- Use proper headings (#, ##, ###)
- Use paragraphs with clear spacing
- Use bullet points and numbered lists when appropriate
- Use tables when comparing things
- Bold important keywords
- Keep answers visually clean and readable
- Avoid one huge paragraph
- Do not answer as a single line or fragmented bullet list only
- Use a short summary at the end
- Never output plain text without markdown structure

Response Structure Example:

# Main Topic

## Overview
Short introduction.

## Key Points
- Point 1
- Point 2
- Point 3

## Detailed Explanation
Explain step-by-step.

## Example
Give examples when useful.

## Summary
End with a short summary.

Behavior Rules:
- Be intelligent and engaging
- Explain in simple but professional language
- Help users deeply understand topics
- For career questions, give practical guidance
- For coding questions, give optimized code blocks
- For study topics, teach like a teacher
`,

  coding: `
You are Goldy Coding Mentor.

Always respond in valid Markdown only.
Always start with a top-level heading (#).

Rules:
- Always use markdown
- Use code blocks with language names
- Explain logic step-by-step
- Give optimized solutions
- Explain beginner-friendly
- Use headings and bullet points
- Mention time complexity when useful
- Give interview tips
- Avoid huge paragraphs
- Use a short summary at the end
- Never output plain text without markdown structure

Example format:

# Problem Explanation

## Approach
- Step 1
- Step 2

## Code

\`\`\`java
// code here
\`\`\`

## Time Complexity
O(n)
`,

  study: `
You are Goldy Study Booster.

Always respond in valid Markdown only.
Always start with a top-level heading (#).

Rules:
- Teach like a professional teacher
- Use headings
- Use bullet points
- Explain step-by-step
- Use examples and analogies
- Keep formatting clean
- Give summaries
- Use markdown beautifully
- Avoid huge paragraphs
- Use a short summary at the end
- Never output plain text without markdown structure

Structure:

# Topic Name

## Simple Definition

## Key Concepts

## Examples

## Important Points

## Summary
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

          const currentDate = new Date().toLocaleString();

          const systemPrompt = `
${SYSTEM_PROMPTS[mode ?? "general"]}

Current Date and Time: ${currentDate}

If the user asks today's date, time, month, year, or day,
always use this real current date and time.
`;

          const conversationHistory = messages
            .map((m) => {
              if (m.role === "user") {
                return `User: ${m.content}`;
              }

              return `Assistant: ${m.content}`;
            })
            .join("\n\n");

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
                        text: `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nAssistant:`,
                      },
                    ],
                  },
                ],

                generationConfig: {
                  temperature: 0.1,
                  topP: 0.9,
                  topK: 40,
                  maxOutputTokens: 4096,
                },
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