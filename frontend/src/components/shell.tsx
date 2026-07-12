import { Link, useLocation } from "wouter";
import { LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel, BarChart3, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("transitops_token");
    if (!token) {
      setLocation("/login");
      return;
    }

    // Verify token with /me endpoint
    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const json = await res.json();
        // New backend returns { success: true, data: user }
        const userData = json.data ?? json;
        setUser(userData);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("transitops_token");
        localStorage.removeItem("transitops_user");
        setLocation("/login");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    setLocation("/login");
    toast({ title: "Signed out successfully" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fleet", label: "Fleet", icon: Truck },
    { href: "/drivers", label: "Drivers", icon: Users },
    { href: "/trips", label: "Trips", icon: MapPin },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">TransitOps</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-mono">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{user?.name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {user?.role?.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
