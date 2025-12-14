import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.client";

const links = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/questions", label: "Questions", icon: "quiz" },
    { href: "/admin/users", label: "Users", icon: "group" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function AdminSidebar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/admin/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <aside className="w-72 border-r border-gray-mid p-8 flex flex-col h-full bg-white">
            <h1 className="font-premium text-sm mb-12">Spot The One — Admin</h1>

            <nav className="space-y-6 flex-1">
                {links.map((l) => (
                    <Link
                        key={l.href}
                        href={l.href}
                        className="flex items-center gap-4 text-sm uppercase tracking-widest hover:opacity-60 transition"
                    >
                        <span className="material-symbols-outlined">{l.icon}</span>
                        {l.label}
                    </Link>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-4 text-sm uppercase tracking-widest text-red-500 hover:opacity-60 transition mt-auto pt-8 border-t border-gray-100"
            >
                <span className="material-symbols-outlined">logout</span>
                Çıkış Yap
            </button>
        </aside>
    );
}
