// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function getUser() {
  try {
    // explicitly cast cookies() to any so TS stops treating it as a Promise
    const cookieStore = cookies() as any;

    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}
