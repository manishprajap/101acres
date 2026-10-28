import { notFound } from "next/navigation";
import AreaPageClient from "./AreaPageClient";
import { Property } from "@/types/property";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/properties-by-area/${id}`,
    { cache: "no-store" }
  );

  
  if (!res.ok) return notFound();
  const data = await res.json();
  const properties: Property[] = Object.values(data);
 /// console.log("all data gettting:",properties);

  return <AreaPageClient properties={properties} areaId={id}  />;
}
 