import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, ShieldAlert, Activity, BarChart4, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "fleet@transitops.com",
      password: "Admin@123",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || json.error || "Invalid credentials");
      }

      // New backend returns { success: true, data: { accessToken, refreshToken, user } }
      const result = json.data ?? json;
      localStorage.setItem("transitops_token", result.accessToken);
      localStorage.setItem("transitops_user", JSON.stringify(result.user));
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const demoAccounts = [
    { email: "admin@transitops.com", label: "Admin", color: "text-purple-400" },
    { email: "fleet@transitops.com", label: "Fleet Manager", color: "text-primary" },
    { email: "safety@transitops.com", label: "Safety Officer", color: "text-rose-400" },
    { email: "finance@transitops.com", label: "Financial Analyst", color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-card border-r border-border p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Truck className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">TransitOps</h1>
              <p className="text-primary font-mono text-sm tracking-widest uppercase">Command Center</p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-semibold mb-6">Operational Roles</h2>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium font-mono text-sm uppercase mb-1">Fleet Manager</h3>
                <p className="text-muted-foreground text-sm">Oversee vehicle registry, utilization metrics, and overall fleet health.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium font-mono text-sm uppercase mb-1">Dispatcher</h3>
                <p className="text-muted-foreground text-sm">Assign drivers to vehicles, monitor live trips, and manage routing.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-medium font-mono text-sm uppercase mb-1">Safety Officer</h3>
                <p className="text-muted-foreground text-sm">Monitor driver safety scores, license expirations, and maintenance compliance.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <BarChart4 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-medium font-mono text-sm uppercase mb-1">Financial Analyst</h3>
                <p className="text-muted-foreground text-sm">Track operational costs, fuel efficiency, ROI, and process expenses.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground font-mono">v2.4.0-stable | Securing logistics data since 2024</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">System Access</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access the command center.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Email</FormLabel>
                    <FormControl>
                      <Input placeholder="operator@transitops.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </Form>

          <div className="p-4 bg-muted/50 rounded-md border border-border text-sm text-muted-foreground font-mono space-y-1">
            <p className="mb-2 text-foreground font-medium">Demo Accounts:</p>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => form.setValue("email", acc.email)}
                className="w-full text-left hover:bg-muted/80 rounded px-1 py-0.5 transition-colors"
              >
                <span className={acc.color}>{acc.email}</span>
                <span className="text-xs opacity-60 ml-2">— {acc.label}</span>
              </button>
            ))}
            <p className="mt-2 text-xs opacity-60">All accounts: Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
