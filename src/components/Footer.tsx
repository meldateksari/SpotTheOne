"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="w-full py-3 text-center border-t border-gray-mid bg-white">
      <div className="flex items-center justify-center gap-1 text-gray-dark text-xs">

        <span className="material-symbols-outlined text-gray-dark text-[12px] leading-none">
          stars
        </span>

        <span className="opacity-70">
          {t("madeBy")}{" "}

          <a
            href="https://www.linkedin.com/in/melda-teksari-a514212ba/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline opacity-80"
          >
            Melda Teksarı
          </a>

          {" "} & {" "}

          <a
            href="https://www.linkedin.com/in/furkan-hazar/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline opacity-80"
          >
            Furkan Hazar
          </a>
        </span>

      </div>
    </footer>
  );
}
