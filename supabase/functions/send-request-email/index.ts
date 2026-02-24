/// <reference path="../types.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL    = Deno.env.get("ADMIN_REQUEST_EMAIL") || "kdelavega55@gmail.com";
const FROM_ADDRESS   = Deno.env.get("RESEND_FROM")        || "CityLife <onboarding@resend.dev>";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);
  if (!RESEND_API_KEY)          return json({ error: "RESEND_API_KEY is not set" }, 500);

  try {
    const { subject, bodyLines } = await req.json();

    if (!subject) return json({ error: "Subject is required" }, 400);

    const text = Array.isArray(bodyLines) ? bodyLines.filter(Boolean).join("\n") : "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      [ADMIN_EMAIL],
        subject: subject || "Service Request",
        text:    text || "(No details provided)",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", data);
      return json({ error: data.message || "Failed to send email" }, res.status);
    }

    return json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Email function error:", message);
    return json({ error: message }, 500);
  }
});
