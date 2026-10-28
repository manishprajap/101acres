import { MetadataRoute } from "next";

// Update this to your actual production domain
const BASE_URL = "https://101acres.com";

interface Property {
  id: number;
  slug?: string;
  updatedAt?: string;
  status?: string;
}

async function getProperties(): Promise<Property[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/property`, {
      // Revalidate the sitemap data periodically instead of on every request
      next: { revalidate: 3600 }, // 1 hour
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data?.data || [];
  } catch (error) {
    console.error("Failed to fetch properties for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();

  // Static routes — add/remove based on your actual site structure
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Dynamic property detail pages — only include active/published listings
  const propertyRoutes: MetadataRoute.Sitemap = properties
    .filter((property) => property.status === "Active")
    .map((property) => ({
      url: `${BASE_URL}/property/${property.slug ?? property.id}`,
      lastModified: property.updatedAt
        ? new Date(property.updatedAt)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...propertyRoutes];
}