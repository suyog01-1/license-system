// app/api/resellers/pauseAll/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth"; // ✅ use centralized auth helper

// ===================== POST =====================
// Body: { resellerId: number, pause: boolean }
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { resellerId, pause } = await req.json();

    if (!resellerId || typeof pause !== "boolean") {
      return NextResponse.json(
        { error: "resellerId and pause are required" },
        { status: 400 }
      );
    }

    // ✅ Ensure reseller exists
    const reseller = await prisma.user.findUnique({
      where: { id: resellerId, role: "reseller" },
    });

    if (!reseller) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    }

    // ✅ Update licenses
    const result = await prisma.license.updateMany({
      where: { userId: resellerId },
      data: { paused: pause },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `All licenses for ${reseller.username} have been ${
        pause ? "paused" : "unpaused"
      }.`,
    });
  } catch (err) {
    console.error("POST /api/resellers/pauseAll error:", err);
    return NextResponse.json(
      { error: "Failed to pause/unpause licenses" },
      { status: 500 }
    );
  }
}
