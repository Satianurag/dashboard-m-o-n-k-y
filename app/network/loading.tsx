import DashboardPageLayout from "@/components/dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";
import GlobeIcon from "@/components/icons/globe";

export default function Loading() {
    return (
        <DashboardPageLayout
            header={{
                title: "Topology",
                description: "Loading...",
                icon: GlobeIcon,
            }}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-[400px] rounded-lg" />
            </div>
        </DashboardPageLayout>
    );
}
