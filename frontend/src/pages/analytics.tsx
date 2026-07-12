import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";

function apiFetch(path: string) {
  const token = localStorage.getItem("transitops_token");
  return fetch(`/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json()).then((j) => j.data ?? j);
}

async function downloadCsv(type: string) {
  const token = localStorage.getItem("transitops_token");
  const res = await fetch(`/api/v1/reports/export/csv?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const text = await res.text();
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transitops_${type}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const [efficiency, setEfficiency] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [roi, setRoi] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/reports/fuel-efficiency"),
      apiFetch("/reports/operational-cost"),
      apiFetch("/reports/vehicle-roi"),
      apiFetch("/reports/monthly-trend"),
      apiFetch("/dashboard"),
    ]).then(([eff, cost, roiData, trendData, dash]) => {
      setEfficiency(Array.isArray(eff) ? eff : []);
      setCosts(Array.isArray(cost) ? cost : []);
      setRoi(Array.isArray(roiData) ? roiData : []);
      setTrends(Array.isArray(trendData) ? trendData : []);
      setDashboard(dash);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Compute aggregate KPIs from loaded data
  const avgEfficiency = efficiency.length
    ? (efficiency.reduce((s, e) => s + e.efficiencyKmPerLiter, 0) / efficiency.length).toFixed(1)
    : null;
  const totalOpCost = costs.reduce((s, c) => s + (c.totalCost ?? 0), 0);
  const fleetUtil = dashboard?.fleetUtilizationPct ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-muted-foreground">Financial intelligence and asset performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadCsv("trips")}>
            <Download className="w-4 h-4 mr-2" /> Trips CSV
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("fuel-logs")}>
            <Download className="w-4 h-4 mr-2" /> Fuel CSV
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("expenses")}>
            <Download className="w-4 h-4 mr-2" /> Expenses CSV
          </Button>
        </div>
      </div>

      {/* 4 KPI summary tiles — matches wireframe */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Fuel Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {avgEfficiency ? `${avgEfficiency} km/l` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg across all vehicles</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{fleetUtil}%</div>
            <p className="text-xs text-muted-foreground mt-1">Vehicles currently on trip</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Operational Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">
              {totalOpCost > 0 ? `₹${totalOpCost.toLocaleString("en-IN")}` : "₹0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fuel + Maintenance total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Vehicle ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">N/A</div>
            <p className="text-xs text-muted-foreground mt-1">Revenue tracking not configured</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Expense Trend</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {trends.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No trend data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="totalCost" name="Total Cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="fuelCost" name="Fuel" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operational Cost by Asset</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {costs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No cost data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costs.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="registrationNumber" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="totalCost" name="Total Cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fuelCost" name="Fuel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Asset ROI Analysis</CardTitle></CardHeader>
          <CardContent className="p-0">
            {roi.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No vehicle data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Acquisition</TableHead>
                    <TableHead className="text-right">Op. Cost</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roi.map((r) => (
                    <TableRow key={r.vehicleId}>
                      <TableCell>
                        <div className="font-mono text-primary font-medium">{r.registrationNumber}</div>
                        <div className="text-xs text-muted-foreground">{r.vehicleName}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(r.acquisitionCost)}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{formatCurrency(r.totalCost)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-muted-foreground">N/A</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fuel Efficiency Leaders</CardTitle></CardHeader>
          <CardContent className="p-0">
            {efficiency.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Log fuel records to see efficiency.</div>
            ) : (
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
                  {efficiency.map((e) => (
                    <TableRow key={e.vehicleId}>
                      <TableCell>
                        <div className="font-mono text-primary font-medium">{e.registrationNumber}</div>
                        <div className="text-xs text-muted-foreground">{e.vehicleName}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatNumber(e.totalDistanceKm)} KM</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatNumber(e.totalLiters)} L</TableCell>
                      <TableCell className="text-right font-mono font-bold text-blue-500">
                        {e.efficiencyKmPerLiter > 0 ? `${e.efficiencyKmPerLiter.toFixed(2)} KM/L` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
