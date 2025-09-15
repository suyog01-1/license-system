import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ===================== Verify Token =====================
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

// ===================== GET =====================
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "admin") {
    const licenses = await prisma.license.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json(licenses);
  }

  if (user.role === "reseller") {
    const reseller = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, credits: true },
    });

    const licenses = await prisma.license.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ reseller, licenses });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ===================== POST =====================
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, password, days, expiresAt, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // calculate expiry date
    let expiryDate: Date | null = null;
    let duration = 0;
    if (days) {
      duration = parseInt(days, 10);
      if (isNaN(duration) || duration <= 0) {
        return NextResponse.json({ error: "Invalid days" }, { status: 400 });
      }
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);
    } else if (expiresAt) {
      expiryDate = new Date(expiresAt);
    }

    // figure out creator name
    let createdBy = "admin";
    if (user.role === "reseller") {
      const reseller = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true, credits: true },
      });

      if (!reseller) {
        return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
      }
      if (reseller.credits < duration) {
        return NextResponse.json({ error: "Not enough credits" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: duration } },
      });

      createdBy = reseller.username;
    }

    // ✅ build data object safely
    const data: any = {
      username,
      password,
      role: role || "user",
      createdBy,
      userId: user.role === "reseller" ? user.id : null,
    };

    if (expiryDate !== null) {
      data.expiresAt = expiryDate;
    }

    const newLicense = await prisma.license.create({ data });

    return NextResponse.json(newLicense);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("POST error:", err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// ===================== PATCH =====================
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, field, value } = await req.json();

    if (!id || !field) {
      return NextResponse.json(
        { error: "Missing id or field" },
        { status: 400 }
      );
    }

    let updateData: any = {};
    if (field === "resetHwid") {
      updateData.hwid = null;
    } else {
      updateData[field] = value;
    }

    const updated = await prisma.license.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ===================== DELETE =====================
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const license = await prisma.license.findUnique({ where: { id } });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // refund unused days if reseller
    if (user.role === "reseller" && license.expiresAt) {
      const now = new Date();
      if (license.expiresAt > now) {
        const daysLeft = Math.ceil(
          (license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
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
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
