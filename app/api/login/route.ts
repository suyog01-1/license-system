import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!; // ✅ required in Vercel env

// 🔹 Decode current user
function getUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

// ===================== GET =====================
export async function GET() {
  const user = getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resellers = await prisma.user.findMany({
    where: { role: "reseller" },
    select: {
      id: true,
      username: true,
      credits: true,
      createdAt: true,
      _count: { select: { licenses: true } },
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(resellers);
}

// ===================== POST =====================
export async function POST(req: Request) {
  const user = getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { username, password, credits } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const newReseller = await prisma.user.create({
      data: {
        username,
        password,
        email: `${username}@gmail.com`, // 👈 auto-generate email
        role: "reseller",
        credits: credits ? Number(credits) : 0,
      },
    });

    return NextResponse.json(newReseller);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    console.error("POST /resellers error:", err);
    return NextResponse.json(
      { error: "Failed to create reseller" },
      { status: 500 }
    );
  }
}

// ===================== DELETE =====================
export async function DELETE(req: Request) {
  const user = getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "Reseller ID required" },
        { status: 400 }
      );
    }

    // Delete reseller + cascade delete licenses
    await prisma.license.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /resellers error:", err);
    return NextResponse.json(
      { error: "Failed to delete reseller" },
      { status: 500 }
    );
  }
}
