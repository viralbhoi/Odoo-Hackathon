import { useEffect, useState } from "react";
import { Truck, MapPin, Users, Activity, Loader2, Wrench, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

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

  // Pull from flat top-level response (new dashboard service returns flat fields)
  const d = dashboard ?? {};
  const totalVehicles     = d.totalVehicles      ?? 0;
  const availableVehicles = d.availableVehicles   ?? 0;
  const onTripVehicles    = d.onTripVehicles      ?? 0;
  const vehiclesInMaint   = d.vehiclesInMaintenance ?? 0;
  const activeTrips       = d.activeTrips         ?? 0;
  const pendingTrips      = d.pendingTrips         ?? 0;
  const totalDrivers      = d.totalDrivers         ?? 0;
  const availableDrivers  = d.availableDrivers     ?? 0;
  const driversOnDuty     = d.driversOnDuty        ?? 0;
  const utilizationPct    = d.fleetUtilizationPct  ?? (
    totalVehicles > 0 ? parseFloat(((onTripVehicles / totalVehicles) * 100).toFixed(1)) : 0
  );

  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Command Dashboard</h2>
        <p className="text-muted-foreground">Live operational metrics and active deployments.</p>
      </div>

      {/* Filter bar — matches wireframe */}
      <div className="flex flex-wrap gap-3">
        <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Vehicle Type: All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vehicle Type: All</SelectItem>
            <SelectItem value="TRUCK">Truck</SelectItem>
            <SelectItem value="VAN">Van</SelectItem>
            <SelectItem value="PICKUP">Pickup</SelectItem>
            <SelectItem value="TRAILER">Trailer</SelectItem>
            <SelectItem value="BUS">Bus</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status: All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: All</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_TRIP">On Trip</SelectItem>
            <SelectItem value="IN_SHOP">In Shop</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Region: All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Region: All</SelectItem>
            <SelectItem value="north">North</SelectItem>
            <SelectItem value="south">South</SelectItem>
            <SelectItem value="east">East</SelectItem>
            <SelectItem value="west">West</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 7 KPI tiles — single row matching wireframe */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          title="Total Vehicles"
          value={formatNumber(totalVehicles)}
          sub={<><span className="text-green-500 font-mono">{availableVehicles}</span> available for dispatch</>}
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-primary"
        />
        <KpiCard
          title="In Maintenance"
          value={formatNumber(vehiclesInMaint)}
          sub={<span className="text-amber-500/80">Currently in shop</span>}
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-amber-500"
        />
        <KpiCard
          title="Active Trips"
          value={formatNumber(activeTrips)}
          sub={<><span className="text-yellow-400 font-mono">{pendingTrips}</span> pending</>}
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-blue-500"
        />
        <KpiCard
          title="Drivers On Duty"
          value={formatNumber(driversOnDuty)}
          sub={<>{availableDrivers} available / {totalDrivers} total</>}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-emerald-500"
        />
        <KpiCard
          title="Pending Trips"
          value={formatNumber(pendingTrips)}
          sub="Awaiting dispatch"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-yellow-500"
        />
        <KpiCard
          title="Fleet Utilization"
          value={`${utilizationPct}%`}
          sub="Vehicles on active trips"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-violet-500"
        />
        <KpiCard
          title="Available"
          value={formatNumber(availableVehicles)}
          sub="Ready for dispatch"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          accent="border-l-green-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Deployments */}
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
                  const src = trip.source ?? trip.sourceLocation ?? "—";
                  const dst = trip.destination ?? trip.destinationLocation ?? "—";
                  const reg = trip.vehicle?.registrationNumber ?? trip.registrationNumber ?? "—";
                  const drv = trip.driver?.fullName ?? trip.driverName ?? "—";
                  const dist = trip.plannedDistance ?? trip.plannedDistanceKm ?? 0;
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
                <StatusBar label="Available"  value={availableVehicles} total={totalVehicles || 1} color="bg-green-500" />
                <StatusBar label="On Trip"    value={onTripVehicles}    total={totalVehicles || 1} color="bg-blue-500" />
                <StatusBar label="In Shop"    value={vehiclesInMaint}   total={totalVehicles || 1} color="bg-amber-500" />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Driver Status</p>
                <StatusBar label="Available" value={availableDrivers} total={totalDrivers || 1} color="bg-green-500" />
                <StatusBar label="On Duty"   value={driversOnDuty}    total={totalDrivers || 1} color="bg-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, accent }: { title: string; value: string; sub: React.ReactNode; icon: React.ReactNode; accent: string }) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
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
