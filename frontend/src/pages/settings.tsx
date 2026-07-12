import { useState } from "react";
import { Settings2, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// RBAC access matrix as per wireframe
const ROLES = [
  {
    role: "FLEET_MANAGER",
    label: "Fleet Manager",
    fleet: "✓ Full",
    drivers: "✓ Full",
    trips: "—",
    fuelExp: "—",
    analytics: "✓ View",
  },
  {
    role: "DISPATCHER",
    label: "Dispatcher",
    fleet: "View",
    drivers: "—",
    trips: "✓ Full",
    fuelExp: "—",
    analytics: "—",
  },
  {
    role: "SAFETY_OFFICER",
    label: "Safety Officer",
    fleet: "—",
    drivers: "✓ Full",
    trips: "View",
    fuelExp: "—",
    analytics: "—",
  },
  {
    role: "FINANCIAL_ANALYST",
    label: "Financial Analyst",
    fleet: "View",
    drivers: "—",
    trips: "—",
    fuelExp: "✓ Full",
    analytics: "✓ Full",
  },
];

function AccessCell({ value }: { value: string }) {
  if (value === "—") return <span className="text-muted-foreground text-sm">—</span>;
  if (value.startsWith("✓"))
    return <span className="text-green-500 font-semibold text-sm">{value}</span>;
  return <span className="text-amber-400 text-sm">{value}</span>;
}

export default function Settings() {
  const { toast } = useToast();
  const [depotName, setDepotName] = useState("Gandhinagar Depot GJ4");
  const [currency, setCurrency] = useState("INR");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Settings are local-only (no backend table for org config in schema)
    localStorage.setItem("transitops_settings", JSON.stringify({ depotName, currency, distanceUnit }));
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    toast({ title: "Settings saved", description: "Preferences updated successfully." });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure platform preferences and access control.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── General Settings ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle>General</CardTitle>
            </div>
            <CardDescription>Basic platform configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="depot-name">Depot / Organisation Name</Label>
              <Input
                id="depot-name"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                placeholder="e.g. Gandhinagar Depot GJ4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹) — Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD ($) — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR (€) — Euro</SelectItem>
                  <SelectItem value="GBP">GBP (£) — British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance-unit">Distance Unit</Label>
              <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                <SelectTrigger id="distance-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometres (KM)</SelectItem>
                  <SelectItem value="miles">Miles (MI)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* ── Role Info ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Active Roles</CardTitle>
            </div>
            <CardDescription>System roles enforced via JWT middleware.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { role: "FLEET_MANAGER", color: "bg-primary/10 text-primary border-primary/20", desc: "Full fleet & driver management" },
                { role: "DISPATCHER", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", desc: "Trip creation & dispatch" },
                { role: "SAFETY_OFFICER", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", desc: "Driver compliance & safety" },
                { role: "FINANCIAL_ANALYST", color: "bg-green-500/10 text-green-400 border-green-500/20", desc: "Fuel, expenses & analytics" },
              ].map(({ role, color, desc }) => (
                <div key={role} className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-muted/30">
                  <div>
                    <Badge className={`${color} border font-mono text-xs`}>{role.replace(/_/g, " ")}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── RBAC Access Matrix ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
          </div>
          <CardDescription>
            Access is scoped per role after login. Enforced server-side via JWT middleware.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Fleet</TableHead>
                <TableHead className="text-center">Drivers</TableHead>
                <TableHead className="text-center">Trips</TableHead>
                <TableHead className="text-center">Fuel & Exp.</TableHead>
                <TableHead className="text-center">Analytics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map((r) => (
                <TableRow key={r.role}>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-foreground">{r.label}</span>
                  </TableCell>
                  <TableCell className="text-center"><AccessCell value={r.fleet} /></TableCell>
                  <TableCell className="text-center"><AccessCell value={r.drivers} /></TableCell>
                  <TableCell className="text-center"><AccessCell value={r.trips} /></TableCell>
                  <TableCell className="text-center"><AccessCell value={r.fuelExp} /></TableCell>
                  <TableCell className="text-center"><AccessCell value={r.analytics} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── DB Info ── */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Platform Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Version</p>
              <p className="font-mono font-semibold">v1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Database</p>
              <p className="font-mono font-semibold">PostgreSQL (Neon)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">ORM</p>
              <p className="font-mono font-semibold">Prisma 5.x</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Auth</p>
              <p className="font-mono font-semibold">JWT + bcrypt</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
