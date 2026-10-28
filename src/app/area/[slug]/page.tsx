"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/app/landing/components/navbar";
import Footer from "@/app/landing/components/footer";
import Switcher from "@/app/landing/components/switcher";


interface Area {
  id: number;
  areaName: string;
   propertyCount: number;
}

export default function CityAreasPage() {
  const params = useParams();
  const slug = params?.slug || "";

  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    fetch(`/api/area/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAreas(data);
        } else {
          setAreas([]);
        }
       
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching areas:", err);
        setLoading(false);
      });
  }, [slug]);

  return (
    <>
      <Navbar navClass={""} topnavClass={""} tagline={false} />

      <section
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="relative md:pb-24 pb-16 mt-20 table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover"
      >
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">
              Areas in { slug}
            </h3>
          </div>
        </div>
      </section>

      <div className="container lg:mt-10 mt-16">
        {loading ? (
          <p className="text-center text-slate-400">Loading Areas...</p>
        ) : areas.length === 0 ? (
          <p className="text-center text-red-500">No Areas found for this city.</p>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {areas.map((area) => (
              <Link href={`/area/detail/${area.id}`} key={area.id}>
                  <div className="transition duration-300 cursor-pointer bg-white hover:bg-green-600 hover:text-white text-black p-4 rounded-lg shadow hover:shadow-lg">
                    <h2 className="text-xl font-semibold">{area.areaName}</h2>
                     <p className="text-sm">{area.propertyCount} Properties</p>
                  </div>
                </Link>
              ))}
            </div> 
          </div>
        )}
       
      </div>
<div>

</div>
      <Footer />
      <Switcher />
    </>
  );
}
