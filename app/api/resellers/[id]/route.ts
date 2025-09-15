// app/api/resellers/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resellerId = Number(context.params.id);
    const reseller = await prisma.user.findUnique({
      where: { id: resellerId },
      select: {
        id: true,
        username: true,
        email: true,
        credits: true,
        createdAt: true,
        licenses: true,
      },
    });

    if (!reseller) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    return NextResponse.json(reseller);
  } catch (err) {
    console.error("GET /api/resellers/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch reseller" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resellerId = Number(context.params.id);
    const body = await req.json();

    // Only allow credits update for now: { credits: number }
    if (body.credits === undefined) {
      return NextResponse.json({ error: "No credits provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: resellerId },
      data: { credits: Number(body.credits) },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/resellers/[id] error:", err);
    return NextResponse.json({ error: "Failed to update reseller" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resellerId = Number(context.params.id);

    // remove reseller licenses and reseller record
    await prisma.license.deleteMany({ where: { userId: resellerId } });
    await prisma.user.delete({ where: { id: resellerId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/resellers/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete reseller" }, { status: 500 });
  }
}
