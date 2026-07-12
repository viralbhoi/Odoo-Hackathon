import { useState } from "react";
import { Wrench, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListMaintenance, 
  useCreateMaintenance, 
  useCloseMaintenance,
  useListVehicles,
  getListMaintenanceQueryKey,
  MaintenanceStatus
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";

const mntSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Vehicle required"),
  title: z.string().min(1, "Title required"),
  maintenanceType: z.string().min(1, "Type required"),
  startDate: z.string().min(1, "Start date required"),
  cost: z.coerce.number().min(0, "Cost required"),
  vendor: z.string().optional()
});

type MntFormValues = z.infer<typeof mntSchema>;

export default function Maintenance() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useListMaintenance();
  const { data: vehicles } = useListVehicles();
  
  const createMnt = useCreateMaintenance();
  const closeMnt = useCloseMaintenance();

  const form = useForm<MntFormValues>({
    resolver: zodResolver(mntSchema),
    defaultValues: { cost: 0, startDate: new Date().toISOString().split('T')[0] }
  });

  const onSubmit = (data: MntFormValues) => {
    createMnt.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaintenanceQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "Maintenance logged" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleClose = (id: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    closeMnt.mutate({ id, data: { endDate } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaintenanceQueryKey() });
        toast({ title: "Record closed", description: "Vehicle returned to service" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Logs</h2>
          <p className="text-muted-foreground">Track repairs, servicing, and shop times.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Log Repair
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Maintenance Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vehicles?.map(v => (
                            <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNumber} - {v.vehicleName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description / Issue</FormLabel>
                      <FormControl><Input placeholder="Brake pad replacement" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maintenanceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Cost</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop / Vendor</FormLabel>
                        <FormControl><Input placeholder="Internal or external" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-4" disabled={createMnt.isPending}>
                  {createMnt.isPending ? "Logging..." : "Create Record"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !records?.length ? (
            <div className="p-8 text-center text-muted-foreground">No maintenance records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-mono text-primary font-medium">{r.registrationNumber}</div>
                      <div className="text-xs text-muted-foreground">{r.vehicleName}</div>
                    </TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="capitalize text-xs">{r.maintenanceType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      Start: {formatDate(r.startDate)}<br/>
                      {r.endDate && `End: ${formatDate(r.endDate)}`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(r.cost)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === MaintenanceStatus.open ? "in_shop" : "completed" as any}>
                        {r.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === MaintenanceStatus.open && (
                        <Button variant="outline" size="sm" onClick={() => handleClose(r.id)} disabled={closeMnt.isPending}>
                          Mark Resolved
                        </Button>
                      )}
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
