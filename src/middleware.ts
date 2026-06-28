import { NextRequest, NextResponse } from "next/server";

const COOKIE = "oral_auth";

export function middleware(req: NextRequest) {
  const passcode = process.env.CLASS_PASSCODE;

  // If no passcode is configured, the site is open (useful for local dev).
  if (!passcode) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie && cookie === passcode) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Protect everything except the login page, the auth API, and static assets.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
