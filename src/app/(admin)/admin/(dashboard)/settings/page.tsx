"use client";

import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Ayarlar</h1>
            <Card>
                <div className="text-gray-500">
                    Admin paneli ayarları burada yer alacak.
                </div>
            </Card>
        </div>
    );
}
