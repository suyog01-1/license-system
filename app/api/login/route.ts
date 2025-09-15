import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    let user;

    if (email) {
      // 🔑 Admin login
      user = await prisma.admin.findUnique({ where: { email } });
      if (!user || user.password !== password) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
      }

      const token = jwt.sign({ role: "admin", email: user.email }, JWT_SECRET, { expiresIn: "1d" });
      cookies().set("token", token, { httpOnly: true, secure: true });
      return NextResponse.json({ success: true, role: "admin" });

    } else if (username) {
      // 🔑 Reseller login
      user = await prisma.user.findUnique({ where: { username } });
      if (!user || user.password !== password || user.role !== "reseller") {
        return NextResponse.json({ error: "Invalid reseller credentials" }, { status: 401 });
      }

      const token = jwt.sign({ role: "reseller", username: user.username, id: user.id }, JWT_SECRET, { expiresIn: "1d" });
      cookies().set("token", token, { httpOnly: true, secure: true });
      return NextResponse.json({ success: true, role: "reseller" });

    } else {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
