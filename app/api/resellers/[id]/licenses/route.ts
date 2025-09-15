import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const resellerId = parseInt(params.id, 10);

    const licenses = await prisma.license.findMany({
      where: { resellerId },
    });

    return NextResponse.json(licenses, { status: 200 });
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}
