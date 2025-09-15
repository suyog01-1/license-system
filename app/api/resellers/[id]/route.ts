// app/api/resellers/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

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

// ===================== GET (single reseller) =====================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resellerId = parseInt(params.id, 10);
  if (isNaN(resellerId)) {
    return NextResponse.json({ error: "Invalid reseller ID" }, { status: 400 });
  }

  const reseller = await prisma.user.findUnique({
    where: { id: resellerId, role: "reseller" },
    select: {
      id: true,
      username: true,
      credits: true,
      createdAt: true,
      licenses: true,
    },
  });

  if (!reseller) {
    return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
  }

  return NextResponse.json(reseller);
}

// ===================== PATCH (update reseller) =====================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const resellerId = parseInt(params.id, 10);
    if (isNaN(resellerId)) {
      return NextResponse.json({ error: "Invalid reseller ID" }, { status: 400 });
    }

    const { credits, password, username } = await req.json();

    const updated = await prisma.user.update({
      where: { id: resellerId, role: "reseller" },
      data: {
        ...(credits !== undefined && { credits: Number(credits) }),
        ...(password && { password }),
        ...(username && { username }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /resellers/[id] error:", err);
    return NextResponse.json({ error: "Failed to update reseller" }, { status: 500 });
  }
}
