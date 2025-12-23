import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { V0Provider } from "@/lib/v0-context";
import localFont from "next/font/local";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import Widget from "@/components/dashboard/widget";
import Notifications from "@/components/dashboard/notifications";
import { MobileChat } from "@/components/chat/mobile-chat";
import Chat from "@/components/chat";
import { WalletContextProvider } from "@/contexts/wallet-context";
import { LiveNetworkPulse } from "@/components/dashboard/live-pulse";
import type { MockData } from "@/types/dashboard";

// Inline mock data for layout components (notifications, widget)
const mockData: MockData = {
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

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
});

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false;

export const metadata: Metadata = {
  title: {
    template: "%s – Xandeum pNode Analytics",
    default: "Xandeum pNode Analytics",
  },
  description:
    "Analytics platform for Xandeum pNodes. Monitor, analyze, and track pNode performance on the Xandeum network.",
  generator: 'Xandeum Labs',
  metadataBase: new URL('http://localhost:5000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preload"
          href="/fonts/Rebels-Fett.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`}
      >
        <V0Provider isV0={isV0}>
          <WalletContextProvider>
            <SidebarProvider>
              {/* Accessibility: Skip to main content link */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>

              {/* Mobile Header - only visible on mobile */}
              <MobileHeader mockData={mockData} />

              {/* Desktop Layout */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides pb-8">
                <div className="hidden lg:block col-span-2 top-0 relative">
                  <DashboardSidebar />
                </div>
                <main id="main-content" className="col-span-1 lg:col-span-7">{children}</main>
                <div className="col-span-3 hidden lg:block">
                  <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
                    <Widget />
                    <Notifications />
                    <Chat />
                  </div>
                </div>
              </div>

              {/* Live Network Pulse Footer */}
              <LiveNetworkPulse />

              {/* Mobile Chat - floating CTA with drawer */}
              <MobileChat />
            </SidebarProvider>
          </WalletContextProvider>
        </V0Provider>
      </body>
    </html>
  );
}
