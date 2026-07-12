import { useEffect, useState } from "react";
import { Plus, Loader2, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth, canManageUsers } from "@/context/auth-context";
import { useLocation } from "wouter";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("transitops_token");
  return fetch(`/api/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers as Record<string, string>),
    },
  }).then((r) => r.json());
}

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

const userSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Guard: redirect non-admins away
  useEffect(() => {
    if (user && !canManageUsers(user.role)) {
      setLocation("/dashboard");
    }
  }, [user]);

  const fetchUsers = () => {
    setLoading(true);
    apiFetch("/users").then((r) => {
      setUsers(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "FLEET_MANAGER" },
  });

  const onSubmit = async (data: UserFormValues) => {
    const res = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success) {
      toast({
        title: "User created",
        description: `${data.name} added. Default password: transitops123`,
      });
      setIsAddOpen(false);
      form.reset();
      fetchUsers();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: string) => {
    setToggling(id);
    const res = await apiFetch(`/users/${id}/toggle-status`, { method: "PATCH" });
    setToggling(null);
    if (res.success) {
      toast({ title: "Status updated" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <UserCog className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          </div>
          <p className="text-muted-foreground">Manage dashboard access and roles for your team.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Dashboard User</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Priya Sharma" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="user@company.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin — Full access</SelectItem>
                        <SelectItem value="FLEET_MANAGER">Fleet Manager — Manage vehicles, drivers, trips</SelectItem>
                        <SelectItem value="SAFETY_OFFICER">Safety Officer — Driver safety & licenses</SelectItem>
                        <SelectItem value="FINANCIAL_ANALYST">Financial Analyst — Fuel & expenses</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-mono">
                  Default password: <strong>transitops123</strong> — User must change on first login.
                </div>

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Permission matrix summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className={`rounded-lg border p-3 text-xs font-mono ${ROLE_COLORS[role]}`}>
            <div className="font-bold mb-1">{label}</div>
            <div className="opacity-80 leading-relaxed">
              {role === "ADMIN" && "All permissions"}
              {role === "FLEET_MANAGER" && "Vehicles · Drivers · Trips · Maintenance"}
              {role === "SAFETY_OFFICER" && "Driver status · Safety scores"}
              {role === "FINANCIAL_ANALYST" && "Fuel logs · Expenses"}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !users.length ? (
            <div className="p-8 text-center text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground font-mono">(You)</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{u.email}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] ?? "bg-muted"}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "ACTIVE" ? "available" : "retired"}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={toggling === u.id}
                            onClick={() => handleToggleStatus(u.id)}
                          >
                            {toggling === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : u.status === "ACTIVE" ? (
                              <><ShieldOff className="h-3 w-3 mr-1" />Deactivate</>
                            ) : (
                              <><ShieldCheck className="h-3 w-3 mr-1" />Activate</>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-amber-500 font-mono">
        Rule: Only ADMIN users can access this page · Deactivated users cannot log in
      </p>
    </div>
  );
}
