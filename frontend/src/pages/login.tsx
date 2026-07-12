import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, ShieldAlert, Activity, BarChart4 } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@workspace/api-client-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.nativeEnum(UserRole).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "fleet@transitops.io",
      password: "password123",
      role: UserRole.fleet_manager,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem('transitops_token', res.accessToken);
        localStorage.setItem('transitops_user', JSON.stringify(res.user));
        setLocation('/dashboard');
      },
      onError: (error) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    });
  };

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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clearance Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.fleet_manager}>Fleet Manager</SelectItem>
                        <SelectItem value={UserRole.dispatcher}>Dispatcher</SelectItem>
                        <SelectItem value={UserRole.safety_officer}>Safety Officer</SelectItem>
                        <SelectItem value={UserRole.financial_analyst}>Financial Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </Form>

          <div className="p-4 bg-muted/50 rounded-md border border-border text-sm text-muted-foreground font-mono space-y-1">
            <p className="mb-2 text-foreground font-medium">Demo Accounts:</p>
            <p><span className="text-primary">fleet@transitops.io</span> — Fleet Manager</p>
            <p><span className="text-primary">dispatch@transitops.io</span> — Dispatcher</p>
            <p><span className="text-primary">safety@transitops.io</span> — Safety Officer</p>
            <p><span className="text-primary">finance@transitops.io</span> — Financial Analyst</p>
            <p className="mt-2 text-xs opacity-60">All accounts: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
