import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// PATCH - Reset HWID for a license
export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const license = await prisma.license.update({
      where: { id: parseInt(id) },
      data: { hwid: null },
    });

    return NextResponse.json(
      { message: "HWID reset successfully", license },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting HWID:", error);
    return NextResponse.json(
      { error: "Failed to reset HWID" },
      { status: 500 }
    );
  }
}
