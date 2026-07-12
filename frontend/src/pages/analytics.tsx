import { Download, Loader2 } from "lucide-react";
import { 
  useGetFuelEfficiency, 
  useGetOperationalCost, 
  useGetVehicleRoi,
  useGetMonthlyFuelTrend,
  ExportCsvType
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function Analytics() {
  const { data: efficiency, isLoading: effLoading } = useGetFuelEfficiency();
  const { data: costs, isLoading: costLoading } = useGetOperationalCost();
  const { data: roi, isLoading: roiLoading } = useGetVehicleRoi();
  const { data: trends, isLoading: trendLoading } = useGetMonthlyFuelTrend();
  const isLoading = effLoading || costLoading || roiLoading || trendLoading;

  const handleExport = async (type: ExportCsvType) => {
    const token = localStorage.getItem('transitops_token');
    const res = await fetch(`/api/reports/export/csv?type=${encodeURIComponent(type)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transitops_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-muted-foreground">Financial intelligence and asset performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport(ExportCsvType.trips)}>
            <Download className="w-4 h-4 mr-2" /> Trips CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport(ExportCsvType["fuel-logs"])}>
            <Download className="w-4 h-4 mr-2" /> Financials CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="totalCost" name="Total Cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="fuelCost" name="Fuel" stroke="hsl(var(--blue-500))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Cost by Asset</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costs?.slice(0, 8) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="registrationNumber" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="totalCost" name="Total Cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset ROI Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Acquisition</TableHead>
                  <TableHead className="text-right">Net Return</TableHead>
                  <TableHead className="text-right">ROI %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roi?.map(r => {
                  const net = (r.totalRevenue || 0) - r.totalCost;
                  const isPositive = net >= 0;
                  return (
                    <TableRow key={r.vehicleId}>
                      <TableCell className="font-mono text-primary">{r.registrationNumber}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(r.acquisitionCost)}</TableCell>
                      <TableCell className={`text-right font-mono ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                        {formatCurrency(net)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                        {r.roiAvailable && r.roi !== null ? `${r.roi.toFixed(1)}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Efficiency Leaders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {efficiency?.sort((a,b) => b.efficiencyKmPerLiter - a.efficiencyKmPerLiter).map(e => (
                  <TableRow key={e.vehicleId}>
                    <TableCell className="font-mono text-primary">{e.registrationNumber}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatNumber(e.totalDistanceKm)} KM</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatNumber(e.totalLiters)} L</TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-500">{e.efficiencyKmPerLiter.toFixed(2)} KM/L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
