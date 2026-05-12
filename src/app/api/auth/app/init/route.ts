// Desktop app calls this to get a token, then opens browser with it
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST() {
  const result = await pool.query(
    "INSERT INTO app_tokens DEFAULT VALUES RETURNING token"
  );
  const token = result.rows[0].token as string;
  return NextResponse.json({ token });
}
