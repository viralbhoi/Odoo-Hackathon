import { Truck, AlertTriangle, MapPin, Users, Activity, Loader2 } from "lucide-react";
import { useGetDashboardKpis, useGetRecentTrips, useGetVehicleStatusSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useGetDashboardKpis();
  const { data: recentTrips, isLoading: tripsLoading } = useGetRecentTrips();
  const { data: statusSummary, isLoading: statusLoading } = useGetVehicleStatusSummary();

  const isLoading = kpisLoading || tripsLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Command Dashboard</h2>
        <p className="text-muted-foreground">Live operational metrics and active deployments.</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">Active Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(kpis?.activeVehicles || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-mono">{kpis?.availableVehicles || 0}</span> Available for dispatch
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">In Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(kpis?.vehiclesInMaintenance || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1 text-amber-500/80">Requires attention</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">Active Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(kpis?.activeTrips || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-gray-400 font-mono">{kpis?.pendingTrips || 0}</span> Draft/Pending
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase text-muted-foreground">Drivers On Duty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(kpis?.driversOnDuty || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {kpis?.totalDrivers || 0} total personnel
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Live Board */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle>Live Deployments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentTrips?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No active deployments.</div>
              ) : (
                recentTrips?.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-primary">{trip.registrationNumber}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-sm font-medium">{trip.driverName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{trip.sourceLocation}</span>
                        <span className="text-border">→</span>
                        <span>{trip.destinationLocation}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={trip.status as any}>{trip.status.replace('_', ' ')}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{formatNumber(trip.plannedDistanceKm)} KM</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Status */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Fleet Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Utilization Rate</span>
                <span className="text-2xl font-bold font-mono text-primary">{kpis?.fleetUtilizationPct.toFixed(1)}%</span>
              </div>
              
              <div className="space-y-4">
                <StatusBar label="Available" value={statusSummary?.available || 0} total={kpis?.activeVehicles || 1} color="bg-green-500" />
                <StatusBar label="On Trip" value={statusSummary?.onTrip || 0} total={kpis?.activeVehicles || 1} color="bg-blue-500" />
                <StatusBar label="In Shop" value={statusSummary?.inShop || 0} total={kpis?.activeVehicles || 1} color="bg-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = Math.max(0, Math.min(100, (value / total) * 100));
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
