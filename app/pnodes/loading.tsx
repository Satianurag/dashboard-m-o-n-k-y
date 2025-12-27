import DashboardPageLayout from "@/components/dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";
import ServerIcon from "@/components/icons/server";

export default function Loading() {
    return (
        <DashboardPageLayout
            header={{
                title: "pNodes",
                description: "Loading...",
                icon: ServerIcon,
            }}
        >
            <div className="space-y-4">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-96 rounded-lg" />
            </div>
        </DashboardPageLayout>
    );
}
