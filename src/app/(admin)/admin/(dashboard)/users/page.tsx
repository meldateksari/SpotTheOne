export default function AdminUsersPage() {
    return (
        <div className="space-y-12 fade-in">
            <header>
                <h1 className="text-3xl mb-2">Users</h1>
                <p className="text-gray-dark text-sm">
                    Player & admin accounts
                </p>
            </header>

            <div className="card-premium space-y-6">
                {[1, 2, 3].map((u) => (
                    <div
                        key={u}
                        className="flex items-center justify-between border-b border-gray-mid pb-4 last:border-none"
                    >
                        <div>
                            <p className="font-medium">user@email.com</p>
                            <p className="text-xs text-gray-dark mt-1">Player</p>
                        </div>

                        <button className="btn-secondary w-auto px-6">
                            Make Admin
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
