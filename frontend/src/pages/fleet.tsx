import { useEffect, useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PaginationControls, usePagination } from "@/components/pagination-controls";
import { useAuth, canManageVehicles } from "@/context/auth-context";


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

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration required"),
  model: z.string().min(1, "Model/Name required"),
  type: z.enum(["TRUCK", "VAN", "PICKUP", "TRAILER", "BUS"]),
  maxLoadCapacity: z.coerce.number().min(0.1, "Capacity must be > 0"),
  currentOdometer: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().min(0),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

export default function Fleet() {
  const { user } = useAuth();
  const canAdd = canManageVehicles(user?.role);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchVehicles = () => {
    setLoading(true);
    apiFetch("/vehicles").then((r) => {
      setVehicles(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchVehicles(); }, []);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { currentOdometer: 0, acquisitionCost: 0, maxLoadCapacity: 0 },
  });

  const onSubmit = async (data: VehicleFormValues) => {
    const res = await apiFetch("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success) {
      toast({ title: "Vehicle registered", description: `${data.registrationNumber} added to fleet.` });
      setIsAddOpen(false);
      form.reset();
      fetchVehicles();
    } else {
      toast({ title: "Error", description: res.message || "Registration failed", variant: "destructive" });
    }
  };

  const updateVehicleStatus = async (id: string, status: string) => {
    setStatusUpdating(id);
    const res = await apiFetch(`/vehicles/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      toast({ title: "Status updated", description: `Vehicle marked as ${STATUS_LABELS[status] ?? status}` });
      fetchVehicles();
    } else {
      toast({ title: "Error", description: res.message || "Update failed", variant: "destructive" });
    }
    setStatusUpdating(null);
  };

  // Client-side filtering
  const filtered = vehicles.filter((v) => {
    const reg = (v.registrationNumber ?? "").toLowerCase();
    const model = (v.model ?? v.vehicleName ?? "").toLowerCase();
    const s = search.toLowerCase();
    const matchSearch = !search || reg.includes(s) || model.includes(s);
    const matchStatus = statusFilter === "all" || (v.status ?? "").toUpperCase() === statusFilter;
    const matchType = typeFilter === "all" || (v.type ?? "").toUpperCase() === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const { currentItems, totalPages, currentPage, setCurrentPage } = usePagination(filtered, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fleet Registry</h2>
          <p className="text-muted-foreground">Manage vehicles, capacity, and operational status.</p>
        </div>
        {canAdd && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>Register New Vehicle</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reg. Number (Unique)</FormLabel>
                      <FormControl><Input placeholder="GJ01AB1234" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model / Name</FormLabel>
                      <FormControl><Input placeholder="TATA 407" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="TRUCK">Truck</SelectItem>
                          <SelectItem value="VAN">Van</SelectItem>
                          <SelectItem value="PICKUP">Pickup</SelectItem>
                          <SelectItem value="TRAILER">Trailer</SelectItem>
                          <SelectItem value="BUS">Bus</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maxLoadCapacity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Load (KG)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="currentOdometer" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Odometer (KM)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="acquisitionCost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acquisition Cost (₹)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Registering..." : "Register Vehicle"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters row — matches wireframe */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Type: All</SelectItem>
                <SelectItem value="TRUCK">Truck</SelectItem>
                <SelectItem value="VAN">Van</SelectItem>
                <SelectItem value="PICKUP">Pickup</SelectItem>
                <SelectItem value="TRAILER">Trailer</SelectItem>
                <SelectItem value="BUS">Bus</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_TRIP">On Trip</SelectItem>
                <SelectItem value="IN_SHOP">In Shop</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reg. no. or model..."
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
              {vehicles.length ? "No vehicles match filters." : "No vehicles registered yet."}
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg. No. (Unique)</TableHead>
                  <TableHead>Name / Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead className="text-right">Acq. Cost</TableHead>
                  <TableHead>Status</TableHead>
                  {canAdd && <TableHead>Change Status</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((v) => {
                  const status = (v.status ?? "AVAILABLE").toUpperCase();
                  const model = v.model ?? v.vehicleName ?? "—";
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono font-bold text-primary">{v.registrationNumber}</TableCell>
                      <TableCell className="font-medium">{model}</TableCell>
                      <TableCell className="capitalize text-sm text-muted-foreground">{(v.type ?? "").toLowerCase()}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(v.maxLoadCapacity ?? v.maxLoadCapacityKg ?? 0)} kg
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {formatNumber(v.currentOdometer ?? v.currentOdometerKm ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {formatCurrency(v.acquisitionCost ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.toLowerCase().replace("_", "-") as any}>
                          {STATUS_LABELS[status] ?? status}
                        </Badge>
                      </TableCell>
                      {canAdd && (
                        <TableCell>
                          <Select
                            value={status}
                            onValueChange={(val) => updateVehicleStatus(v.id, val)}
                            disabled={statusUpdating === v.id || status === "ON_TRIP"}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">Available</SelectItem>
                              <SelectItem value="IN_SHOP">In Shop</SelectItem>
                              <SelectItem value="RETIRED">Retired</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
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

      {/* Business rules note — matches wireframe */}
      <p className="text-xs text-amber-500 font-mono">
        Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </p>
    </div>
  );
}
