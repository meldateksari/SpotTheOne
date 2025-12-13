export default function AdminQuestionsPage() {
    return (
        <div className="space-y-12 slide-up">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl mb-2">Questions</h1>
                    <p className="text-gray-dark text-sm">
                        Manage game questions
                    </p>
                </div>

                <button className="btn-primary w-auto px-10">
                    Add Question
                </button>
            </header>

            <div className="card-premium space-y-6">
                {[1, 2, 3].map((q) => (
                    <div
                        key={q}
                        className="flex items-center justify-between border-b border-gray-mid pb-4 last:border-none"
                    >
                        <div>
                            <p className="font-medium">Which one is fake?</p>
                            <p className="text-xs text-gray-dark mt-1">Language: TR</p>
                        </div>

                        <div className="flex gap-4">
                            <button className="btn-ghost w-auto px-4">Edit</button>
                            <button className="btn-secondary w-auto px-4">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
