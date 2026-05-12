import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function getJwt(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const jwt = getJwt(req);
  if (!jwt) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  const payload = verifyToken(jwt);
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  try {
    const body = await req.json();
    const {
      type = "chat_message",
      question,
      answer,
      model,
      response_time_ms,
      tokens_used,
      session_id,
      created_at,
    } = body;

    await pool.query(
      `INSERT INTO desktop_sessions
        (user_id, type, question, answer, model, response_time_ms, tokens_used, session_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        payload.userId,
        type,
        question?.slice(0, 1000) ?? null,
        answer?.slice(0, 5000) ?? null,
        model ?? null,
        response_time_ms ?? null,
        tokens_used ?? null,
        session_id ?? null,
        created_at ? new Date(created_at) : new Date(),
      ]
    );

    return NextResponse.json({ success: true }, { headers: cors });
  } catch (err) {
    console.error("Desktop sessions POST error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: cors });
  }
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const jwt = getJwt(req);
  if (!jwt) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  const payload = verifyToken(jwt);
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  try {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Number(searchParams.get("offset") ?? 0);
    const type = searchParams.get("type");

    const conditions = ["user_id = $1"];
    const params: (string | number)[] = [payload.userId];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT id, type, question, answer, model, response_time_ms, tokens_used, session_id, created_at
       FROM desktop_sessions
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json({ sessions: result.rows }, { headers: cors });
  } catch (err) {
    console.error("Desktop sessions GET error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: cors });
  }
}
