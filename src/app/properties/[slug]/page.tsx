import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { propertyFormProperties as properties } from "@/db/schema";
import { formatPrice, idFromSlug, propertyName } from "@/lib/property-utils";
import { serializePropertyStorageRow } from "@/lib/propertyFormStorage";

export const dynamic = "force-dynamic";

const parseList = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v !== "string" || !v) return [];
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p.map(String) : [String(p)];
  } catch {
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
};

const parsePhotos = (value: unknown): string[] =>
  parseList(value).filter((photo) => photo.trim() !== "");

const asText = (value: unknown): string | null =>
  value === null || value === undefined || value === ""
    ? null
    : String(value);

interface PropertyDetails {
  id: number;
  status: string | null;
  looking_to: string | null;
  property_type: string | null;
  property_category: string | null;
  current_rent: string | number | null;
  expected_price: string | number | null;
  carpet_area: string | number | null;
  carpet_area_unit: string | null;
  price_per_sqft: string | number | null;
  maintenance: string | number | null;
  total_floors: string | number | null;
  property_on_floor: string | null;
  washroom: string | null;
  parking: string | null;
  availability: string | null;
  property_age: string | null;
  ownership: string | null;
  property_facing: string | null;
  suitable_business_type: string | null;
  amenities: unknown;
  property_features: unknown;
  society_features: unknown;
  located_near: unknown;
  location_advantages: unknown;
  mall_name: string | null;
  locality: string | null;
  sub_locality: string | null;
  city: string | null;
  photos: unknown;
  description: string | null;
}

export default async function PropertyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();

  const [row] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);
  if (!row) notFound();

  const normalized = serializePropertyStorageRow(
    row as Record<string, unknown>
  );
  const p: PropertyDetails = {
    id: row.id,
    status: asText(normalized.status),
    looking_to: asText(normalized.looking_to),
    property_type: asText(normalized.property_type),
    property_category: asText(normalized.property_category),
    current_rent: asText(normalized.current_rent),
    expected_price: asText(normalized.expected_price),
    carpet_area: asText(normalized.carpet_area),
    carpet_area_unit: asText(normalized.carpet_area_unit),
    price_per_sqft: asText(normalized.price_per_sqft),
    maintenance: asText(normalized.maintenance),
    total_floors: asText(normalized.total_floors),
    property_on_floor: asText(normalized.property_on_floor),
    washroom: asText(normalized.washroom),
    parking: asText(normalized.parking),
    availability: asText(normalized.availability),
    property_age: asText(normalized.property_age),
    ownership: asText(normalized.ownership),
    property_facing: asText(normalized.property_facing ?? normalized.facing),
    suitable_business_type: asText(normalized.suitable_business_type),
    amenities: normalized.amenities,
    property_features: normalized.property_features,
    society_features: normalized.society_features,
    located_near: normalized.located_near,
    location_advantages: normalized.location_advantages,
    mall_name: asText(normalized.society),
    locality: asText(normalized.locality),
    sub_locality: asText(normalized.sub_locality),
    city: asText(normalized.city),
    photos: normalized.photos,
    description: asText(normalized.description),
  };
  if (p.status?.toLowerCase() === "draft") notFound();

  const name = propertyName(p);
  const photos = parsePhotos(p.photos);
  const isRent = p.looking_to?.toLowerCase() === "rent";
  const price = formatPrice(isRent ? p.current_rent : p.expected_price);

  const details: [string, string | number | null | undefined][] = [
    ["Type", p.property_type],
    ["Category", p.property_category],
    ["Carpet area", p.carpet_area && `${p.carpet_area} ${p.carpet_area_unit ?? ""}`],
    ["Price / sq.ft", p.price_per_sqft && formatPrice(p.price_per_sqft)],
    ["Maintenance", p.maintenance && formatPrice(p.maintenance)],
    ["Total floors", p.total_floors],
    ["Floor", p.property_on_floor],
    ["Washroom", p.washroom],
    ["Parking", p.parking],
    ["Availability", p.availability],
    ["Property age", p.property_age],
    ["Ownership", p.ownership],
    ["Facing", p.property_facing],
    ["Suitable for", p.suitable_business_type],
  ];

  const sections: [string, string[]][] = [
    ["Amenities", parseList(p.amenities)],
    ["Property features", parseList(p.property_features)],
    ["Society features", parseList(p.society_features)],
    ["Located near", parseList(p.located_near)],
    ["Location advantages", parseList(p.location_advantages)],
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{name}</h1>
      <p className="mt-1 text-slate-500">
        {[p.mall_name, p.locality, p.city].filter(Boolean).join(", ")}
      </p>
      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
        {price ?? "Price on request"}
        {isRent && <span className="text-base font-normal text-slate-500"> /month</span>}
      </p>

      {photos.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {photos.slice(0, 4).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`${name} ${i + 1}`} className="w-full h-64 object-cover rounded-xl" />
          ))}
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
        {details
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{value}</dd>
            </div>
          ))}
      </dl>

      {p.description && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">About this property</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">{p.description}</p>
        </section>
      )}

      {sections
        .filter(([, items]) => items.length > 0)
        .map(([title, items]) => (
          <section key={title} className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        ))}
    </main>
  );
}