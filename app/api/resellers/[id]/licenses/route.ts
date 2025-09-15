// app/api/resellers/[id]/licenses/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth"; // ✅ centralized auth

// ===================== GET =====================
export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resellerId = Number(context.params.id);

    // ✅ Allow only admin OR reseller accessing own licenses
    if (user.role !== "admin" && !(user.role === "reseller" && user.id === resellerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const licenses = await prisma.license.findMany({
      where: { userId: resellerId },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(licenses);
  } catch (err) {
    console.error("GET /api/resellers/[id]/licenses error:", err);
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}

// ===================== POST =====================
export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resellerId = Number(context.params.id);
    const body = await req.json();

    if (body.action === "pauseAll") {
      const paused = !!body.paused;
      const result = await prisma.license.updateMany({
        where: { userId: resellerId },
        data: { paused },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/resellers/[id]/licenses error:", err);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
