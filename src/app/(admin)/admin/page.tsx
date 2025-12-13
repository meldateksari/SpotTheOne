export default function AdminDashboardPage() {
    return (
        <div className="space-y-12 fade-in">
            <header>
                <h1 className="text-3xl mb-2">Dashboard</h1>
                <p className="text-gray-dark text-sm">
                    System overview & live metrics
                </p>
            </header>

            <section className="grid grid-cols-3 gap-8">
                <div className="card-premium">
                    <p className="text-sm uppercase tracking-widest text-gray-dark">
                        Active Rooms
                    </p>
                    <h2 className="text-4xl mt-4">12</h2>
                </div>

                <div className="card-premium">
                    <p className="text-sm uppercase tracking-widest text-gray-dark">
                        Players Online
                    </p>
                    <h2 className="text-4xl mt-4">47</h2>
                </div>

                <div className="card-premium">
                    <p className="text-sm uppercase tracking-widest text-gray-dark">
                        Total Questions
                    </p>
                    <h2 className="text-4xl mt-4">320</h2>
                </div>
            </section>
        </div>
    );
}
