"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-500 transition-all">
              SolChain
            </Link>
            <div className="hidden md:flex gap-6">
              <NavLink href="/communities">Communities</NavLink>
              <NavLink href="/members">Members</NavLink>
              <NavLink href="/governance">Governance</NavLink>
              <NavLink href="/events">Events</NavLink>
            </div>
          </div>
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !transition-colors" />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 font-medium transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-[17px] left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300" />
    </Link>
  );
}

