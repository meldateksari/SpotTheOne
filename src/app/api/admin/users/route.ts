import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = await adminAuth.verifyIdToken(token);

        if (!decoded.admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ ok: true, users: [] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
