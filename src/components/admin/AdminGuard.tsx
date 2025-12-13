"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase.client";

export default function AdminGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            console.log("AUTH USER:", user);

            if (!user) {
                console.log("❌ No user → redirect");
                router.replace("/");
                return;
            }

            const token = await user.getIdTokenResult(true);
            console.log("CLAIMS:", token.claims);

            if (!token.claims.admin) {
                console.log("❌ Not admin → redirect");
                router.replace("/");
                return;
            }

            console.log("✅ Admin OK → render");
            setReady(true);
        });

        return () => unsub();
    }, [router]);

    if (!ready) return null;

    return <>{children}</>;
}
