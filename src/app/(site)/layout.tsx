import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <div className="page-wrapper flex-grow">
                {children}
            </div>
            <Footer />
        </>
    );
}
