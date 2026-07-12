import { useState } from "react";
import { Loader2, Route as RouteIcon, MapPin, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListTrips, 
  useCreateTrip, 
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
  useListAvailableVehicles,
  useListAvailableDrivers,
  getListTripsQueryKey, 
  getListAvailableVehiclesQueryKey,
  getListAvailableDriversQueryKey,
  TripStatus 
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatDateTime } from "@/lib/utils";

const tripSchema = z.object({
  sourceLocation: z.string().min(1, "Source required"),
  destinationLocation: z.string().min(1, "Destination required"),
  vehicleId: z.coerce.number().min(1, "Vehicle required"),
  driverId: z.coerce.number().min(1, "Driver required"),
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completeTripId, setCompleteTripId] = useState<number | null>(null);

  const { data: trips, isLoading: tripsLoading } = useListTrips();
  const { data: vehicles } = useListAvailableVehicles();
  const { data: drivers } = useListAvailableDrivers();

  const createTrip = useCreateTrip();
  const dispatchTrip = useDispatchTrip();
  const completeTrip = useCompleteTrip();
  const cancelTrip = useCancelTrip();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: { cargoWeightKg: 0, plannedDistanceKm: 0 }
  });

  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { actualDistanceKm: 0, finalOdometerKm: 0 }
  });

  // Watch selected vehicle to validate capacity
  const selectedVehicleId = form.watch("vehicleId");
  const cargoWeight = form.watch("cargoWeightKg");
  
  const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);
  const isOverweight = selectedVehicle && cargoWeight > selectedVehicle.maxLoadCapacityKg;

  const onSubmit = (data: TripFormValues) => {
    if (isOverweight) {
      toast({ title: "Validation Error", description: "Cargo exceeds vehicle capacity", variant: "destructive" });
      return;
    }

    createTrip.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAvailableVehiclesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAvailableDriversQueryKey() });
        form.reset();
        toast({ title: "Trip created", description: "Trip draft saved successfully." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDispatch = (id: number) => {
    dispatchTrip.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        toast({ title: "Trip dispatched" });
      }
    });
  };

  const handleCancel = (id: number) => {
    if(!confirm("Are you sure you want to cancel this trip?")) return;
    cancelTrip.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        toast({ title: "Trip cancelled" });
      }
    });
  };

  const onCompleteSubmit = (data: CompleteFormValues) => {
    if (!completeTripId) return;
    completeTrip.mutate({ id: completeTripId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        setCompleteTripId(null);
        completeForm.reset();
        toast({ title: "Trip completed" });
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      
      {/* Dispatcher Form */}
      <div className="lg:col-span-4 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispatcher</h2>
          <p className="text-muted-foreground">Assign and route deployments.</p>
        </div>

        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg">Create Deployment</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4 p-4 bg-muted/30 rounded-md border border-border/50">
                  <FormField
                    control={form.control}
                    name="sourceLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl><Input placeholder="Warehouse A" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-center -my-2 text-muted-foreground"><MapPin className="h-4 w-4" /></div>
                  <FormField
                    control={form.control}
                    name="destinationLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl><Input placeholder="Client Site B" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Vehicle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vehicles?.map(v => (
                            <SelectItem key={v.id} value={v.id.toString()}>
                              {v.registrationNumber} - {v.vehicleName} ({formatNumber(v.maxLoadCapacityKg)}kg limit)
                            </SelectItem>
                          ))}
                          {!vehicles?.length && <SelectItem value="none" disabled>No vehicles available</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Operator</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {drivers?.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>
                              {d.fullName} (Score: {d.safetyScore})
                            </SelectItem>
                          ))}
                          {!drivers?.length && <SelectItem value="none" disabled>No drivers available</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cargoWeightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isOverweight ? "text-destructive" : ""}>Cargo Weight (KG)</FormLabel>
                        <FormControl><Input type="number" className={isOverweight ? "border-destructive focus-visible:ring-destructive" : ""} {...field} /></FormControl>
                        {isOverweight && <p className="text-[0.8rem] font-medium text-destructive">Exceeds {formatNumber(selectedVehicle?.maxLoadCapacityKg || 0)}kg limit</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plannedDistanceKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Distance (KM)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={createTrip.isPending || isOverweight}>
                  {createTrip.isPending ? "Creating..." : "Save Draft"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Live Board */}
      <div className="lg:col-span-8">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Deployment Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            {tripsLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !trips?.length ? (
              <div className="p-8 text-center text-muted-foreground">No trips recorded.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {trips.map(trip => (
                  <div key={trip.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-primary">TRP-{trip.id.toString().padStart(4, '0')}</span>
                          <Badge variant={trip.status as any}>{trip.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{trip.sourceLocation}</span>
                          <RouteIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{trip.destinationLocation}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground space-y-1">
                        <div>Veh: <span className="font-mono text-foreground">{trip.registrationNumber}</span></div>
                        <div>Opr: <span className="text-foreground">{trip.driverName}</span></div>
                        <div>Dist: <span className="font-mono text-foreground">{formatNumber(trip.plannedDistanceKm)} KM</span></div>
                      </div>
                    </div>
                    
                    {/* Actions based on state */}
                    <div className="flex gap-2 justify-end pt-4 border-t border-border/30">
                      {trip.status === TripStatus.draft && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleCancel(trip.id)} disabled={cancelTrip.isPending}>Cancel</Button>
                          <Button size="sm" onClick={() => handleDispatch(trip.id)} disabled={dispatchTrip.isPending}>Dispatch Now</Button>
                        </>
                      )}
                      {trip.status === TripStatus.dispatched && (
                        <>
                           <div className="flex-1 flex items-center text-xs text-blue-500">
                             Dispatched: {formatDateTime(trip.dispatchedAt)}
                           </div>
                           <Button size="sm" variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500/10" onClick={() => setCompleteTripId(trip.id)}>
                             Log Completion
                           </Button>
                        </>
                      )}
                      {(trip.status === TripStatus.completed || trip.status === TripStatus.cancelled) && (
                        <div className="flex-1 text-xs text-muted-foreground text-right">
                          {trip.status === TripStatus.completed ? `Completed: ${formatDateTime(trip.completedAt)} | Act. Dist: ${trip.actualDistanceKm} KM` : `Cancelled: ${formatDateTime(trip.cancelledAt)}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Trip Dialog */}
      <Dialog open={!!completeTripId} onOpenChange={(open) => !open && setCompleteTripId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Deployment</DialogTitle>
          </DialogHeader>
          <Form {...completeForm}>
            <form onSubmit={completeForm.handleSubmit(onCompleteSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={completeForm.control}
                  name="actualDistanceKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Distance (KM)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={completeForm.control}
                  name="finalOdometerKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Odometer</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={completeForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operational Notes</FormLabel>
                    <FormControl><Input placeholder="Optional remarks..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-4" disabled={completeTrip.isPending}>
                Record Completion
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
