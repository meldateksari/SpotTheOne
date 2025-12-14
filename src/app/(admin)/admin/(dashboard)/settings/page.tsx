"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t("settings")}</h1>
            <Card>
                <div className="text-gray-500">
                    {t("adminPanel")} {t("settings")}
                </div>
            </Card>
        </div>
    );
}
