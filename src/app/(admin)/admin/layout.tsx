"use client";

import { useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!auth.currentUser) {
            signInWithEmailAndPassword(
                auth,
                "teksarimelda@gmail.com",
                "123456"
            );
        }
    }, []);

    return (
        <AdminGuard>
            <div className="min-h-screen flex bg-white">
                <AdminSidebar />
                <main className="flex-1 p-12">{children}</main>
            </div>
        </AdminGuard>
    );
}
