import Link from "next/link";

const links = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/questions", label: "Questions", icon: "quiz" },
    { href: "/admin/users", label: "Users", icon: "group" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function AdminSidebar() {
    return (
        <aside className="w-72 border-r border-gray-mid p-8">
            <h1 className="font-premium text-sm mb-12">Spot The One — Admin</h1>

            <nav className="space-y-6">
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
        </aside>
    );
}
