import { useState } from "react";
import { Plus, Search, ShieldAlert, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useListDrivers, useCreateDriver, useUpdateDriverStatus, getListDriversQueryKey, DriverStatus } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";

const driverSchema = z.object({
  fullName: z.string().min(1, "Name required"),
  licenseNumber: z.string().min(1, "License required"),
  licenseCategory: z.string().min(1, "Category required"),
  licenseExpiryDate: z.string().min(1, "Expiry date required"),
  contactNumber: z.string().min(1, "Contact required"),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drivers, isLoading } = useListDrivers({ search: searchTerm || undefined });
  const createDriver = useCreateDriver();
  const updateStatus = useUpdateDriverStatus();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { safetyScore: 100 }
  });

  const onSubmit = (data: DriverFormValues) => {
    createDriver.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "Driver added" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleStatusToggle = (id: number, currentStatus: DriverStatus) => {
    const newStatus = currentStatus === DriverStatus.available ? DriverStatus.off_duty : DriverStatus.available;
    // Only toggle between available and off_duty manually
    if (currentStatus !== DriverStatus.available && currentStatus !== DriverStatus.off_duty) return;
    
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
        toast({ title: "Status updated" });
      }
    });
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Personnel</h2>
          <p className="text-muted-foreground">Manage operators, licenses, and safety compliance.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Personnel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Operator</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl><Input placeholder="DL-12345" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="licenseCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Class A">Class A</SelectItem>
                            <SelectItem value="Class B">Class B</SelectItem>
                            <SelectItem value="Class C">Class C</SelectItem>
                            <SelectItem value="CDL">CDL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="licenseExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <FormControl><Input placeholder="+1..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-4" disabled={createDriver.isPending}>
                  {createDriver.isPending ? "Registering..." : "Register Driver"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or license..."
              className="pl-9 bg-muted/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !drivers?.length ? (
            <div className="p-8 text-center text-muted-foreground">No drivers found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Safety Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => {
                  const expired = isExpired(d.licenseExpiryDate);
                  const canToggle = d.status === DriverStatus.available || d.status === DriverStatus.off_duty;
                  
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {d.fullName}
                          {expired && <ShieldAlert className="h-4 w-4 text-destructive" title="License Expired" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{d.licenseNumber}</div>
                        <div className={cn("text-xs", expired ? "text-destructive" : "text-muted-foreground")}>
                          Exp: {formatDate(d.licenseExpiryDate)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{d.contactNumber}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-mono font-bold",
                          d.safetyScore >= 90 ? "text-green-500" : d.safetyScore >= 70 ? "text-amber-500" : "text-destructive"
                        )}>
                          {d.safetyScore}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.status as any}>{d.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canToggle && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusToggle(d.id, d.status)}
                            disabled={updateStatus.isPending}
                          >
                            Set {d.status === DriverStatus.available ? 'Off Duty' : 'Available'}
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
    </div>
  );
}
