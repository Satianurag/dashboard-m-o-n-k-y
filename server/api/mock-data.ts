import type { MockData } from "@/types/dashboard";

export const layoutMockData: MockData = {
    dashboardStats: [
        { label: "Active pNodes", value: "216", description: "Real-time active nodes", intent: "positive" as const, icon: "server" },
        { label: "Network Health", value: "97.5%", description: "Overall network status", intent: "positive" as const, icon: "heart-pulse" },
        { label: "Total Storage", value: "432 TB", description: "Aggregate storage", intent: "neutral" as const, icon: "database" },
        { label: "Avg Latency", value: "45ms", description: "Response time", intent: "positive" as const, icon: "activity" },
    ],
    chartData: {
        week: [],
        month: [],
        year: [],
    },
    rebelsRanking: [],
    securityStatus: [
        { title: "Network Security", value: "95", status: "Secure", variant: "success" as const },
    ],
    notifications: [
        { id: "1", title: "Network Status", message: "All pNodes operating normally", type: "info" as const, read: false, timestamp: new Date().toISOString(), priority: "low" as const },
    ],
    widgetData: { location: "Global", timezone: "UTC", temperature: "N/A", weather: "N/A", date: new Date().toISOString().split('T')[0] },
};
