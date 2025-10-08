import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Web3Provider } from "@/components/providers/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "fundtracker.pro",
  description: "Track and manage funding rate arbitrage opportunities across exchanges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Web3Provider>
          {children}
          <Toaster position="top-right" richColors />
        </Web3Provider>
      </body>
    </html>
  );
}