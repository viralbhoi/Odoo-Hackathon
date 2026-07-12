import { useEffect, useState } from "react";
import { Truck, AlertTriangle, MapPin, Users, Activity, Loader2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function apiFetch(path: string) {
  const token = localStorage.getItem("transitops_token");
  return fetch(`/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json()).then((j) => j.data ?? j);
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-IN").format(n);
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/dashboard"), apiFetch("/trips")])
      .then(([dash, tripsData]) => {
        setDashboard(dash);
        setTrips(Array.isArray(tripsData) ? tripsData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Flatten dashboard data across role-based shapes
  const ops = dashboard?.operations ?? dashboard?.overview ?? dashboard?.compliance ?? {};
  const totalVehicles     = ops.totalVehicles     ?? 0;
  const availableVehicles = ops.availableVehicles ?? 0;
  const vehiclesInMaint   = ops.vehiclesInMaintenance ?? 0;
  const activeTrips       = ops.activeTrips       ?? 0;
  const totalDrivers      = ops.totalDrivers      ?? 0;
  const availableDrivers  = ops.availableDrivers  ?? 0;
  const onTrip            = totalVehicles - availableVehicles - vehiclesInMaint;
  const utilizationPct    = totalVehicles > 0 ? ((onTrip / totalVehicles) * 100).toFixed(1) : "0.0";

  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusColor = (status: string) => {
    const s = (status ?? "").toLowerCase();
    if (s === "completed") return "text-green-400";
    if (s === "dispatched") return "text-blue-400";
    if (s === "cancelled") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Command Dashboard</h2>
        <p className="text-muted-foreground">Live operational metrics and active deployments.</p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">Active Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totalVehicles)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-mono">{availableVehicles}</span> Available for dispatch
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">In Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(vehiclesInMaint)}</div>
            <p className="text-xs text-amber-500/80 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">Active Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(activeTrips)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-gray-400 font-mono">{onTrip}</span> Vehicles on road
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">Drivers On Duty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(availableDrivers)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {totalDrivers} total personnel</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Live Deployments */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle>Recent Deployments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentTrips.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No trips recorded yet.</div>
              ) : (
                recentTrips.map((trip) => {
                  const src = trip.sourceLocation ?? trip.source ?? "—";
                  const dst = trip.destinationLocation ?? trip.destination ?? "—";
                  const reg = trip.registrationNumber ?? trip.vehicle?.registrationNumber ?? "—";
                  const drv = trip.driverName ?? trip.driver?.fullName ?? "—";
                  const dist = trip.plannedDistanceKm ?? trip.plannedDistance ?? 0;
                  const status = (trip.status ?? "").toLowerCase();
                  return (
                    <div key={trip.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary">{reg}</span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-sm font-medium">{drv}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{src}</span>
                          <span className="text-border">→</span>
                          <span>{dst}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={status as any}>{status.replace("_", " ")}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{formatNumber(dist)} KM</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Distribution */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Fleet Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Utilization Rate</span>
                <span className="text-2xl font-bold font-mono text-primary">{utilizationPct}%</span>
              </div>
              <div className="space-y-4">
                <StatusBar label="Available"    value={availableVehicles} total={totalVehicles || 1} color="bg-green-500" />
                <StatusBar label="On Trip"      value={onTrip}            total={totalVehicles || 1} color="bg-blue-500" />
                <StatusBar label="In Shop"      value={vehiclesInMaint}   total={totalVehicles || 1} color="bg-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = Math.max(0, Math.min(100, (value / total) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
