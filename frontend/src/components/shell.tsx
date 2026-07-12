import { Link, useLocation } from "wouter";
import { LayoutDashboard, Truck, Users, UserCog, MapPin, Wrench, Fuel, BarChart3, LogOut, Loader2, Settings, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth, canManageUsers } from "@/context/auth-context";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  FLEET_MANAGER: "Fleet Manager",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  FLEET_MANAGER: "bg-primary/20 text-primary border-primary/30",
  SAFETY_OFFICER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FINANCIAL_ANALYST: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, logout } = useAuth();
  const [search, setSearch] = useState("");

  // Redirect if not authenticated
  if (!isLoading && !user) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setLocation("/login");
    toast({ title: "Signed out successfully" });
  };

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fleet", label: "Fleet", icon: Truck },
    { href: "/drivers", label: "Drivers", icon: Users },
    { href: "/trips", label: "Trips", icon: MapPin },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    // Admin-only: User Management
    ...(canManageUsers(user?.role)
      ? [{ href: "/users", label: "User Management", icon: UserCog }]
      : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? (user?.role?.replace(/_/g, " ") ?? "");
  const roleColor = ROLE_COLORS[user?.role ?? ""] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search vehicles, drivers, trips..."
              className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* User name + role badge */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold leading-none">{user?.name}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <span className={cn(
              "text-xs font-mono font-semibold px-2.5 py-1 rounded-full border",
              roleColor
            )}>
              {roleLabel}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
          {/* Brand */}
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">TransitOps</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-mono">Command Center</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium font-mono",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
