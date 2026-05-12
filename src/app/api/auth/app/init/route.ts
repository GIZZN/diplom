import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(_req: NextRequest) {
  try {
    const result = await pool.query(
      "INSERT INTO app_tokens DEFAULT VALUES RETURNING token"
    );
    const token = result.rows[0].token as string;
    return NextResponse.json({ token }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("App init error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: CORS_HEADERS });
  }
}
