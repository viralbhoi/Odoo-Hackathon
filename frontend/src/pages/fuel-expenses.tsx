import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { PaginationControls, usePagination } from "@/components/pagination-controls";
import { useAuth, canManageFinancials } from "@/context/auth-context";


import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  date: z.string().min(1, "Date required"),
  liters: z.coerce.number().min(0.1, "Liters required"),
  cost: z.coerce.number().min(0.01, "Cost required"),
  odometerReadingKm: z.coerce.number().min(0).optional(),
  fuelStation: z.string().optional(),
});

const expenseSchema = z.object({
  vehicleId: z.string().optional(),
  expenseType: z.enum(["TOLL", "MAINTENANCE", "FUEL", "OTHER"]),
  amount: z.coerce.number().min(0.01, "Amount required"),
  date: z.string().min(1, "Date required"),
  description: z.string().optional(),
});

export default function FuelExpenses() {
  const { user } = useAuth();
  const canLog = canManageFinancials(user?.role);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fuelLoading, setFuelLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(true);
  const { toast } = useToast();

  const { currentItems: currentFuel, totalPages: totalFuelPages, currentPage: currentFuelPage, setCurrentPage: setFuelPage } = usePagination(fuelLogs, 10);
  const { currentItems: currentExpenses, totalPages: totalExpensePages, currentPage: currentExpensePage, setCurrentPage: setExpensePage } = usePagination(expenses, 10);


  const fetchFuel = () => {
    setFuelLoading(true);
    apiFetch("/fuel").then((r) => { setFuelLogs(Array.isArray(r.data) ? r.data : []); setFuelLoading(false); });
  };
  const fetchExpenses = () => {
    setExpLoading(true);
    apiFetch("/expenses").then((r) => { setExpenses(Array.isArray(r.data) ? r.data : []); setExpLoading(false); });
  };

  useEffect(() => {
    apiFetch("/vehicles").then((r) => setVehicles(Array.isArray(r.data) ? r.data : []));
    fetchFuel();
    fetchExpenses();
  }, []);

  const fuelForm = useForm<z.infer<typeof fuelSchema>>({
    resolver: zodResolver(fuelSchema),
    defaultValues: { date: new Date().toISOString().split("T")[0], liters: 0, cost: 0, vehicleId: "", odometerReadingKm: undefined, fuelStation: "" },
  });

  const expForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: new Date().toISOString().split("T")[0], amount: 0, expenseType: "TOLL" as const, vehicleId: "", description: "" },
  });

  const onFuelSubmit = async (data: z.infer<typeof fuelSchema>) => {
    const odometerVal = data.odometerReadingKm && data.odometerReadingKm > 0
      ? data.odometerReadingKm
      : undefined;           // backend will use vehicle.currentOdometer when undefined
    const res = await apiFetch("/fuel", {
      method: "POST",
      body: JSON.stringify({
        vehicleId: data.vehicleId,
        liters: data.liters,
        cost: data.cost,
        odometer: odometerVal,
        fuelStation: data.fuelStation,
        date: data.date,
      }),
    });
    if (res.success) {
      toast({ title: "Fuel log added" });
      setFuelOpen(false);
      fuelForm.reset();
      fetchFuel();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  const onExpSubmit = async (data: z.infer<typeof expenseSchema>) => {
    const res = await apiFetch("/expenses", {
      method: "POST",
      body: JSON.stringify({
        vehicleId: data.vehicleId || undefined,
        type: data.expenseType,         // backend expects 'type'
        expenseType: data.expenseType,  // alias fallback
        amount: data.amount,
        title: data.description || data.expenseType,    // backend expects 'title'
        description: data.description,
        date: data.date,
      }),
    });
    if (res.success) {
      toast({ title: "Expense logged" });
      setExpenseOpen(false);
      expForm.reset();
      fetchExpenses();
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
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

        {/* ── Fuel Tab ── */}
        <TabsContent value="fuel" className="mt-6">
          {canLog && (
          <div className="flex justify-end mb-4">
            <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Fuel</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Refuel</DialogTitle></DialogHeader>
                <Form {...fuelForm}>
                  <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)} className="space-y-4 py-2">
                    <FormField control={fuelForm.control} name="vehicleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber} — {v.model ?? v.vehicleName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={fuelForm.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={fuelForm.control} name="odometerReadingKm" render={({ field }) => (
                        <FormItem><FormLabel>Odometer (KM)</FormLabel><FormControl><Input type="number" value={field.value ?? ""} onChange={field.onChange} /></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={fuelForm.control} name="liters" render={({ field }) => (
                        <FormItem><FormLabel>Liters</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={fuelForm.control} name="cost" render={({ field }) => (
                        <FormItem><FormLabel>Total Cost (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={fuelForm.control} name="fuelStation" render={({ field }) => (
                      <FormItem><FormLabel>Station / Location</FormLabel><FormControl><Input placeholder="IOCL, HPCL..." {...field} /></FormControl></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={fuelForm.formState.isSubmitting}>Save Record</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          )}
          <Card>
            <CardContent className="p-0">
              {fuelLoading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                : !fuelLogs.length ? <div className="p-8 text-center text-muted-foreground">No fuel records yet.</div>
                : (
                  <>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead>Station</TableHead>
                      <TableHead className="text-right">Liters</TableHead><TableHead className="text-right">Cost</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {currentFuel.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-muted-foreground">{formatDate(l.createdAt ?? l.date)}</TableCell>
                          <TableCell className="font-medium text-primary">{l.registrationNumber ?? l.vehicle?.registrationNumber ?? "—"}</TableCell>
                          <TableCell>{l.fuelStation ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(l.liters)} L</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(l.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls currentPage={currentFuelPage} totalPages={totalFuelPages} onPageChange={setFuelPage} />
                </>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Expenses Tab ── */}
        <TabsContent value="expenses" className="mt-6">
          {canLog && (
          <div className="flex justify-end mb-4">
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Expense</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                <Form {...expForm}>
                  <form onSubmit={expForm.handleSubmit(onExpSubmit)} className="space-y-4 py-2">
                    <FormField control={expForm.control} name="vehicleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="">Fleet General</SelectItem>
                            {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={expForm.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={expForm.control} name="expenseType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="TOLL">Toll</SelectItem>
                              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                              <SelectItem value="FUEL">Fuel</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={expForm.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={expForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Optional notes..." {...field} /></FormControl></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={expForm.formState.isSubmitting}>Save Expense</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          )}
          <Card>
            <CardContent className="p-0">
              {expLoading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                : !expenses.length ? <div className="p-8 text-center text-muted-foreground">No expenses recorded.</div>
                : (
                  <>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Vehicle</TableHead>
                      <TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {currentExpenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-muted-foreground">{formatDate(e.createdAt ?? e.date)}</TableCell>
                          <TableCell className="capitalize">{(e.type ?? e.expenseType ?? "other").toLowerCase()}</TableCell>
                          <TableCell className="font-medium">{e.registrationNumber ?? e.vehicle?.registrationNumber ?? "Fleet General"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.title ?? e.description ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{formatCurrency(e.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls currentPage={currentExpensePage} totalPages={totalExpensePages} onPageChange={setExpensePage} />
                </>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Total Operational Cost — matches wireframe */}
      <div className="flex items-center justify-between border border-border/50 rounded-lg p-4 bg-muted/30">
        <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Total Operational Cost (AUTO) = Fuel + Expenses
        </div>
        <div className="text-xl font-bold font-mono text-amber-400">
          {formatCurrency(
            fuelLogs.reduce((s: number, l: any) => s + (l.cost ?? 0), 0) +
            expenses.reduce((s: number, e: any) => s + (e.amount ?? 0), 0)
          )}
        </div>
      </div>
    </div>
  );
}
