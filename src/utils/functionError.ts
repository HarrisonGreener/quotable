// Read the message and status a server function sent back with an error, so people
// see "today's limit reached" or "subscription not active" rather than a generic failure.
export const readFunctionError = async (error: unknown): Promise<{ status?: number; message?: string }> => {
  const ctx = (error as { context?: Response })?.context;
  if (!ctx || typeof ctx.json !== "function") return {};
  try {
    const body = await ctx.clone().json();
    return { status: ctx.status, message: typeof body?.error === "string" ? body.error : undefined };
  } catch {
    return { status: ctx.status };
  }
};
