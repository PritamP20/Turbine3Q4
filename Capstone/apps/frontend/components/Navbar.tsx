"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b-8 border-black bg-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-2xl sm:text-3xl font-black text-black bg-cyan-400 px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              SOLCHAIN
            </Link>
            <div className="hidden md:flex gap-3">
              <NavLink href="/communities">COMMUNITIES</NavLink>
              {/* <NavLink href="/members">MEMBERS</NavLink> */}
              <NavLink href="/governance">GOVERNANCE</NavLink>
              <NavLink href="/events">EVENTS</NavLink>
              <NavLink href="/admin">ADMIN</NavLink>
            </div>
          </div>
          
          {/* Custom styled wallet button wrapper */}
          <div className="wallet-button-wrapper">
            <WalletMultiButton className="!bg-pink-400 hover:!bg-pink-500 !text-black !font-black !border-4 !border-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] !transition-all !px-6 !py-3 !rounded-none" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Override wallet adapter styles for Neo Brutalism */
        .wallet-adapter-button {
          background-color: #fb7185 !important;
          border: 4px solid black !important;
          border-radius: 0 !important;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,1) !important;
          font-weight: 900 !important;
          color: black !important;
          text-transform: uppercase !important;
          font-family: inherit !important;
        }
        
        .wallet-adapter-button:not([disabled]):hover {
          background-color: #f43f5e !important;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1) !important;
          transform: translate(2px, 2px) !important;
        }
        
        .wallet-adapter-button[disabled] {
          opacity: 0.5 !important;
        }
        
        .wallet-adapter-modal-wrapper {
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .wallet-adapter-modal {
          background-color: white !important;
          border: 8px solid black !important;
          border-radius: 0 !important;
          box-shadow: 12px 12px 0px 0px rgba(0,0,0,1) !important;
        }
        
        .wallet-adapter-modal-title {
          font-weight: 900 !important;
          color: black !important;
          text-transform: uppercase !important;
          border-bottom: 4px solid black !important;
          padding-bottom: 1rem !important;
        }
        
        .wallet-adapter-modal-list {
          margin-top: 1rem !important;
        }
        
        .wallet-adapter-modal-list-more {
          border: 4px solid black !important;
          border-radius: 0 !important;
          background-color: #fef3c7 !important;
          color: black !important;
          font-weight: 900 !important;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,1) !important;
        }
        
        .wallet-adapter-modal-list-more:hover {
          background-color: #fde68a !important;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1) !important;
          transform: translate(2px, 2px) !important;
        }
        
        .wallet-adapter-button-trigger {
          background-color: #a5f3fc !important;
          border: 4px solid black !important;
          border-radius: 0 !important;
          color: black !important;
          font-weight: 900 !important;
        }
      `}</style>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-black font-black text-sm relative group px-4 py-2 transition-all hover:bg-white border-4 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    >
      {children}
    </Link>
  );
}