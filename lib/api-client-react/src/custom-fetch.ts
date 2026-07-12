export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;
  constructor(status: number, message: string, data: T | null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Rewrites /api/xxx → /api/v1/xxx so the old generated client
 * works with the new backend that serves at /api/v1/*.
 */
function rewriteUrl(url: string): string {
  if (url.startsWith("/api/") && !url.includes("/api/v1")) {
    return url.replace("/api/", "/api/v1/");
  }
  return url;
}

/** Normalize a single vehicle object from Prisma format → old OpenAPI format */
function normalizeVehicle(v: any): any {
  if (!v || typeof v !== "object") return v;
  return {
    ...v,
    vehicleName: v.vehicleName ?? v.model ?? v.registrationNumber,
    maxLoadCapacityKg: v.maxLoadCapacityKg ?? v.maxLoadCapacity,
    currentOdometerKm: v.currentOdometerKm ?? v.currentOdometer,
    // status: lowercase for old enums (AVAILABLE → available)
    status: (v.status ?? "").toLowerCase(),
  };
}

/** Normalize a single driver object */
function normalizeDriver(d: any): any {
  if (!d || typeof d !== "object") return d;
  return {
    ...d,
    licenseExpiryDate: d.licenseExpiryDate ?? d.licenseExpiry,
    contactNumber: d.contactNumber ?? d.phone,
    tripCompletionRate: d.tripCompletionRate ?? null,
    region: d.region ?? null,
    status: (d.status ?? "").toLowerCase(),
    licenseCategory: (d.licenseCategory ?? "").toLowerCase(),
  };
}

/** Normalize a single trip object */
function normalizeTrip(t: any): any {
  if (!t || typeof t !== "object") return t;
  return {
    ...t,
    sourceLocation: t.sourceLocation ?? t.source,
    destinationLocation: t.destinationLocation ?? t.destination,
    plannedDistanceKm: t.plannedDistanceKm ?? t.plannedDistance,
    actualDistanceKm: t.actualDistanceKm ?? t.actualDistance,
    cargoWeightKg: t.cargoWeightKg ?? t.cargoWeight,
    // flatten nested vehicle/driver
    registrationNumber: t.registrationNumber ?? t.vehicle?.registrationNumber ?? null,
    vehicleName: t.vehicleName ?? t.vehicle?.model ?? null,
    driverName: t.driverName ?? t.driver?.fullName ?? null,
    status: (t.status ?? "").toLowerCase(),
  };
}

/** Normalize a maintenance record */
function normalizeMaintenance(m: any): any {
  if (!m || typeof m !== "object") return m;
  return {
    ...m,
    maintenanceType: m.maintenanceType ?? m.title ?? "general",
    cost: m.cost ?? m.actualCost ?? m.estimatedCost ?? 0,
    startDate: m.startDate ?? m.createdAt,
    status: (m.status ?? "").toLowerCase(),
    vehicleName: m.vehicleName ?? m.vehicle?.model ?? null,
    registrationNumber: m.registrationNumber ?? m.vehicle?.registrationNumber ?? null,
    title: m.title,
    description: m.description ?? null,
  };
}

/** Normalize an expense record */
function normalizeExpense(e: any): any {
  if (!e || typeof e !== "object") return e;
  return {
    ...e,
    expenseType: (e.expenseType ?? e.type ?? "other").toLowerCase(),
    date: e.date ?? e.createdAt,
    vehicleName: e.vehicleName ?? e.vehicle?.model ?? null,
    registrationNumber: e.registrationNumber ?? e.vehicle?.registrationNumber ?? null,
  };
}

/** Normalize a fuel log */
function normalizeFuelLog(f: any): any {
  if (!f || typeof f !== "object") return f;
  return {
    ...f,
    date: f.date ?? f.createdAt,
    odometerReadingKm: f.odometerReadingKm ?? f.odometer,
    vehicleName: f.vehicleName ?? f.vehicle?.model ?? null,
    registrationNumber: f.registrationNumber ?? f.vehicle?.registrationNumber ?? null,
  };
}

/** Detect what kind of object this is and normalize accordingly */
function normalizeItem(item: any): any {
  if (!item || typeof item !== "object") return item;
  if ("registrationNumber" in item && "maxLoadCapacity" in item) return normalizeVehicle(item);
  if ("registrationNumber" in item && "maxLoadCapacityKg" in item) return normalizeVehicle(item);
  if ("licenseNumber" in item || "licenseExpiry" in item) return normalizeDriver(item);
  if ("source" in item || "sourceLocation" in item || "plannedDistance" in item) return normalizeTrip(item);
  if (("estimatedCost" in item || "actualCost" in item) && "vehicleId" in item && !("liters" in item)) return normalizeMaintenance(item);
  if ("liters" in item) return normalizeFuelLog(item);
  if (("type" in item || "expenseType" in item) && "amount" in item) return normalizeExpense(item);
  return item;
}

/** Recursively normalize arrays or single objects */
function normalizePayload(payload: any): any {
  if (Array.isArray(payload)) return payload.map(normalizeItem);
  return normalizeItem(payload);
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const rewrittenUrl = rewriteUrl(url);
  const token = localStorage.getItem("transitops_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(rewrittenUrl, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    const message = errorData.message || errorData.error || "Request failed";
    throw Object.assign(new Error(message), { status: response.status, data: errorData });
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) return response.text() as unknown as T;

  const json = await response.json();

  // Unwrap { success: true, data: <payload> } envelope
  const payload = json && typeof json === "object" && "success" in json && "data" in json
    ? json.data
    : json;

  return normalizePayload(payload) as T;
};
