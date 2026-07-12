import { useState, useEffect } from "react";
import { Truck, MapPin, CheckCircle2, LogOut, Loader2, Route, Package, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STEPS = ["DRAFT", "DISPATCHED", "COMPLETED"];

function apiFetch(path: string, opts?: RequestInit, token?: string) {
  const t = token ?? localStorage.getItem("driver_token") ?? "";
  return fetch(`/api/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
      ...(opts?.headers as Record<string, string>),
    },
  }).then((r) => r.json());
}

interface DriverInfo {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  safetyScore: number;
  status: string;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  status: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  dispatchedAt?: string;
  completedAt?: string;
  vehicle?: { registrationNumber: string; model: string; type: string };
}

export default function DriverPortal() {
  const { toast } = useToast();
  const [token, setToken] = useState(localStorage.getItem("driver_token") ?? "");
  const [driver, setDriver] = useState<DriverInfo | null>(
    (() => { try { return JSON.parse(localStorage.getItem("driver_info") ?? "null"); } catch { return null; } })()
  );
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actualDist, setActualDist] = useState<Record<string, string>>({});

  // Auto-load trips if already logged in
  useEffect(() => {
    if (token && driver) {
      fetchTrips(token);
    }
  }, []);

  const fetchTrips = async (t: string) => {
    setTripsLoading(true);
    const res = await apiFetch("/driver-auth/trips", undefined, t);
    setTrips(Array.isArray(res.data) ? res.data : []);
    setTripsLoading(false);
  };

  const handleLogin = async () => {
    if (!licenseInput.trim()) return;
    setLoginLoading(true);
    const res = await apiFetch("/driver-auth/login", {
      method: "POST",
      body: JSON.stringify({ licenseNumber: licenseInput.trim().toUpperCase() }),
    }, "");
    setLoginLoading(false);
    if (res.success) {
      const { token: newToken, driver: driverData } = res.data;
      localStorage.setItem("driver_token", newToken);
      localStorage.setItem("driver_info", JSON.stringify(driverData));
      setToken(newToken);
      setDriver(driverData);
      fetchTrips(newToken);
    } else {
      toast({ title: "Login Failed", description: res.message || "Invalid license number.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("driver_token");
    localStorage.removeItem("driver_info");
    setToken("");
    setDriver(null);
    setTrips([]);
    setLicenseInput("");
  };

  const handleComplete = async (tripId: string) => {
    setCompletingId(tripId);
    const dist = parseFloat(actualDist[tripId] ?? "0");
    const res = await apiFetch(`/driver-auth/trips/${tripId}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ actualDistance: dist }),
    });
    setCompletingId(null);
    if (res.success) {
      toast({ title: "🎉 Trip Completed!", description: "You're now available for the next assignment." });
      fetchTrips(token);
    } else {
      toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
    }
  };

  // ─── Login Screen ───────────────────────────────────────────────────────────
  if (!driver || !token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
              <Truck className="h-9 w-9 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TransitOps</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest mt-1">Driver Portal</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg">Welcome, Driver</h2>
              <p className="text-sm text-muted-foreground">Enter your license number to access your trips.</p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="e.g. DL-88213"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="font-mono text-center text-lg h-12 tracking-widest"
                autoFocus
              />
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleLogin}
                disabled={loginLoading || !licenseInput.trim()}
              >
                {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In →"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Contact your Fleet Manager if you cannot access your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Driver Dashboard ──────────────────────────────────────────────────
  const activeTrip = trips.find((t) => t.status === "DISPATCHED");
  const otherTrips = trips.filter((t) => t.status !== "DISPATCHED");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-mono text-sm">Driver Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold leading-none">{driver.fullName}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">{driver.licenseNumber}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Driver stats strip */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className={cn("text-xl font-bold font-mono",
              driver.safetyScore >= 90 ? "text-green-400" :
              driver.safetyScore >= 70 ? "text-amber-400" : "text-destructive"
            )}>
              {driver.safetyScore}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Safety</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-xl font-bold font-mono text-primary">{trips.filter(t => t.status === "COMPLETED").length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Completed</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-xl font-bold font-mono">{driver.licenseCategory}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Category</div>
          </div>
        </div>

        {/* Active Trip Card */}
        {tripsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
        ) : activeTrip ? (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 space-y-5 shadow-lg shadow-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">Active Trip</span>
              </div>
              <Badge variant="dispatched">DISPATCHED</Badge>
            </div>

            {/* Route */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">From</div>
                  <div className="font-semibold">{activeTrip.source}</div>
                </div>
              </div>
              <div className="ml-3.5 border-l-2 border-dashed border-border/50 h-4" />
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">To</div>
                  <div className="font-semibold">{activeTrip.destination}</div>
                </div>
              </div>
            </div>

            {/* Trip meta */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-card/60 border border-border/50">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Vehicle</div>
                <div className="text-xs font-mono font-bold text-primary">{activeTrip.vehicle?.registrationNumber ?? "—"}</div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Cargo</div>
                <div className="text-xs font-mono font-bold">{activeTrip.cargoWeight} kg</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Planned KM</div>
                <div className="text-xs font-mono font-bold">{activeTrip.plannedDistance}</div>
              </div>
            </div>

            {/* Complete form */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Actual Distance Travelled (km)</label>
              <Input
                type="number"
                placeholder={`~${activeTrip.plannedDistance} km`}
                className="font-mono h-11"
                value={actualDist[activeTrip.id] ?? ""}
                onChange={(e) => setActualDist(prev => ({ ...prev, [activeTrip.id]: e.target.value }))}
              />
              <Button
                className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                disabled={completingId === activeTrip.id}
                onClick={() => handleComplete(activeTrip.id)}
              >
                {completingId === activeTrip.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <><CheckCircle2 className="h-5 w-5 mr-2" />Mark Trip Complete</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
            <Route className="h-10 w-10 text-muted-foreground mx-auto" />
            <div className="font-semibold">No Active Trip</div>
            <div className="text-sm text-muted-foreground">You are currently available. Wait for your Fleet Manager to assign your next trip.</div>
          </div>
        )}

        {/* Trip History */}
        {!tripsLoading && otherTrips.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest font-mono">Trip History</h3>
            <div className="space-y-2">
              {otherTrips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{trip.source} → {trip.destination}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {trip.actualDistance ? `${trip.actualDistance} km actual` : `${trip.plannedDistance} km planned`}
                    </div>
                  </div>
                  <Badge variant={trip.status.toLowerCase() as any} className="shrink-0">
                    {trip.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh button */}
        {!tripsLoading && (
          <Button variant="outline" className="w-full" onClick={() => fetchTrips(token)}>
            Refresh Trips
          </Button>
        )}
      </div>
    </div>
  );
}
