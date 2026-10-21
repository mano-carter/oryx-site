import { createClient } from "npm:@supabase/supabase-js@2";
const LIMITS: Record<string, number> = { free: 3, pro: 50 };
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await sb.auth.getUser(req.headers.get("Authorization")?.replace("Bearer ", ""));
  if (!user) return json({ error: "unauthorized" }, 401);
  const { prompt, kind } = await req.json();
  if (typeof prompt !== "string" || prompt.length > 60000) return json({ error: "bad request" }, 400);

  const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).single();
  const month = new Date().toISOString().slice(0, 7) + "-01";
  if (p.period_start < month) { await sb.from("profiles").update({ used: 0, period_start: month }).eq("id", user.id); p.used = 0; }
  const isPlan = kind === "plan";
  if (isPlan && p.used >= LIMITS[p.plan]) return json({ error: "limit" }, 402);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 6000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) return json({ error: "ai_failed" }, 502);
  const out = await r.json();
  if (isPlan) await sb.from("profiles").update({ used: p.used + 1 }).eq("id", user.id);
  return json({ text: out.content?.[0]?.text ?? "" });
});
