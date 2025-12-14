import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /admin routes
    if (pathname.startsWith("/admin")) {
        // Allow access to login page
        if (pathname === "/admin/login") {
            return NextResponse.next();
        }

        // Check for session cookie
        const session = request.cookies.get("admin_session");

        if (!session) {
            // Redirect to login if no session
            const loginUrl = new URL("/admin/login", request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Note: To verify the session cookie contents, we would need to call
        // firebase-admin (which requires edge compatibility or an external verification service).
        // For middleware, simply checking existence is a good first layer of defense.
        // The actual API routes and Page components should re-verify if strict security is needed.
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
