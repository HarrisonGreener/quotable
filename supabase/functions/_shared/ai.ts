// ═══════════════════════════════════════════════════════════════════
// AI PROVIDER — your own keys, no Lovable gateway
//
// Tries each provider in order and falls through on rate limits, outages
// or bad responses. Both Gemini and Groq speak the OpenAI chat format, so
// callers get the same { choices: [{ message: { content } }] } shape back.
//
// Secrets (set with `supabase secrets set ...`):
//   GEMINI_API_KEY   – required (free key from https://aistudio.google.com)
//   GROQ_API_KEY     – optional backup (free key from https://console.groq.com)
//   GEMINI_MODEL     – optional, default "gemini-3.5-flash"
//   GEMINI_FALLBACK_MODEL – optional, default "gemini-2.5-flash"
//   GROQ_MODEL       – optional, default "openai/gpt-oss-120b"
// ═══════════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  json?: boolean;        // ask for a JSON object back
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ChatResult {
  content: string;
  provider: string;
  model: string;
}

export class AIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface Provider {
  name: string;
  url: string;
  key: string;
  model: string;
}

const providers = (): Provider[] => {
  const list: Provider[] = [];
  const gemini = Deno.env.get("GEMINI_API_KEY");
  const groq = Deno.env.get("GROQ_API_KEY");

  if (gemini) {
    const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    list.push({ name: "gemini", url, key: gemini, model: Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash" });
    const fallback = Deno.env.get("GEMINI_FALLBACK_MODEL") ?? "gemini-2.5-flash";
    if (fallback) list.push({ name: "gemini", url, key: gemini, model: fallback });
  }
  if (groq) {
    list.push({
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groq,
      model: Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b",
    });
  }
  return list;
};

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const list = providers();
  if (list.length === 0) {
    throw new AIError("No AI key configured. Set GEMINI_API_KEY (and optionally GROQ_API_KEY).", 500);
  }

  let lastError: AIError | null = null;

  for (const p of list) {
    try {
      const res = await fetch(p.url, {
        method: "POST",
        signal: AbortSignal.timeout(opts.timeoutMs ?? 45_000),
        headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: p.model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.2,
          ...(opts.maxTokens && { max_tokens: opts.maxTokens }),
          ...(opts.json && { response_format: { type: "json_object" } }),
        }),
      });

      if (!res.ok) {
        const text = (await res.text()).slice(0, 300);
        console.warn(`AI ${p.name}/${p.model} failed: ${res.status} ${text}`);
        lastError = new AIError(`${p.name} returned ${res.status}`, res.status);
        // Bad request on our side won't be fixed by another provider… except
        // when a model name isn't available on this key, so keep going on 400/404 too.
        continue;
      }

      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        lastError = new AIError(`${p.name} returned an empty response`, 502);
        continue;
      }
      console.log(`AI answered by ${p.name}/${p.model}`);
      return { content, provider: p.name, model: p.model };
    } catch (err) {
      console.warn(`AI ${p.name}/${p.model} error:`, err);
      lastError = new AIError(err instanceof Error ? err.message : String(err), 503);
    }
  }

  throw lastError ?? new AIError("All AI providers failed", 503);
}

/** Pull the first JSON object out of a model reply (handles ```json fences and trailing commas). */
export function parseJsonReply<T = any>(content: string): T {
  let s = content.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(s);
}
