import DashboardPageLayout from "@/components/dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";
import BracketsIcon from "@/components/icons/brackets";

export default function Loading() {
    return (
        <DashboardPageLayout
            header={{
                title: "Dashboard",
                description: "Loading...",
                icon: BracketsIcon,
            }}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-lg" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-[400px] rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
            </div>
        </DashboardPageLayout>
    );
}
