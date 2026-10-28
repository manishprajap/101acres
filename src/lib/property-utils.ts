export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const propertySlug = (name: string, id: number) => `${slugify(name)}-${id}`;

// "flat-apartment-aishbagh-lucknow-42" -> 42
export const idFromSlug = (slug: string) => {
  const id = parseInt(slug.split("-").pop() ?? "", 10);
  return Number.isNaN(id) ? null : id;
};

export const propertyName = (p: {
  id: number;
  property_type?: string | null;
  sub_locality?: string | null;
  locality?: string | null;
  city?: string | null;
}) =>
  [p.property_type, p.sub_locality || p.locality, p.city].filter(Boolean).join(", ") ||
  `Property #${p.id}`;

export const formatPrice = (value?: string | number | null) => {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return null;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.00$/, "")} Lac`;
  return `₹${n.toLocaleString("en-IN")}`;
};