import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PaginationControls, usePagination } from "@/components/pagination-controls";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const mntSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  title: z.string().min(1, "Description required"),
  maintenanceType: z.string().min(1, "Service type required"),
  cost: z.coerce.number().min(0),
  vendor: z.string().optional(),
  date: z.string().optional(),
});

type MntFormValues = z.infer<typeof mntSchema>;

export default function Maintenance() {
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);
  const { toast } = useToast();

  const { currentItems, totalPages, currentPage, setCurrentPage } = usePagination(records, 10);


  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/maintenance"),
      apiFetch("/vehicles"),
    ]).then(([mnt, veh]) => {
      setRecords(Array.isArray(mnt.data) ? mnt.data : []);
      // Filter out RETIRED vehicles from selector
      const all = Array.isArray(veh.data) ? veh.data : [];
      setVehicles(all.filter((v: any) => (v.status ?? "").toUpperCase() !== "RETIRED"));
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const form = useForm<MntFormValues>({
    resolver: zodResolver(mntSchema),
    defaultValues: { cost: 0, date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: MntFormValues) => {
    const res = await apiFetch("/maintenance", {
      method: "POST",
      body: JSON.stringify({
        vehicleId: data.vehicleId,
        title: data.title,
        maintenanceType: data.maintenanceType,
        cost: data.cost,
        vendor: data.vendor,
      }),
    });
    if (res.success) {
      toast({ title: "Service logged", description: "Vehicle is now In Shop." });
      form.reset({ cost: 0, date: new Date().toISOString().split("T")[0] });
      fetchData();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  const handleResolve = async (id: string) => {
    setClosing(id);
    const res = await apiFetch(`/maintenance/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ actualCost: 0 }),
    });
    setClosing(null);
    if (res.success) {
      toast({ title: "Record closed", description: "Vehicle returned to Available." });
      fetchData();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    const s = (status ?? "PENDING").toUpperCase();
    if (s === "COMPLETED") return "completed";
    if (s === "IN_PROGRESS") return "dispatched";
    return "in_shop";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Maintenance</h2>
        <p className="text-muted-foreground">Log repairs and track service records.</p>
      </div>

      {/* Split layout: form left, log right — matches wireframe */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* ── Left: Log Service Form ── */}
        <Card className="lg:col-span-4">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base">Log Service Record</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="vehicleId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.registrationNumber} — {v.model ?? v.vehicleName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="maintenanceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Oil Change, Repair..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Oil Change">Oil Change</SelectItem>
                        <SelectItem value="Engine Repair">Engine Repair</SelectItem>
                        <SelectItem value="Tyre Replace">Tyre Replace</SelectItem>
                        <SelectItem value="Brake Service">Brake Service</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Body Work">Body Work</SelectItem>
                        <SelectItem value="Routine Inspection">Routine Inspection</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Issue</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe the issue or work..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (₹)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="vendor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status / Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder="Workshop name or 'Internal'" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>

                {/* Status transition note — matches wireframe */}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">Available</span>
                    <span>── logging repair ──▶</span>
                    <span className="text-amber-500">In Shop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">In Shop</span>
                    <span>── mark resolved ──▶</span>
                    <span className="text-green-500">Available</span>
                  </div>
                  <p className="text-amber-500/80 mt-1">Note: In Shop vehicles are removed from the dispatch pool.</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* ── Right: Service Log Table ── */}
        <Card className="lg:col-span-8">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base">Service Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !records.length ? (
              <div className="p-8 text-center text-muted-foreground">No maintenance records yet.</div>
            ) : (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((r) => {
                    const reg = r.registrationNumber ?? r.vehicle?.registrationNumber ?? "—";
                    const model = r.vehicle?.model ?? r.vehicleName ?? "";
                    const status = (r.status ?? "PENDING").toUpperCase();
                    const cost = r.actualCost ?? r.estimatedCost ?? r.cost ?? 0;
                    const isOpen = status === "PENDING" || status === "IN_PROGRESS";
                    const serviceType = r.description ?? r.maintenanceType ?? r.title ?? "—";
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-mono font-bold text-primary">{reg}</div>
                          <div className="text-xs text-muted-foreground">{model}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{serviceType}</div>
                          <div className="text-xs text-muted-foreground">{r.title !== serviceType ? r.title : ""}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(cost)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge(status) as any}>{status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isOpen && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(r.id)}
                              disabled={closing === r.id}
                            >
                              {closing === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resolve"}
                            </Button>
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
      </div>
    </div>
  );
}
