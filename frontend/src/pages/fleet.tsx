import { useState } from "react";
import { Plus, Search, Truck, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useListVehicles, useCreateVehicle, getListVehiclesQueryKey, VehicleStatus } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration required"),
  vehicleName: z.string().min(1, "Name required"),
  model: z.string().optional(),
  type: z.string().min(1, "Type required"),
  maxLoadCapacityKg: z.coerce.number().min(0.1, "Capacity must be > 0"),
  currentOdometerKm: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().min(0),
  region: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useListVehicles({
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const createVehicle = useCreateVehicle();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      currentOdometerKm: 0,
      acquisitionCost: 0,
      maxLoadCapacityKg: 0,
    },
  });

  const onSubmit = (data: VehicleFormValues) => {
    createVehicle.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "Vehicle added", description: "Successfully registered new vehicle." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fleet Registry</h2>
          <p className="text-muted-foreground">Manage vehicles, capacity, and operational status.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register New Vehicle</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reg Number</FormLabel>
                        <FormControl><Input placeholder="ABC-1234" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name/Identifier</FormLabel>
                        <FormControl><Input placeholder="Truck 01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="heavy_truck">Heavy Truck</SelectItem>
                            <SelectItem value="light_truck">Light Truck</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="refrigerated">Refrigerated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxLoadCapacityKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (KG)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentOdometerKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Odometer</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="acquisitionCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acquisition Cost</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-4" disabled={createVehicle.isPending}>
                  {createVehicle.isPending ? "Registering..." : "Register Vehicle"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search registration or name..."
                className="pl-9 bg-muted/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={VehicleStatus.available}>Available</SelectItem>
                <SelectItem value={VehicleStatus.on_trip}>On Trip</SelectItem>
                <SelectItem value={VehicleStatus.in_shop}>In Shop</SelectItem>
                <SelectItem value={VehicleStatus.retired}>Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !vehicles?.length ? (
            <div className="p-8 text-center text-muted-foreground">No vehicles found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg Number</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Capacity (KG)</TableHead>
                  <TableHead className="text-right">Odometer (KM)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium text-primary">{v.registrationNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{v.vehicleName}</div>
                      {v.model && <div className="text-xs text-muted-foreground">{v.model}</div>}
                    </TableCell>
                    <TableCell className="capitalize">{v.type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(v.maxLoadCapacityKg)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatNumber(v.currentOdometerKm)}</TableCell>
                    <TableCell>
                      <Badge variant={v.status as any}>{v.status.replace('_', ' ')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
