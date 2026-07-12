import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListFuelLogs, 
  useListExpenses,
  useCreateFuelLog,
  useCreateExpense,
  useListVehicles,
  getListFuelLogsQueryKey,
  getListExpensesQueryKey,
  ExpenseType
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";

const fuelSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Vehicle required"),
  date: z.string().min(1, "Date required"),
  liters: z.coerce.number().min(0.1, "Liters required"),
  cost: z.coerce.number().min(0, "Cost required"),
  odometerReadingKm: z.coerce.number().min(0).optional(),
  fuelStation: z.string().optional()
});

const expenseSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Vehicle required"),
  expenseType: z.nativeEnum(ExpenseType),
  amount: z.coerce.number().min(0, "Amount required"),
  date: z.string().min(1, "Date required"),
  description: z.string().optional()
});

export default function FuelExpenses() {
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles } = useListVehicles();
  const { data: fuelLogs, isLoading: fuelLoading } = useListFuelLogs();
  const { data: expenses, isLoading: expLoading } = useListExpenses();

  const createFuel = useCreateFuelLog();
  const createExp = useCreateExpense();

  const fuelForm = useForm({
    resolver: zodResolver(fuelSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], liters: 0, cost: 0 }
  });

  const expForm = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], amount: 0, expenseType: ExpenseType.toll }
  });

  const onFuelSubmit = (data: any) => {
    createFuel.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFuelLogsQueryKey() });
        setFuelOpen(false);
        fuelForm.reset();
        toast({ title: "Fuel log added" });
      }
    });
  };

  const onExpSubmit = (data: any) => {
    createExp.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        setExpenseOpen(false);
        expForm.reset();
        toast({ title: "Expense logged" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Ledgers</h2>
        <p className="text-muted-foreground">Monitor fuel consumption and operational expenses.</p>
      </div>

      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
          <TabsTrigger value="expenses">Other Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2"/> Log Fuel</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Refuel</DialogTitle></DialogHeader>
                <Form {...fuelForm}>
                  <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)} className="space-y-4">
                    <FormField control={fuelForm.control} name="vehicleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {vehicles?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNumber}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={fuelForm.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field}/></FormControl></FormItem>
                      )} />
                      <FormField control={fuelForm.control} name="odometerReadingKm" render={({ field }) => (
                        <FormItem><FormLabel>Odometer (KM)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={fuelForm.control} name="liters" render={({ field }) => (
                        <FormItem><FormLabel>Liters</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl></FormItem>
                      )} />
                      <FormField control={fuelForm.control} name="cost" render={({ field }) => (
                        <FormItem><FormLabel>Total Cost</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={fuelForm.control} name="fuelStation" render={({ field }) => (
                      <FormItem><FormLabel>Station / Location</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createFuel.isPending}>Save Record</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {fuelLoading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div> :
               !fuelLogs?.length ? <div className="p-8 text-center text-muted-foreground">No fuel records.</div> :
               <Table>
                 <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead>Station</TableHead><TableHead className="text-right">Liters</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {fuelLogs.map(l => (
                     <TableRow key={l.id}>
                       <TableCell className="font-mono text-muted-foreground">{formatDate(l.date)}</TableCell>
                       <TableCell className="font-medium text-primary">{l.registrationNumber}</TableCell>
                       <TableCell>{l.fuelStation || '-'}</TableCell>
                       <TableCell className="text-right font-mono">{formatNumber(l.liters)} L</TableCell>
                       <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(l.cost)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2"/> Log Expense</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                <Form {...expForm}>
                  <form onSubmit={expForm.handleSubmit(onExpSubmit)} className="space-y-4">
                    <FormField control={expForm.control} name="vehicleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {vehicles?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNumber}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={expForm.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field}/></FormControl></FormItem>
                      )} />
                      <FormField control={expForm.control} name="expenseType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value={ExpenseType.toll}>Toll</SelectItem>
                              <SelectItem value={ExpenseType.maintenance}>Maintenance</SelectItem>
                              <SelectItem value={ExpenseType.fuel}>Fuel</SelectItem>
                              <SelectItem value={ExpenseType.other}>Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={expForm.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl></FormItem>
                    )} />
                    <FormField control={expForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createExp.isPending}>Save Expense</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {expLoading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div> :
               !expenses?.length ? <div className="p-8 text-center text-muted-foreground">No expenses recorded.</div> :
               <Table>
                 <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Vehicle</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {expenses.map(e => (
                     <TableRow key={e.id}>
                       <TableCell className="font-mono text-muted-foreground">{formatDate(e.date)}</TableCell>
                       <TableCell className="capitalize">{e.expenseType}</TableCell>
                       <TableCell className="font-medium">{e.registrationNumber || 'Fleet General'}</TableCell>
                       <TableCell className="text-xs text-muted-foreground">{e.description || '-'}</TableCell>
                       <TableCell className="text-right font-mono text-destructive">{formatCurrency(e.amount)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
