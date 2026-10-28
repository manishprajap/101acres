// src/app/dashboard/components/PropertyListing.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import DataTable, { type TableColumn } from "react-data-table-component";
import {
  Pencil, Trash2, Search, Eye, X, IndianRupee, MapPin, Building2, Ruler,
  CheckCircle2, AlertCircle, RefreshCw, ImageOff,
} from "lucide-react";

import Wrapper from "./wrapper";
import { getRole, getUserId, ROLE_PATH, type Role } from "@/lib/roleRedirect";

/* ------------------------------ Types ------------------------------ */

interface Property {
  id: number;
  user_id: number;
  user_name?: string | null; // owner name, joined from the users table by the API
  status?: string | null;
  looking_to?: string | null;
  property_category?: string | null;
  property_type?: string | null;
  city?: string | null;
  locality?: string | null;
  sub_locality?: string | null;
  carpet_area?: number | string | null;
  carpet_area_unit?: string | null;
  expected_price?: number | string | null;
  availability?: string | null;
  photos?: unknown;
  description?: string | null;
  amenities?: unknown;
  property_features?: unknown;
  location_advantages?: unknown;
  created_at?: string | null;
  [key: string]: unknown;
}

interface ListResponse {
  success?: boolean;
  items?: Property[];
  total?: number;
  message?: string;
}

/* ------------------------------ Helpers ------------------------------ */

/** Bearer token saved at login (localStorage key: "token"). */
const authHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const safe = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const formatNumber = (v: unknown) => {
  const n = Number(v);
  return v === null || v === undefined || v === "" || Number.isNaN(n)
    ? safe(v)
    : new Intl.NumberFormat("en-IN").format(n);
};

const formatPrice = (v: unknown) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : `₹${new Intl.NumberFormat("en-IN").format(n)}`;
};

const formatDate = (v: unknown) => {
  if (!v) return "-";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const titleOf = (p: Property) => {
  const c = p.property_category?.trim();
  const t = p.property_type?.trim();
  return c && t ? `${c} - ${t}` : t || c || `Property #${p.id}`;
};

const locationOf = (p: Property) =>
  [p.sub_locality, p.locality, p.city].map((x) => safe(x).trim()).filter(Boolean).join(", ");

const ownerNameOf = (p: Property) => safe(p.user_name).trim();

const parseList = (value: unknown): string[] => {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((i) => {
        if (typeof i === "string" || typeof i === "number") return [String(i)];
        if (i && typeof i === "object") {
          const o = i as Record<string, unknown>;
          const v = o.value ?? o.name ?? o.label ?? o.title ?? o.text;
          return typeof v === "string" || typeof v === "number" ? [String(v)] : [];
        }
        return [];
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        const p: unknown = JSON.parse(t);
        if (Array.isArray(p)) return parseList(p);
      } catch { /* ignore */ }
    }
    return t.includes(",") ? t.split(",").map((s) => s.trim()).filter(Boolean) : [t];
  }
  return [];
};

const photoList = (value: unknown): string[] => {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v) return;
    if (typeof v === "string") {
      const t = v.trim();
      if (!t) return;
      if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("{") && t.endsWith("}"))) {
        try { walk(JSON.parse(t)); return; } catch { /* plain string */ }
      }
      if (!out.includes(t)) out.push(t);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      [o.url, o.path, o.src, o.image, o.imageUrl, o.image_url, o.filename, o.fileName, o.name].forEach(walk);
    }
  };
  walk(value);
  return out;
};

const imageUrl = (raw: string) => {
  const s = raw.trim();
  if (!s) return "";
  if (/^(https?:|data:)/.test(s)) return s;
  if (!s.includes("/")) return `/api/uploads/${encodeURIComponent(s)}`;
  if (s.startsWith("/api/uploads/")) return s;
  if (s.startsWith("/uploads/")) return s.replace(/^\/uploads\//, "/api/uploads/");
  return `/${s.replace(/^\/+/, "")}`;
};

/* ------------------------------ Small components ------------------------------ */

const PropertyPhoto = ({ value, alt, className = "" }: { value: unknown; alt: string; className?: string }) => {
  const urls = useMemo(() => photoList(value).map(imageUrl).filter(Boolean), [value]);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFailed(false);
  }, [value]);

  const current = urls[idx];
  if (!current || failed) {
    return (
      <div className={`flex h-full min-h-[100px] w-full flex-col items-center justify-center bg-slate-100 ${className}`}>
        <ImageOff size={28} className="text-slate-300" />
        <span className="mt-1 text-xs text-slate-400">No image</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => (idx < urls.length - 1 ? setIdx((i) => i + 1) : setFailed(true))}
    />
  );
};

const StatusBadge = ({ value }: { value?: string | null }) => {
  const s = safe(value);
  const n = s.toLowerCase();
  const cls =
    n === "published" || n === "active" ? "bg-green-100 text-green-700"
    : n === "draft" ? "bg-yellow-100 text-yellow-700"
    : n === "inactive" || n === "rejected" ? "bg-red-100 text-red-700"
    : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {(n === "published" || n === "active") && <CheckCircle2 size={13} />}
      {s || "Unknown"}
    </span>
  );
};

const TagSection = ({ title, items, tagClass }: { title: string; items: string[]; tagClass: string }) =>
  items.length === 0 ? null : (
    <div className="rounded-xl border border-slate-200 p-5">
      <h4 className="text-sm font-bold text-[#102a43]">{title}</h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={`${it}-${i}`} className={`rounded-full px-3 py-1.5 text-xs font-medium ${tagClass}`}>{it}</span>
        ))}
      </div>
    </div>
  );

/* ------------------------------ Page ------------------------------ */

const HEADINGS: Record<Role, { title: string; sub: string }> = {
  admin: { title: "All Properties", sub: "Manage every property listed on the platform" },
  agent: { title: "List Of Properties", sub: "Properties listed by you" },
  user: { title: "List Of Properties", sub: "Manage and view all your properties" },
};

export default function PropertyListing({ mode }: { mode: Role }) {
  const router = useRouter();
  const isAdmin = mode === "admin";

  const [properties, setProperties] = useState<Property[]>([]);
  const [filterText, setFilterText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allowed, setAllowed] = useState(false);

  const [selected, setSelected] = useState<Property | null>(null);
  const [toDelete, setToDelete] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  /* Wrong role on this page -> send the user to their own page */
  useEffect(() => {
    const role = getRole();
    if (role !== mode) router.replace(ROLE_PATH[role]);
    else setAllowed(true);
  }, [mode, router]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(filterText.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [filterText]);

  const fetchProperties = useCallback(async () => {
    if (!allowed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError("");

      const userId = getUserId();
      if (!userId) throw new Error("User session not found. Please login again.");

      const params = new URLSearchParams({
        userId,
        q: debouncedSearch,
        page: String(page),
        limit: String(perPage),
      });
      // Admin: all properties. User / Agent: only their own (server filters by login id).
      if (isAdmin) params.set("scope", "all");

      const res = await fetch(`/api/properties/search?${params}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      let json: ListResponse = {};
      try { json = (await res.json()) as ListResponse; } catch { json = {}; }

      if (res.status === 401) throw new Error("Session expired. Please login again.");
      if (!res.ok) throw new Error(json.message || "Failed to fetch properties");

      const items = Array.isArray(json.items) ? json.items : [];
      setProperties(items);
      setTotalRows(json.total ?? items.length);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error("Failed to fetch properties:", e);
      setError(e instanceof Error ? e.message : "Failed to fetch properties");
      setProperties([]);
      setTotalRows(0);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [allowed, isAdmin, debouncedSearch, page, perPage]);

  useEffect(() => { void fetchProperties(); }, [fetchProperties]);
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const msg = localStorage.getItem("PropertySuccess");
    if (!msg) return;
    setSuccess(msg);
    localStorage.removeItem("PropertySuccess");
    const t = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(t);
  }, []);

  const performDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      setError("");
      const userId = getUserId();
      if (!userId) throw new Error("User session not found. Please login again.");

      const res = await fetch(`/api/properties/${toDelete.id}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      let json: { message?: string } = {};
      try { json = await res.json(); } catch { json = {}; }

      if (res.status === 401) throw new Error("Session expired. Please login again.");
      if (!res.ok) throw new Error(json.message || "Failed to delete property.");

      setToDelete(null);
      if (properties.length === 1 && page > 1) setPage((p) => p - 1);
      else await fetchProperties();

      setSuccess("Property deleted successfully.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------ Columns ------------------------------ */

  const columns: TableColumn<Property>[] = [
    {
      name: "Image",
      width: "100px",
      cell: (row) => (
        <div className="my-2 h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <PropertyPhoto value={row.photos} alt={titleOf(row)} className="h-full w-full object-cover" />
        </div>
      ),
    },
    {
      name: "Property",
      width: "220px",
      sortable: true,
      selector: (row) => titleOf(row),
      cell: (row) => (
        <div className="py-2">
          <p className="font-semibold text-[#102a43]">{titleOf(row)}</p>
        </div>
      ),
    },
    ...(isAdmin
      ? [{
          name: "User",
          width: "180px",
          sortable: true,
          selector: (row: Property) => ownerNameOf(row),
          cell: (row: Property) => (
            <div className="py-2">
              <p className="font-semibold text-[#102a43]">
                {ownerNameOf(row) || "Unknown user"}
              </p>
            </div>
          ),
        } as TableColumn<Property>]
      : []),
    {
      name: "Looking To",
      width: "120px",
      sortable: true,
      selector: (row) => safe(row.looking_to),
      cell: (row) => (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
          {row.looking_to || "-"}
        </span>
      ),
    },
    { name: "Type", width: "160px", sortable: true, selector: (row) => safe(row.property_type) },
    {
      name: "Area",
      width: "130px",
      sortable: true,
      selector: (row) => Number(row.carpet_area || 0),
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Ruler size={15} className="text-[#1e7fe0]" />
          <span>{row.carpet_area ? formatNumber(row.carpet_area) : "-"} {row.carpet_area_unit || ""}</span>
        </div>
      ),
    },
    {
      name: "Price",
      width: "150px",
      sortable: true,
      selector: (row) => Number(row.expected_price || 0),
      cell: (row) => (
        <div className="flex items-center gap-1 font-semibold text-[#12a19c]">
          <IndianRupee size={15} />
          <span>{formatPrice(row.expected_price)}</span>
        </div>
      ),
    },
    {
      name: "Location",
      width: "220px",
      sortable: true,
      selector: (row) => locationOf(row),
      cell: (row) => (
        <div className="flex items-start gap-1.5">
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#12a19c]" />
          <span className="line-clamp-2">{locationOf(row) || "-"}</span>
        </div>
      ),
    },
    {
      name: "Status",
      width: "130px",
      sortable: true,
      selector: (row) => safe(row.status),
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      name: "Created",
      width: "125px",
      sortable: true,
      selector: (row) => row.created_at || "",
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.created_at)}</span>,
    },
    {
      name: "Action",
      width: "145px",
      cell: (row) => (
        <div className="flex w-full items-center justify-center gap-2">
          <button type="button" title="View" onClick={() => setSelected(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
            <Eye size={17} />
          </button>
          <button type="button" title="Edit" onClick={() => router.push(`/dashboard/property-edit/${row.id}`)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
            <Pencil size={17} />
          </button>
          <button type="button" title="Delete" onClick={() => setToDelete(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: { style: { minHeight: "52px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" } },
    headCells: {
      style: {
        backgroundColor: "#f8fafc", color: "#334155", fontSize: "12px", fontWeight: "700",
        textTransform: "uppercase" as const, letterSpacing: "0.02em",
      },
    },
    rows: { style: { minHeight: "76px", fontSize: "13px", color: "#475569", borderBottom: "1px solid #eef2f7" } },
    cells: { style: { paddingLeft: "12px", paddingRight: "12px" } },
    pagination: { style: { minHeight: "58px", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff" } },
  };

  /* ------------------------------ View modal data ------------------------------ */

  const ownerLabel = selected
    ? ownerNameOf(selected)
      ? `${ownerNameOf(selected)} (ID: ${safe(selected.user_id)})`
      : safe(selected.user_id)
    : "";

  const detailRows: [string, string][] = selected
    ? ([
        ["Property Category", safe(selected.property_category)],
        ["Availability", safe(selected.availability)],
        ["Owner", isAdmin ? ownerLabel : ""],
        ["Floor", safe(selected.property_on_floor)],
        ["Total Floors", safe(selected.total_floors)],
        ["Property Age", safe(selected.property_age)],
        ["Ownership", safe(selected.ownership)],
        ["Facing", safe(selected.property_facing)],
        ["Maintenance", selected.maintenance ? formatPrice(selected.maintenance) : ""],
        ["Booking Amount", selected.booking_amount ? formatPrice(selected.booking_amount) : ""],
      ] as [string, string][]).filter(([, v]) => v !== "")
    : [];

  const isInitialLoad = loading && properties.length === 0 && !debouncedSearch;
  const isEmptyForUser = !loading && totalRows === 0 && !debouncedSearch;
  const isEmptyForSearch = !loading && totalRows === 0 && !!debouncedSearch;

  if (!allowed) return null;

  /* ------------------------------ Render ------------------------------ */

  return (
    <Wrapper>
      <div className="container-fluid relative w-full px-3">
        <div className="layout-specing">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h5 className="text-lg font-semibold text-[#102a43]">{HEADINGS[mode].title}</h5>
              <p className="mt-1 text-sm text-slate-500">{HEADINGS[mode].sub}</p>
            </div>
            <ul className="inline-block tracking-[0.5px]">
              <li className="inline-block text-[16px] font-medium hover:text-green-600"><Link href="/">101Acres</Link></li>
              <li className="mx-0.5 inline-block text-slate-400">/</li>
              <li className="inline-block text-[16px] font-medium text-green-600">View Properties</li>
            </ul>
          </div>

          <div className="mt-6 w-full">
            {success && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                <div className="flex items-center gap-2"><CheckCircle2 size={19} /><span className="text-sm font-medium">{success}</span></div>
                <button type="button" onClick={() => setSuccess("")}><X size={18} /></button>
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <div className="flex items-center gap-2"><AlertCircle size={19} /><span className="text-sm font-medium">{error}</span></div>
                <button type="button" onClick={() => setError("")}><X size={18} /></button>
              </div>
            )}

            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="relative w-full max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      isAdmin
                        ? "Search property, owner, city, locality, type..."
                        : "Search property, city, locality, type..."
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none focus:border-[#1e7fe0] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                  {filterText && (
                    <button type="button" onClick={() => setFilterText("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    Showing <span className="font-bold text-[#102a43]">{properties.length}</span> of{" "}
                    <span className="font-bold text-[#102a43]">{totalRows}</span> properties
                  </div>
                  <button type="button" onClick={() => void fetchProperties()} disabled={loading}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {isInitialLoad ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center">
                  <RefreshCw size={32} className="animate-spin text-[#1e7fe0]" />
                  <p className="mt-3 text-sm font-medium text-slate-500">Loading properties...</p>
                </div>
              ) : isEmptyForUser ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Building2 size={30} className="text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#102a43]">No properties found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {isAdmin ? "No property has been added yet." : "You have not added any property yet."}
                  </p>
                </div>
              ) : isEmptyForSearch ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center">
                  <Search size={35} className="text-slate-300" />
                  <h3 className="mt-3 text-lg font-semibold text-[#102a43]">No matching properties</h3>
                  <p className="mt-1 text-sm text-slate-500">Try another search term.</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={properties}
                  pagination
                  paginationServer
                  paginationTotalRows={totalRows}
                  paginationPerPage={perPage}
                  paginationDefaultPage={page}
                  paginationRowsPerPageOptions={[10, 20, 30, 50]}
                  onChangePage={(p) => setPage(p)}
                  onChangeRowsPerPage={(n, p) => { setPerPage(n); setPage(p); }}
                  progressPending={loading}
                  responsive
                  highlightOnHover
                  striped
                  persistTableHead
                  customStyles={customStyles}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View modal */}
      {selected && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-md" onClick={() => setSelected(null)} />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-[#102a43]">Property Details</h2>
                  <p className="mt-1 text-xs text-slate-500">Property ID: <span className="font-semibold text-slate-700">{selected.id}</span></p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setSelected(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
                  <div>
                    <div className="h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:h-[280px]">
                      <PropertyPhoto value={selected.photos} alt={titleOf(selected)} className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {photoList(selected.photos).length || "No"} photo{photoList(selected.photos).length === 1 ? "" : "s"}
                      </span>
                      <StatusBadge value={selected.status} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-[#102a43]">{titleOf(selected)}</h3>
                    <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-[#12a19c]" />
                      <span>{locationOf(selected) || "Location not available"}</span>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">Expected Price</p>
                        <p className="mt-2 text-lg font-bold text-[#12a19c]">{formatPrice(selected.expected_price)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">Carpet Area</p>
                        <p className="mt-2 text-lg font-bold text-[#102a43]">
                          {selected.carpet_area ? formatNumber(selected.carpet_area) : "-"} {selected.carpet_area_unit || ""}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">Property Type</p>
                        <p className="mt-2 font-bold capitalize text-[#102a43]">{selected.property_type || "-"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">Looking To</p>
                        <p className="mt-2 font-bold capitalize text-[#102a43]">{selected.looking_to || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {detailRows.length > 0 && (
                  <div className="mt-7 border-t border-slate-200 pt-6">
                    <h4 className="text-base font-bold text-[#102a43]">Additional Details</h4>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {detailRows.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-slate-100 p-4 shadow-sm">
                          <p className="text-xs font-medium text-slate-400">{label}</p>
                          <p className="mt-1.5 text-sm font-semibold capitalize text-[#102a43]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <TagSection title="Amenities" items={parseList(selected.amenities)} tagClass="bg-blue-50 text-blue-700" />
                  <TagSection title="Property Features" items={parseList(selected.property_features)} tagClass="bg-green-50 text-green-700" />
                  <TagSection title="Location Advantages" items={parseList(selected.location_advantages)} tagClass="bg-teal-50 text-teal-700" />
                </div>

                {selected.description && (
                  <div className="mt-7">
                    <h4 className="text-base font-bold text-[#102a43]">Description</h4>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{selected.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button type="button" onClick={() => setSelected(null)}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                  Close
                </button>
                {/*
                <button type="button"
                  onClick={() => { const id = selected.id; setSelected(null); router.push(`/dashboard/property-edit/${id}`); }}
                  className="flex items-center gap-2 rounded-lg bg-[#1e7fe0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  <Pencil size={16} /> Edit Property
                </button>
                */}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete modal */}
      {toDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600"><Trash2 size={22} /></div>
              <button type="button" onClick={() => setToDelete(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <h2 className="mt-5 text-xl font-bold text-[#102a43]">Delete Property</h2>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <strong className="text-slate-700">{titleOf(toDelete)}</strong>?
            </p>
            <p className="mt-2 text-xs text-red-500">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => setToDelete(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={deleting} onClick={() => void performDelete()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting && <RefreshCw size={16} className="animate-spin" />}
                {deleting ? "Deleting..." : "Delete Property"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}