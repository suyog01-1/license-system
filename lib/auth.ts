import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ✅ Verify JWT from cookies
export async function verifyAuth(req: Request) {
  try {
    const cookieStore = cookies();
  const cookieStore = await cookies();
const token = cookieStore.get("token")?.value;


    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };

    return decoded; // { id, email }
  } catch (error) {
    console.error("verifyAuth error:", error);
    return null;
  }
}
