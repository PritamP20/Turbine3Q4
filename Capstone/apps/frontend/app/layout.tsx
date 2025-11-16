import type { Metadata } from "next";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import { QueryProvider } from "@/lib/query-client";
import { ToastProvider } from "@/components/ToastContainer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SolChain DAO - Community Platform",
  description: "Decentralized community management on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-zinc-950 antialiased">
        <QueryProvider>
          <WalletContextProvider>
            <ToastProvider>
              <Navbar />
              {children}
            </ToastProvider>
          </WalletContextProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
