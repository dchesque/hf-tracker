"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  Briefcase,
  History,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, comingSoon: true },
  { name: "Posições", href: "/posicoes", icon: Briefcase, comingSoon: true },
  { name: "Oportunidades", href: "/oportunidades", icon: Target, comingSoon: false },
  { name: "Histórico", href: "/historico", icon: History, comingSoon: true },
  { name: "Configurações", href: "/configuracoes", icon: Settings, comingSoon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg border border-border"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-60 bg-gray-900 border-r border-gray-800 transition-transform duration-200 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-100">
              HF Tracker
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Funding Rate Arbitrage
            </p>
          </div>

          <nav className="flex-1 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    {item.comingSoon ? (
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed opacity-50",
                          "text-gray-500"
                        )}
                      >
                        <item.icon size={20} />
                        <span className="flex-1">{item.name}</span>
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                          Em breve
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                        )}
                      >
                        <item.icon size={20} />
                        {item.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Usuário</p>
                <p className="text-xs text-gray-400 truncate">
                  user@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}