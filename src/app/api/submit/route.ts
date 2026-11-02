import { NextResponse } from "next/server";
import { sheetColumns, submissionSchema, toSheetValues } from "@/lib/survey";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MIN_FILL_MS = 8000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please answer all required questions.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Bots: honeypot filled or submitted implausibly fast. Pretend success.
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const url = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.SURVEY_SHARED_SECRET;
  if (!url || !secret) {
    return NextResponse.json(
      { error: "The survey is not connected to its spreadsheet yet. Please try again later." },
      { status: 503 },
    );
  }

  const id = crypto.randomUUID().slice(0, 8).toUpperCase();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, id, name: data.name.replace(/\s+/g, " "), headers: sheetColumns, values: toSheetValues(data) }),
      redirect: "follow",
      cache: "no-store",
    });
    const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !result?.ok) {
      console.error("Sheet write failed", res.status, result?.error);
      throw new Error("sheet");
    }
  } catch {
    return NextResponse.json(
      { error: "We couldn't save your answers just now. Please try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
