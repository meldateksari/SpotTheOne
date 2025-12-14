"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase.client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/common/LanguageSelector";

export default function AdminLoginPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            if (res.ok) {
                router.push("/admin");
            } else {
                setError("Giriş işlemi sunucuda doğrulanamadı.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="flex justify-end p-4">
                <LanguageSelector />
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 shadow-xl border-none">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">{t("adminLogin")}</h1>
                        <p className="text-gray-500 mt-2">Spot The One — {t("adminPanel")}</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 text-sm rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("email")}
                                </label>
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("password")}
                                </label>
                                <Input
                                    type="password"
                                    placeholder="••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3"
                            variant="primary"
                        >
                            {loading ? t("loggingIn") : t("login")}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
