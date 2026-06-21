import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken, hashPassword, verifyPassword } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function getJwt(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });
}

export async function PUT(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const jwt = getJwt(req);
  if (!jwt) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });
  const payload = verifyToken(jwt);
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  const body = await req.json().catch(() => ({}));
  const { name, current_password, new_password } = body;

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (name !== undefined) {
    const trimmed = (name as string).trim();
    if (!trimmed || trimmed.length > 100) {
      return NextResponse.json({ error: "Имя должно быть от 1 до 100 символов" }, { status: 400, headers: cors });
    }
    params.push(trimmed);
    updates.push(`name = $${params.length}`);
  }

  if (new_password !== undefined) {
    if (!current_password) {
      return NextResponse.json({ error: "Укажите текущий пароль" }, { status: 400, headers: cors });
    }
    if ((new_password as string).length < 8) {
      return NextResponse.json({ error: "Новый пароль минимум 8 символов" }, { status: 400, headers: cors });
    }

    const userRes = await pool.query("SELECT password_hash FROM users WHERE id = $1", [payload.userId]);
    const user = userRes.rows[0];

    if (!user.password_hash) {
      return NextResponse.json({ error: "У этого аккаунта нет пароля (вход через Google)" }, { status: 400, headers: cors });
    }

    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Текущий пароль неверный" }, { status: 401, headers: cors });
    }

    const hash = await hashPassword(new_password);
    params.push(hash);
    updates.push(`password_hash = $${params.length}`);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400, headers: cors });
  }

  params.push(payload.userId);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING id, name, email`,
    params
  );

  return NextResponse.json({ user: result.rows[0] }, { headers: cors });
}