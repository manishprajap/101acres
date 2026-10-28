"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import Switcher from "../landing/components/switcher";
import Navbar from "../landing/components/navbar";
import Footer from "../landing/components/footer";

import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { LuBath, LuBedDouble } from "react-icons/lu";
import { FiHome, FiSearch } from "react-icons/fi";
import { LuCircleDollarSign } from "react-icons/lu";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface PropertiesData {
  id: number;
  image: string;
  title: string;
  squareFt: number;
  beds: number;
  baths: number;
  price: number;
  rating: number;
}

const getParsedImage = (imageStr: string): string => {
  try {
    const parsed = JSON.parse(imageStr);
    const img = Array.isArray(parsed) ? parsed[0] : parsed;
    return img?.startsWith("/uploads/") ? img : `/uploads/${img}`;
  } catch {
    return imageStr?.startsWith("/uploads/") ? imageStr : `/uploads/${imageStr}`;
  }
};

export default function Property() {
  const [properties, setProperties] = useState<PropertiesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [inputQuery, setInputQuery] = useState("");

  const router = useRouter();

  const handleSearch = () => {
    if (inputQuery.trim()) {
      router.push(`/blogs?search=${encodeURIComponent(inputQuery)}`);
    }
  };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch("/api/properties/bankproperties");
        const result = await response.json();
        if (Array.isArray(result.data)) {
          setProperties(result.data);
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error("Fetch failed:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, []);

  return (
    <>
      <Navbar navClass="" topnavClass="" tagline={false} />

      {/* Hero Section */}
      <section
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="relative md:pb-24 pb-16 mt-20 table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover"
      >
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="container relative text-center">
          <h3 className="md:text-4xl text-3xl font-medium text-white mt-10">
            Bank Property
          </h3>
        </div>
      </section>

      {/* Search Tabs */}
      <div className="container">
        <div className="grid grid-cols-1 justify-center">
          <div className="relative -mt-32">
            <div className="grid grid-cols-1">
              <ul className="inline-block sm:w-fit w-full flex-wrap justify-center text-center p-4 bg-white dark:bg-slate-900 rounded-t-xl border-b border-slate-100 dark:border-gray-800">
                {["Buy", "Sell", "Rent"].map((tab, idx) => (
                  <li key={idx} className="inline-block">
                    <button
                      onClick={() => setActiveTabIndex(idx)}
                      className={`px-6 py-2 text-base font-medium rounded-md w-full transition-all duration-500 ease-in-out ${
                        activeTabIndex === idx
                          ? "text-white bg-green-600"
                          : "hover:text-green-600"
                      }`}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Search Filter Form */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-b-xl shadow-md">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6">
                    {/* Search */}
                    <div>
                      <label className="form-label text-slate-900 dark:text-white font-medium">
                        Search: <span className="text-red-600">*</span>
                      </label>
                      <div className="relative mt-2 flex items-center">
                        <FiSearch className="absolute left-3 text-green-600" />
                        <input
                          type="text"
                          className="form-input pl-10"
                          placeholder="Search your Keywords"
                          value={inputQuery}
                          onChange={(e) => setInputQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="form-label text-slate-900 dark:text-white font-medium">
                        Select Category:
                      </label>
                      <div className="relative mt-2">
                        <FiHome className="absolute left-3 top-3 text-green-600" />
                        <Select
                          className="pl-10"
                          options={[
                            { value: "commercial", label: "Commercial" },
                            { value: "residential", label: "Residential" },
                          ]}
                          isClearable
                        />
                      </div>
                    </div>

                    {/* Min Price */}
                    <div>
                      <label className="form-label text-slate-900 dark:text-white font-medium">
                        Min Price:
                      </label>
                      <Select
                        className="mt-2"
                        options={[
                          { value: 500, label: "₹ 500" },
                          { value: 1000, label: "₹ 1,000" },
                          { value: 2000, label: "₹ 2,000" },
                        ]}
                        isClearable
                      />
                    </div>

                    {/* Max Price */}
                    <div>
                      <label className="form-label text-slate-900 dark:text-white font-medium">
                        Max Price:
                      </label>
                      <Select
                        className="mt-2"
                        options={[
                          { value: 5000, label: "₹ 5,000" },
                          { value: 10000, label: "₹ 10,000" },
                          { value: 20000, label: "₹ 20,000" },
                        ]}
                        isClearable
                      />
                    </div>

                    {/* Button */}
                    <div className="lg:col-span-4">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="btn bg-green-600 hover:bg-green-700 text-white w-full mt-4"
                      >
                        🔍 Search
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Cards */}
      <div className="container lg:mt-24 mt-16">
        {loading ? (
          <p className="text-center text-slate-400">Loading property...</p>
        ) : properties.length === 0 ? (
          <p className="text-center text-red-500">No properties found.</p>
        ) : (
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
            {properties.map((property) => {
              const rawImage = getParsedImage(property.image ?? "");
              const imageUrl = rawImage || "/images/default-property.jpg";

              return (
                <div
                  key={property.id}
                  className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl overflow-hidden transition duration-500"
                >
                  <Link href={`/property-detail/${property.id}`}>
                    <Image
                      src={imageUrl}
                      alt={property.title}
                      width={500}
                      height={300}
                      className="w-full h-60 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (
                          target.src !==
                          window.location.origin + "/images/default-property.jpg"
                        ) {
                          target.src = "/images/default-property.jpg";
                        }
                      }}
                      unoptimized
                    />
                  </Link>

                  <div className="p-6">
                    <Link
                      href={`/property-detail/${property.id}`}
                      className="text-lg font-medium hover:text-green-600 transition block"
                    >
                      {property.title}
                    </Link>

                    <ul className="py-4 border-y border-slate-100 dark:border-gray-800 flex items-center text-sm">
                      <li className="flex items-center me-4">
                        <LiaCompressArrowsAltSolid className="me-2 text-green-600" />
                        <span>{property.squareFt} ft²</span>
                      </li>
                      <li className="flex items-center me-4">
                        <LuBedDouble className="me-2 text-green-600" />
                        <span>{property.beds} Beds</span>
                      </li>
                      <li className="flex items-center">
                        <LuBath className="me-2 text-green-600" />
                        <span>{property.baths} Baths</span>
                      </li>
                    </ul>

                    <div className="pt-4 flex justify-between items-center text-sm">
                      <div>
                        <span className="text-slate-400">Price</span>
                        <p className="font-medium">₹{property.price}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Rating</span>
                        <p className="font-medium text-amber-500">
                          {"★".repeat(Math.round(property.rating || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
      <Switcher />
    </>
  );
}
