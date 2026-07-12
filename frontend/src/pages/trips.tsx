import { useEffect, useState } from "react";
import { Loader2, Route as RouteIcon, MapPin, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PaginationControls, usePagination } from "@/components/pagination-controls";
import { useAuth, canDispatchTrips } from "@/context/auth-context";

import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatDateTime } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

// Trip create schema — maps frontend field names to what the backend expects
const tripSchema = z.object({
  sourceLocation: z.string().min(1, "Source required"),
  destinationLocation: z.string().min(1, "Destination required"),
  vehicleId: z.string().min(1, "Vehicle required"),
  driverId: z.string().min(1, "Driver required"),
  cargoWeightKg: z.coerce.number().min(0, "Invalid weight"),
  plannedDistanceKm: z.coerce.number().min(0.1, "Distance must be > 0"),
});

const completeSchema = z.object({
  actualDistanceKm: z.coerce.number().min(0),
  finalOdometerKm: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripSchema>;
type CompleteFormValues = z.infer<typeof completeSchema>;

export default function Trips() {
  const { user } = useAuth();
  const canDispatch = canDispatchTrips(user?.role);
  const { toast } = useToast();
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [completeTripId, setCompleteTripId] = useState<string | null>(null);

  const { currentItems, totalPages, currentPage, setCurrentPage } = usePagination(trips, 5);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = () => {
    setTripsLoading(true);
    Promise.all([
      apiFetch("/trips"),
      apiFetch("/vehicles/available"),
      apiFetch("/drivers/available"),
    ]).then(([t, v, d]) => {
      setTrips(Array.isArray(t.data) ? t.data : []);
      setVehicles(Array.isArray(v.data) ? v.data : []);
      setDrivers(Array.isArray(d.data) ? d.data : []);
      setTripsLoading(false);
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: { cargoWeightKg: 0, plannedDistanceKm: 0 },
  });

  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { actualDistanceKm: 0, finalOdometerKm: 0 },
  });

  const selectedVehicleId = form.watch("vehicleId");
  const cargoWeight = form.watch("cargoWeightKg");
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const maxCap = selectedVehicle?.maxLoadCapacity ?? selectedVehicle?.maxLoadCapacityKg ?? 0;
  const isOverweight = maxCap > 0 && cargoWeight > maxCap;

  const onSubmit = async (data: TripFormValues) => {
    if (isOverweight) {
      toast({ title: "Validation Error", description: "Cargo exceeds vehicle capacity", variant: "destructive" });
      return;
    }
    const res = await apiFetch("/trips", {
      method: "POST",
      body: JSON.stringify({
        source: data.sourceLocation,
        destination: data.destinationLocation,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        cargoWeight: data.cargoWeightKg,
        plannedDistance: data.plannedDistanceKm,
      }),
    });
    if (res.success) {
      toast({ title: "Trip created", description: "Draft saved. Ready to dispatch." });
      form.reset();
      fetchAll();
    } else {
      toast({ title: "Error", description: res.message || "Failed to create trip", variant: "destructive" });
    }
  };

  const handleDispatch = async (id: string) => {
    setActionLoading(id);
    const res = await apiFetch(`/trips/${id}/dispatch`, { method: "PATCH" });
    setActionLoading(null);
    if (res.success) {
      toast({ title: "Trip dispatched", description: "Vehicle and driver are now On Trip." });
      fetchAll();
    } else {
      toast({ title: "Error", description: res.message || "Dispatch failed", variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this trip?")) return;
    setActionLoading(id);
    const res = await apiFetch(`/trips/${id}/cancel`, { method: "PATCH" });
    setActionLoading(null);
    if (res.success) {
      toast({ title: "Trip cancelled" });
      fetchAll();
    } else {
      toast({ title: "Error", description: res.message || "Cancel failed", variant: "destructive" });
    }
  };

  const onCompleteSubmit = async (data: CompleteFormValues) => {
    if (!completeTripId) return;
    const res = await apiFetch(`/trips/${completeTripId}/complete`, {
      method: "PATCH",
      body: JSON.stringify({
        actualDistance: data.actualDistanceKm,
        endedOdometer: data.finalOdometerKm,
        notes: data.notes,
      }),
    });
    if (res.success) {
      toast({ title: "Trip completed", description: "Vehicle and driver are now Available." });
      setCompleteTripId(null);
      completeForm.reset();
      fetchAll();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Trip Lifecycle Stepper — matches wireframe ── */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dispatcher</h2>
        <p className="text-muted-foreground">Assign and route deployments.</p>
      </div>

      <div className="flex items-center gap-0 bg-card border border-border/50 rounded-lg p-4 overflow-x-auto">
        {[
          { label: "Draft", key: "DRAFT", color: "text-muted-foreground", dot: "bg-muted-foreground" },
          { label: "Dispatched", key: "DISPATCHED", color: "text-blue-400", dot: "bg-blue-400" },
          { label: "Completed", key: "COMPLETED", color: "text-green-400", dot: "bg-green-400" },
          { label: "Cancelled", key: "CANCELLED", color: "text-destructive", dot: "bg-destructive" },
        ].map((step, i, arr) => {
          const counts = {
            DRAFT: trips.filter(t => (t.status ?? "").toUpperCase() === "DRAFT").length,
            DISPATCHED: trips.filter(t => (t.status ?? "").toUpperCase() === "DISPATCHED").length,
            COMPLETED: trips.filter(t => (t.status ?? "").toUpperCase() === "COMPLETED").length,
            CANCELLED: trips.filter(t => (t.status ?? "").toUpperCase() === "CANCELLED").length,
          };
          const count = counts[step.key as keyof typeof counts] ?? 0;
          const isLast = i === arr.length - 1;
          return (
            <div key={step.key} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1 px-4">
                <div className={`w-3 h-3 rounded-full ${step.dot}`} />
                <span className={`text-sm font-semibold font-mono ${step.color}`}>{step.label}</span>
                <span className="text-xs text-muted-foreground">{count} trip{count !== 1 ? "s" : ""}</span>
              </div>
              {!isLast && (
                <div className="h-px w-12 bg-border/60 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Dispatcher Form — only visible to ADMIN/FLEET_MANAGER */}
        {canDispatch && (
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg">Create Deployment</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4 p-4 bg-muted/30 rounded-md border border-border/50">
                  <FormField control={form.control} name="sourceLocation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl><Input placeholder="Warehouse A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-center -my-2 text-muted-foreground"><MapPin className="h-4 w-4" /></div>
                  <FormField control={form.control} name="destinationLocation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl><Input placeholder="Client Site B" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="vehicleId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.registrationNumber} — {v.model ?? v.vehicleName} ({formatNumber(v.maxLoadCapacity ?? v.maxLoadCapacityKg ?? 0)} kg)
                          </SelectItem>
                        ))}
                        {!vehicles.length && <SelectItem value="none" disabled>No vehicles available</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="driverId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Driver</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.fullName} (Score: {d.safetyScore})
                          </SelectItem>
                        ))}
                        {!drivers.length && <SelectItem value="none" disabled>No drivers available</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="cargoWeightKg" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isOverweight ? "text-destructive" : ""}>Cargo Weight (KG)</FormLabel>
                      <FormControl>
                        <Input type="number" className={isOverweight ? "border-destructive focus-visible:ring-destructive" : ""} {...field} />
                      </FormControl>
                      {isOverweight && <p className="text-[0.8rem] font-medium text-destructive">Exceeds {formatNumber(maxCap)} kg limit</p>}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="plannedDistanceKm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Est. Distance (KM)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting || isOverweight}>
                  {form.formState.isSubmitting ? "Creating..." : "Save Draft"}
                </Button>
              </form>
            </Form>
            </CardContent>
          </Card>
        </div>
        )} {/* end canDispatch form */}

        {/* Live Board */}
        <div className={canDispatch ? "lg:col-span-8" : "lg:col-span-12"}>
          <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Deployment Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            {tripsLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !trips.length ? (
              <div className="p-8 text-center text-muted-foreground">No trips recorded yet.</div>
            ) : (
              <>
              <div className="divide-y divide-border/50">
                {currentItems.map((trip) => {
                  const src = trip.source ?? trip.sourceLocation ?? "—";
                  const dst = trip.destination ?? trip.destinationLocation ?? "—";
                  const reg = trip.vehicle?.registrationNumber ?? trip.registrationNumber ?? "—";
                  const drv = trip.driver?.fullName ?? trip.driverName ?? "—";
                  const dist = trip.plannedDistance ?? trip.plannedDistanceKm ?? 0;
                  const status = (trip.status ?? "").toUpperCase();
                  return (
                    <div key={trip.id} className="p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-primary">TRP-{trip.id.toString().slice(-6).toUpperCase()}</span>
                            <Badge variant={status.toLowerCase() as any}>{status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{src}</span>
                            <RouteIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{dst}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground space-y-1">
                          <div>Veh: <span className="font-mono text-foreground">{reg}</span></div>
                          <div>Opr: <span className="text-foreground">{drv}</span></div>
                          <div>Dist: <span className="font-mono text-foreground">{formatNumber(dist)} KM</span></div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-border/30">
                        {canDispatch && status === "DRAFT" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleCancel(trip.id)} disabled={actionLoading === trip.id}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleDispatch(trip.id)} disabled={actionLoading === trip.id}>
                              {actionLoading === trip.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Dispatch Now"}
                            </Button>
                          </>
                        )}
                        {canDispatch && status === "DISPATCHED" && (
                          <>
                            <div className="flex-1 flex items-center text-xs text-blue-500">
                              Dispatched: {formatDateTime(trip.dispatchedAt)}
                            </div>
                            <Button size="sm" variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500/10" onClick={() => setCompleteTripId(trip.id)}>
                              Log Completion
                            </Button>
                          </>
                        )}
                        {(status === "COMPLETED" || status === "CANCELLED") && (
                          <div className="flex-1 text-xs text-muted-foreground text-right">
                            {status === "COMPLETED"
                              ? `Completed: ${formatDateTime(trip.completedAt)} | Act: ${trip.actualDistance ?? trip.actualDistanceKm ?? "—"} KM`
                              : `Cancelled`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>{/* end grid */}

      {/* Complete Dialog */}
      <Dialog open={!!completeTripId} onOpenChange={(open) => !open && setCompleteTripId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Deployment</DialogTitle></DialogHeader>
          <Form {...completeForm}>
            <form onSubmit={completeForm.handleSubmit(onCompleteSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={completeForm.control} name="actualDistanceKm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Distance (KM)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={completeForm.control} name="finalOdometerKm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Odometer (KM)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={completeForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Operational Notes</FormLabel>
                  <FormControl><Input placeholder="Optional remarks..." {...field} /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full mt-4" disabled={completeForm.formState.isSubmitting}>
                {completeForm.formState.isSubmitting ? "Saving..." : "Record Completion"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
