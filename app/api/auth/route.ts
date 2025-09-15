// app/api/auth/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/auth
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { username, password, hwid } = body as {
      username?: string;
      password?: string;
      hwid?: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { username },
    });

    if (!license || license.password !== password) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // 🔹 License state checks
    const now = new Date();

    if (license.revoked) {
      return NextResponse.json(
        { success: false, error: "License revoked" },
        { status: 403 }
      );
    }

    if (license.paused) {
      return NextResponse.json(
        { success: false, error: "License paused" },
        { status: 403 }
      );
    }

    if (license.expiresAt && license.expiresAt < now) {
      if (!license.expired) {
        await prisma.license.update({
          where: { id: license.id },
          data: { expired: true },
        });
      }
      return NextResponse.json(
        { success: false, error: "License expired" },
        { status: 403 }
      );
    }

    // 🔹 HWID binding
    if (!license.hwid) {
      if (!hwid) {
        return NextResponse.json(
          { success: false, error: "HWID required" },
          { status: 400 }
        );
      }

      await prisma.license.update({
        where: { id: license.id },
        data: { hwid },
      });
    } else {
      if (!hwid || license.hwid !== hwid) {
        return NextResponse.json(
          { success: false, error: "License already in use on another device" },
          { status: 403 }
        );
      }
    }

    // ✅ Success
    return NextResponse.json({
      success: true,
      message: "Login successful",
    });
  } catch (err) {
    console.error("POST /api/auth error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
