"use client";

import { useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    // Auto-login removed for security
    useEffect(() => {
        // Optional: Check auth state or perform other init
    }, []);

    return (
        <AdminGuard>
            <div className="min-h-screen flex bg-white">
                <AdminSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <AdminHeader />
                    <main className="flex-1 p-12 overflow-y-auto">{children}</main>
                </div>
            </div>
        </AdminGuard >
    );
}
