"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation"; // App Router: use 'next/navigation'
import Navbar from "../landing/components/navbar";
import Card from "../landing/components/Card";
import Switcher from "../landing/components/switcher";
import Footer from "../landing/components/footer";

export default function AreaWisePropertiesPage() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false); // For route change loader
  const [areaData, setAreaData] = useState<
    { name: string; slug: string; propertyCount: number }[]
  >([]);

  const router = useRouter();

  // Listen for page transition events
  useEffect(() => {
    const handleStart = () => setPageLoading(true);
    const handleEnd = () => setPageLoading(false);

    // These events only work in `next/router`. Since you are using App Router (`next/navigation`), you'll manually handle click loading.
    return () => {};
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch("/api/citiesarea")
      .then((res) => res.json())
      .then((data) => {
        console.log("cities area data:", data);
        setAreaData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching city data:", error);
        setLoading(false);
      });
  }, []);

  const handleCardClick = (slug: string) => {
    setPageLoading(true);
    router.push(`/area/${slug}`);
  };

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
              Area Wise Properties
            </h3>
          </div>
        </div>
      </section>

      <div className="container lg:mt-10 mt-16">
        {loading ? (
          <p className="text-center text-slate-400">Loading Cities...</p>
        ) : areaData.length === 0 ? (
          <p className="text-center text-red-500">No Cities found.</p>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {areaData.map((area) => (
                <div
                  key={area.slug}
                  onClick={() => handleCardClick(area.slug)}
                >
                  <Card className="transition duration-300 cursor-pointer bg-white hover:bg-green-600 hover:text-white text-black p-4 rounded-lg shadow hover:shadow-lg">
                    <h2 className="text-xl font-semibold">{area.name}</h2>
                    <p className="text-sm text-gray-500">
                      {area.propertyCount} Properties
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Page transition loader */}
      {pageLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 z-50 flex items-center justify-center">
          <div className="border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}

      <Footer />
      <Switcher />
    </>
  );
}