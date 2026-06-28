import { NextRequest, NextResponse } from "next/server";

const COOKIE = "oral_auth";

export async function POST(req: NextRequest) {
  const passcode = process.env.CLASS_PASSCODE;
  if (!passcode) {
    // No passcode configured: nothing to check, treat as success.
    return NextResponse.json({ ok: true });
  }

  let body: { passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (body.passcode !== passcode) {
    return NextResponse.json(
      { ok: false, error: "Incorrect passcode." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, passcode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
