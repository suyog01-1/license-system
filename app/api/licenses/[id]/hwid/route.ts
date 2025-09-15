import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function getUser() {
  const cookieStore = await cookies(); // ✅ async in Next 15
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getUser(); // ✅ now async
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(context.params.id);

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    if (user.role === "reseller" && license.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.license.update({
      where: { id },
      data: { hwid: null },
    });

    return NextResponse.json({ success: true, license: updated });
  } catch (err) {
    console.error("POST /api/licenses/[id]/hwid error:", err);
    return NextResponse.json({ error: "Failed to reset HWID" }, { status: 500 });
  }
}
