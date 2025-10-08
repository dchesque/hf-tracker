"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  Briefcase,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth";
import { toast } from "sonner";

const navigationGroups = [
  {
    title: "Make Money",
    items: [
      { name: "Opportunities", href: "/oportunidades", icon: Target, color: "text-yellow-500" },
    ]
  },
  {
    title: "My Cash",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-yellow-500" },
      { name: "My Positions", href: "/posicoes", icon: Briefcase, color: "text-yellow-500" },
      { name: "History", href: "/historico", icon: History, color: "text-yellow-500" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    email: string;
    full_name?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({
          email: authUser.email || '',
          full_name: profile?.full_name || authUser.email?.split('@')[0] || 'User',
        });
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg border border-zinc-800"
      >
        {isOpen ? <X size={24} className="text-zinc-400" /> : <Menu size={24} className="text-zinc-400" />}
      </button>

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-[260px] backdrop-blur-xl bg-black/95 border-r border-zinc-800/50 transition-transform duration-200 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Abstract blur backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-20 w-56 h-56 bg-yellow-400/7 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-amber-500/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 pt-6 pb-8 flex items-center justify-center">
            <h1 className="text-3xl tracking-tight">
              <span className="font-bold text-white">fund</span>
              <span className="font-bold text-yellow-500">tracker</span>
              <span className="font-light text-white">.pro</span>
            </h1>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-3">
            {navigationGroups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? "mt-6" : ""}>
                <h3 className="px-4 mb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  {group.title}
                </h3>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-base group",
                            isActive
                              ? "bg-zinc-800/60 text-white backdrop-blur-sm"
                              : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200 backdrop-blur-sm"
                          )}
                        >
                          <item.icon
                            size={20}
                            strokeWidth={2}
                            className={cn(
                              "transition-colors",
                              isActive ? item.color : "group-hover:" + item.color
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-zinc-800/50 relative">
            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-2xl overflow-hidden">
                <Link
                  href="/profile"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-sm text-zinc-300 hover:text-white"
                >
                  <User size={16} className="text-yellow-500" />
                  My Profile
                </Link>
                <Link
                  href="/subscription"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-sm text-zinc-300 hover:text-white"
                >
                  <CreditCard size={16} className="text-yellow-500" />
                  Subscription
                </Link>
                <Link
                  href="/configuracoes"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-sm text-zinc-300 hover:text-white"
                >
                  <Settings size={16} className="text-yellow-500" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-sm text-zinc-300 hover:text-red-400 border-t border-zinc-800/50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}

            {/* User Button */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isUserMenuOpen ? "bg-zinc-800/60" : "hover:bg-zinc-800/40"
              )}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-black text-sm font-bold shadow-lg">
                  {user ? getInitials(user.full_name || user.email) : 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate group-hover:text-yellow-500 transition-colors">
                  {user?.full_name || 'Loading...'}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
              <svg
                className={cn(
                  "w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all",
                  isUserMenuOpen && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
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