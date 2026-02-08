import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="lg:pl-20 flex flex-col min-h-screen transition-all duration-300">
                <Header />
                <main className="flex-1 p-6 space-y-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
