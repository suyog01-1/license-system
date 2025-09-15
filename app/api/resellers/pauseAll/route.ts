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

// ===================== POST =====================
// Body: { resellerId: number, pause: boolean }
export async function POST(req: Request) {
  const user = getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { resellerId, pause } = await req.json();

    if (!resellerId || typeof pause !== "boolean") {
      return NextResponse.json(
        { error: "resellerId and pause are required" },
        { status: 400 }
      );
    }

    // Ensure reseller exists
    const reseller = await prisma.user.findUnique({
      where: { id: resellerId, role: "reseller" },
    });

    if (!reseller) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    }

    // Update all licenses created by this reseller
    await prisma.license.updateMany({
      where: { userId: resellerId },
      data: { paused: pause },
    });

    return NextResponse.json({
      success: true,
      message: `All licenses for ${reseller.username} have been ${
        pause ? "paused" : "unpaused"
      }.`,
    });
  } catch (err) {
    console.error("pauseAll error:", err);
    return NextResponse.json(
      { error: "Failed to pause licenses" },
      { status: 500 }
    );
  }
}
