import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

type Task =
  | "generate"
  | "translate"
  | "tone"
  | "grammar"
  | "summarize"
  | "keywords"
  | "hashtags"
  | "sentiment"
  | "rewrite"
  | "smart_reply";

interface AiInput {
  task: Task;
  text: string;
  targetLanguage?: string;
  tone?: string;
  audience?: string;
}

function systemFor(input: AiInput): string {
  switch (input.task) {
    case "generate":
      return `You are an expert mass-communication copywriter for governments, NGOs and organizations. Given a short brief, write ONE clear, ready-to-broadcast campaign message (max 90 words). Audience: ${input.audience || "general public"}. Tone: ${input.tone || "professional"}. Return only the message, no preface.`;
    case "translate":
      return `Translate the user's message into ${input.targetLanguage || "Hindi"}. Preserve meaning, tone and formatting. Return ONLY the translation.`;
    case "tone":
      return `Rewrite the user's message in a strictly ${input.tone || "formal"} tone. Keep meaning and key facts intact. Return only the rewritten message.`;
    case "grammar":
      return `Correct grammar, spelling and punctuation in the user's text. Do not change meaning. Return only the corrected text.`;
    case "summarize":
      return `Summarize the user's text in 2-3 crisp sentences. Return only the summary.`;
    case "keywords":
      return `Extract 5-10 high-signal keywords from the user's text. Return a JSON array of strings only, no prose.`;
    case "hashtags":
      return `Generate 8 relevant social-media hashtags for the user's text. Return them space-separated, each starting with #. No other text.`;
    case "sentiment":
      return `Analyze sentiment of the user's text. Reply STRICTLY as compact JSON: {"label":"positive|neutral|negative","score":0-1,"emotion":"joy|anger|sadness|fear|surprise|trust|neutral","rationale":"<one sentence>"}.`;
    case "rewrite":
      return `Rewrite the user's message to be clearer, more engaging and more concise while preserving meaning. Return only the rewritten text.`;
    case "smart_reply":
      return `Generate 3 short, distinct reply options to the user's message. Return them as a numbered list 1. 2. 3.`;
  }
}

export const runAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = input as AiInput;
    if (!i || typeof i.text !== "string" || !i.text.trim())
      throw new Error("Text is required");
    if (i.text.length > 6000) throw new Error("Text too long (max 6000 chars)");
    return i;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemFor(data) },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429)
        throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { output: content };
  });
