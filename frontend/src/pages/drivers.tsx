import { useEffect, useState } from "react";
import { Plus, Search, ShieldAlert, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";
import { PaginationControls, usePagination } from "@/components/pagination-controls";


import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const driverSchema = z.object({
  fullName: z.string().min(1, "Name required"),
  licenseNumber: z.string().min(1, "License required"),
  licenseCategory: z.enum(["LMV", "HMV", "TRANSPORT"]),
  licenseExpiry: z.string().min(1, "Expiry date required"),
  phone: z.string().min(1, "Contact required"),
  email: z.string().email().optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

// Statuses a manager can manually set (ON_TRIP is system-set by dispatch)
const TOGGLEABLE_STATUSES = ["AVAILABLE", "OFF_DUTY", "SUSPENDED"];

export default function Drivers() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDrivers = () => {
    setLoading(true);
    apiFetch("/drivers").then((r) => {
      setDrivers(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchDrivers(); }, []);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { safetyScore: 100 },
  });

  const onSubmit = async (data: DriverFormValues) => {
    const res = await apiFetch("/drivers", {
      method: "POST",
      body: JSON.stringify({
        fullName: data.fullName,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiry: new Date(data.licenseExpiry).toISOString(),
        phone: data.phone,
        email: data.email || undefined,
        emergencyContact: data.emergencyContact || undefined,
        safetyScore: data.safetyScore ?? 100,
      }),
    });
    if (res.success) {
      toast({ title: "Driver registered" });
      setIsAddOpen(false);
      form.reset();
      fetchDrivers();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setToggling(id);
    const res = await apiFetch(`/drivers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    setToggling(null);
    if (res.success) {
      toast({ title: "Status updated", description: `Driver set to ${newStatus.replace("_", " ")}` });
      fetchDrivers();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  const filtered = drivers.filter((d) => {
    const s = search.toLowerCase();
    return (
      !search ||
      (d.fullName ?? "").toLowerCase().includes(s) ||
      (d.licenseNumber ?? "").toLowerCase().includes(s)
    );
  });

  const { currentItems, totalPages, currentPage, setCurrentPage } = usePagination(filtered, 10);


  // Count completed trips per driver from status (approximation; real count needs backend join)
  const tripCount = (d: any) => d.tripCount ?? d._count?.trips ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Personnel</h2>
          <p className="text-muted-foreground">Manage operators, licenses, and safety compliance.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Driver</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Operator</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Rajesh Kumar" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl><Input placeholder="DL-88213" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="licenseCategory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="LMV">LMV</SelectItem>
                          <SelectItem value="HMV">HMV</SelectItem>
                          <SelectItem value="TRANSPORT">Transport</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="licenseExpiry" render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Expiry</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="98765xxxxx" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="safetyScore" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safety Score (0–100)</FormLabel>
                      <FormControl><Input type="number" max={100} min={0} {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Registering..." : "Register Driver"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or license..."
                className="pl-9 bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <div className="p-8 text-center text-muted-foreground">
              {drivers.length ? "No drivers match search." : "No drivers registered."}
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Trip Compl.</TableHead>
                  <TableHead className="text-center">Safety</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Toggle Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((d) => {
                  const status = (d.status ?? "AVAILABLE").toUpperCase();
                  const expired = isExpired(d.licenseExpiry ?? d.licenseExpiryDate ?? "");
                  const canToggle = status !== "ON_TRIP"; // ON_TRIP is system-set
                  const otherStatuses = TOGGLEABLE_STATUSES.filter((s) => s !== status);

                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {d.fullName}
                          {expired && <ShieldAlert className="h-4 w-4 text-destructive" aria-label="License Expired!" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                      <TableCell className="text-sm">{d.licenseCategory ?? "—"}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-mono", expired ? "text-destructive font-bold" : "text-muted-foreground")}>
                          {formatDate(d.licenseExpiry ?? d.licenseExpiryDate ?? "")}
                          {expired && " EXPIRED"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.phone ?? d.contactNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-muted-foreground">
                        {tripCount(d)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          (d.safetyScore ?? 100) >= 90 ? "text-green-500" :
                          (d.safetyScore ?? 100) >= 70 ? "text-amber-500" : "text-destructive"
                        )}>
                          {d.safetyScore ?? 100}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.toLowerCase().replace("_", "-") as any}>
                          {status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canToggle ? (
                          <div className="flex gap-1 justify-end flex-wrap">
                            {otherStatuses.map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2"
                                disabled={toggling === d.id}
                                onClick={() => handleStatusChange(d.id, s)}
                              >
                                {toggling === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : s.replace("_", " ")}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-blue-500 font-mono">On Trip</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
          )}
        </CardContent>
      </Card>

      {/* Business rule note — matches wireframe */}
      <p className="text-xs text-amber-500 font-mono">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </p>
    </div>
  );
}
