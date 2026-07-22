import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import {
  LayoutDashboard, Briefcase, TrendingUp, Users, Settings, LogOut, Building2,
  ShieldCheck, FileCheck, PieChart, Megaphone, PlusCircle, BarChart3, Receipt,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = { to: string; label: string; icon: any };

const NAV: Record<Role, NavItem[]> = {
  investor: [
    { to: "/investor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/startups", label: "Browse Startups", icon: Building2 },
    { to: "/portfolio", label: "Portfolio", icon: PieChart },
    { to: "/transactions", label: "Transactions", icon: Receipt },
  ],
  founder: [
    { to: "/founder/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/founder/create-startup", label: "Create Startup", icon: PlusCircle },
    { to: "/founder/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/founder/analytics", label: "Analytics", icon: BarChart3 },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/startups", label: "Startups", icon: Briefcase },
    { to: "/admin/kyc", label: "KYC", icon: FileCheck },
  ],
};

const SETTINGS_ITEMS: NavItem[] = [
  { to: "/settings", label: "Profile", icon: Settings },
  { to: "/settings/security", label: "Security", icon: ShieldCheck },
  { to: "/settings/sessions", label: "Sessions", icon: TrendingUp },
];

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = user ? NAV[user.role] : [];

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
        <div className="p-5 border-b border-sidebar-border"><Logo to={user ? `/${user.role}/dashboard`.replace("/investor/dashboard", "/investor/dashboard") : "/"} /></div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
            <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Account</p>
            {SETTINGS_ITEMS.map((it) => {
              const active = pathname === it.to;
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="btn-gradient text-xs">{user?.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 border-b border-border bg-background/60 backdrop-blur-xl flex items-center justify-between px-4">
          <Logo />
          <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4" /></Button>
        </header>
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] w-full mx-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
