// ═══════════════════════════════════════════════════════════════════
// AI PROVIDER — your own keys, no Lovable gateway
//
// Tries each provider in order and falls through on rate limits, outages
// or bad responses. All of them speak the OpenAI chat format.
//
// Default order (chosen by testing, Nov 2026 — 9 real jobs vs published UK prices):
//   Gemini Flash-Lite (9/9 accurate) → Groq (accurate when it answered, but free tier
//   allows only ~8,000 tokens a minute ≈ 2 quotes/min) → Cerebras → bigger Gemini models
//
// Secrets (set with `supabase secrets set ...`) — any one key is enough:
//   GROQ_API_KEY      – https://console.groq.com/keys      (~1,000 requests/day free)
//   CEREBRAS_API_KEY  – https://cloud.cerebras.ai           (~1M tokens/day free)
//   GEMINI_API_KEY    – https://aistudio.google.com/apikey  (Flash-Lite has the most free requests)
// Optional:
//   AI_ORDER          – default "gemini-lite,groq,cerebras,gemini"
//   GROQ_MODEL        – default "openai/gpt-oss-120b"
//   CEREBRAS_MODEL    – default "gpt-oss-120b"
//   GEMINI_MODEL      – default "gemini-3.5-flash-lite"
//   GEMINI_FALLBACK_MODELS – comma list, default "gemini-3.8-flash,gemini-3.6-flash"
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
  const byName: Record<string, Provider[]> = { "gemini-lite": [], groq: [], cerebras: [], gemini: [] };
  const groq = Deno.env.get("GROQ_API_KEY");
  const cerebras = Deno.env.get("CEREBRAS_API_KEY");
  const gemini = Deno.env.get("GEMINI_API_KEY");

  if (groq) {
    byName.groq.push({
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groq,
      model: Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b",
    });
  }
  if (cerebras) {
    byName.cerebras.push({
      name: "cerebras",
      url: "https://api.cerebras.ai/v1/chat/completions",
      key: cerebras,
      model: Deno.env.get("CEREBRAS_MODEL") || "gpt-oss-120b",
    });
  }
  if (gemini) {
    // Flash-Lite first: far more free requests a day, and it quoted accurately in testing.
    // Each model has its own capacity, so a busy one doesn't take the others down.
    const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    const main = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash-lite";
    const fallbacks = (Deno.env.get("GEMINI_FALLBACK_MODELS") ?? "gemini-3.8-flash,gemini-3.6-flash")
      .split(",").map((m) => m.trim()).filter(Boolean);
    byName["gemini-lite"] = [{ name: "gemini", url, key: gemini, model: main }];
    for (const model of fallbacks.filter((m) => m !== main)) byName.gemini.push({ name: "gemini", url, key: gemini, model });
  }

  const order = (Deno.env.get("AI_ORDER") || "gemini-lite,groq,cerebras,gemini").split(",").map((s) => s.trim().toLowerCase())
    .flatMap((n) => (n === "gemini" && !(Deno.env.get("AI_ORDER") || "").includes("gemini-lite") && Deno.env.get("AI_ORDER") ? ["gemini-lite", "gemini"] : [n]));
  const list = order.flatMap((n) => byName[n] ?? []);
  // anything with a key but left out of AI_ORDER still goes last
  for (const [n, ps] of Object.entries(byName)) if (!order.includes(n)) list.push(...ps);
  return list;
};

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const list = providers();
  if (list.length === 0) {
    throw new AIError("No AI key configured. Set GROQ_API_KEY, CEREBRAS_API_KEY or GEMINI_API_KEY.", 500);
  }

  let lastError: AIError | null = null;

  // Two passes over the models: free-tier "high demand" errors usually clear within seconds
  for (let pass = 0; pass < 2; pass++) {
  if (pass > 0) {
    if (!lastError || (lastError.status !== 503 && lastError.status !== 429)) break;
    await new Promise((r) => setTimeout(r, 4000));
  }
  for (const p of list) {
    try {
      const send = () => fetch(p.url, {
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
      let res = await send();
      // "high demand" spikes are usually brief — one quick retry before moving on
      if (res.status === 503 || res.status === 429) {
        await res.body?.cancel();
        await new Promise((r) => setTimeout(r, 1500));
        res = await send();
      }

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
