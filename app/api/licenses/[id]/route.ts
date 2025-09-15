import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ✅ DELETE - Delete a license by ID with credit refund
 */
export async function DELETE(req: Request) {
  try {
    const { id, resellerId } = await req.json();
    const license = await prisma.license.findUnique({ where: { id } });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // refund remaining credits
    let refund = 0;
    if (license.expiresAt) {
      const now = new Date();
      const expiry = new Date(license.expiresAt);
      if (expiry > now) {
        const msLeft = expiry.getTime() - now.getTime();
        refund = Math.floor(msLeft / (1000 * 60 * 60 * 24));
      }
    }

    await prisma.license.delete({ where: { id } });

    if (resellerId && refund > 0) {
      await prisma.user.update({
        where: { id: resellerId },
        data: { credits: { increment: refund } },
      });
    }

    return NextResponse.json(
      { message: "License deleted successfully", refund },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete license" },
      { status: 500 }
    );
  }
}

/**
 * ✅ PATCH - Update license status or reset HWID
 */
export async function PATCH(req: Request) {
  try {
    const { id, field, value } = await req.json();
    const license = await prisma.license.findUnique({ where: { id } });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Reset HWID
    if (field === "resetHwid") {
      const updated = await prisma.license.update({
        where: { id },
        data: { hwid: null },
      });
      return NextResponse.json(
        { message: "HWID reset successfully", license: updated },
        { status: 200 }
      );
    }

    // Toggle fields
    if (!["paused", "revoked", "expired"].includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const updated = await prisma.license.update({
      where: { id },
      data: { [field]: value },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 }
    );
  }
}

/**
 * ✅ GET - Fetch license by ID
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(license, { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch license" },
      { status: 500 }
    );
  }
}
