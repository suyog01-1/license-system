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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });

    if (user.role === "reseller" && license.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(license);
  } catch (err) {
    console.error("GET /api/licenses/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch license" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });

    if (user.role === "reseller" && license.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (body.action === "resetHwid" || body.field === "resetHwid") {
      const updated = await prisma.license.update({
        where: { id },
        data: { hwid: null },
      });
      return NextResponse.json(updated);
    }

    const { field, value } = body;
    if (!field || !["paused", "revoked", "expired"].includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const newVal = typeof value === "boolean" ? value : !license[field];

    const updated = await prisma.license.update({
      where: { id },
      data: { [field]: newVal },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/licenses/[id] error:", err);
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });

    if (user.role === "reseller" && license.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "reseller" && license.expiresAt) {
      const now = new Date();
      const expires = new Date(license.expiresAt);
      if (expires > now) {
        const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { credits: { increment: daysLeft } },
          });
        }
      }
    }

    await prisma.license.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/licenses/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
