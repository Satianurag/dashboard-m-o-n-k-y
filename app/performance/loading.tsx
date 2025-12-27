import DashboardPageLayout from "@/components/dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";
import TrophyIcon from "@/components/icons/trophy";

export default function Loading() {
    return (
        <DashboardPageLayout
            header={{
                title: "Performance",
                description: "Loading...",
                icon: TrophyIcon,
            }}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-[400px] rounded-lg" />
            </div>
        </DashboardPageLayout>
    );
}
