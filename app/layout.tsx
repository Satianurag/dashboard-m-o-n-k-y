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
import { QueryProvider } from "@/lib/query-provider";
import { NetworkMarquee } from "@/components/dashboard/network-marquee";
// LiveNetworkPulse moved to app/page.tsx for performance
// LiveNetworkPulse moved to app/page.tsx for performance

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="pNode Analytics" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Font optimization handled by next/font/local */}
      </head>
      <body
        className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`}
      >
        <V0Provider isV0={isV0}>
          <QueryProvider>
            <WalletContextProvider>
              <SidebarProvider>
                {/* Accessibility: Skip to main content link */}
                <a href="#main-content" className="skip-link">
                  Skip to main content
                </a>

                {/* Mobile Header - only visible on mobile */}
                <MobileHeader />

                {/* Desktop Layout */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
                  <div className="hidden lg:block col-span-2 top-0 relative">
                    <DashboardSidebar />
                  </div>
                  <main id="main-content" className="col-span-1 lg:col-span-7">{children}</main>
                  <div className="col-span-3 hidden lg:block">
                    <div className="fixed right-[var(--sides)] top-0 bottom-6 w-[calc((100vw-var(--sides)*2-var(--gap)*2)/12*3)] space-y-gap pt-sides overflow-clip">
                      <Widget />
                      <Notifications />
                      <Chat />
                    </div>
                  </div>
                </div>

                {/* LiveNetworkPulse moved to dashboard page for performance */}

                {/* Network Stats Marquee - fixed at bottom */}
                <NetworkMarquee />

                {/* Mobile Chat - floating CTA with drawer */}
                <MobileChat />
              </SidebarProvider>
            </WalletContextProvider>
          </QueryProvider>
        </V0Provider>
      </body>
    </html>
  );
}
