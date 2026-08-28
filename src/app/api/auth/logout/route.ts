import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  const cookieStore = await cookies();
  cookieStore.delete("backseat_session");
  return NextResponse.json({ ok: true });
}

