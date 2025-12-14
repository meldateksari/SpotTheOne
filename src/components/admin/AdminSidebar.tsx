import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/common/LanguageSelector";

export default function AdminSidebar() {
    const router = useRouter();
    const { t } = useLanguage();

    const links = [
        { href: "/admin", label: t("dashboard"), icon: "dashboard" },
        { href: "/admin/questions", label: t("questions"), icon: "quiz" },
        { href: "/admin/users", label: t("users"), icon: "group" },
        { href: "/admin/settings", label: t("settings"), icon: "settings" },
    ];

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
            <h1 className="font-premium text-sm mb-12">Spot The One — {t("adminPanel")}</h1>

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

            <div className="mt-auto pt-8 border-t border-gray-100 space-y-4">
                <div className="flex justify-center">
                    {/* Language Selector moved to AdminHeader */}
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-4 text-sm uppercase tracking-widest text-red-500 hover:opacity-60 transition"
                >
                    <span className="material-symbols-outlined">logout</span>
                    {t("logout")}
                </button>
            </div>
        </aside>
    );
}
