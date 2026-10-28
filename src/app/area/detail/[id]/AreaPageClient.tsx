"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch } from "react-icons/fi";
import { FaHome } from "react-icons/fa";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { LuBedDouble, LuBath } from "react-icons/lu";

import Navbar from "@/app/landing/components/navbar";
import Footer from "@/app/landing/components/footer";
import Switcher from "@/app/landing/components/switcher";
import { Property } from "@/types/property";

interface Props {
  properties: Property[];
  areaId: string;
}

const getParsedImage = (imageStr: string | undefined): string => {
  if (!imageStr) return "/images/property/1.jpg"; // fallback image path

  try {
    const parsed = JSON.parse(imageStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    } else if (typeof parsed === "string") {
      return parsed;
    } else {
      return "/images/property/1.jpg";
    }
  } catch {
    return imageStr;
  }
};

export default function AreaPageClient({ properties, areaId }: Props) {
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  // const [loading, setLoading] = useState(true);
  const handleSearch = (propertyFor?: string) => {
    const filtered = properties.filter((p) => {
      const matchesKeyword = p.title.toLowerCase().includes(keyword.toLowerCase());
      const matchesCategory = category
        ? p.propertyType?.toLowerCase() === category.toLowerCase()
        : true;
      const matchesMin = minPrice ? Number(p.price) >= Number(minPrice) : true;
      const matchesMax = maxPrice ? Number(p.price) <= Number(maxPrice) : true;
      // const [expanded, ] = useState<{ [key: number]: boolean }>({});

      const matchesPropertyFor = propertyFor
        ? p.propertyFor?.toLowerCase() === propertyFor.toLowerCase()
        : true;

      return matchesKeyword && matchesCategory && matchesMin && matchesMax && matchesPropertyFor;
    });

    setFilteredProperties(filtered);
  };
  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
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
            <h3 className="md:text-4xl text-3xl font-medium text-white">Properties in Area</h3>
          </div>
        </div>
      </section>

      <section className="relative md:pb-24 pb-16">
        <div className="container">
          <div className=" -mt-32">
            {/* Filter Buttons */}
            <div className="w-max bg-white px-6 flex gap-2 pt-1 rounded-tl-xl rounded-tr-xl">
              <button
                onClick={() => handleSearch("Sale")}
                className="text-gray-700 px-4 rounded-md hover:bg-green-500 transition-all"
              >
                Sale
              </button>
              <button
                onClick={() => handleSearch("Rent")}
                className="text-gray-700 px-4 rounded-md hover:bg-green-500 transition-all"
              >
                Rent
              </button>
              <button
                onClick={() => handleSearch()}
                className="text-gray-700 px-4 py-2 rounded-md hover:bg-green-500 transition-all"
              >
                All Properties
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Keyword */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-md font-medium text-gray-700 flex">
                    Search: <span className="text-red-600">*</span>
                  </label>
                  <div className="relative mt-1">
                    <FiSearch className="absolute left-3 top-2.5 text-green-500" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Search your Keywords"
                      className="w-full pl-10 pr-4 py-2 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="min-w-[200px]">
                  <label className="text-md font-medium text-gray-700">Select Categories:</label>
                  <div className="relative mt-1">
                    <FaHome className="absolute left-3 top-2.5 text-green-500" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select...</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                {/* Price Range */}
                <div className="min-w-[170px]">
                  <label className="text-md font-medium text-gray-700">Min Price:</label>
                  <div className="relative">
                    <HiOutlineCurrencyDollar className="absolute left-3 top-2.5 text-green-500 text-[20px]" />
                    <select
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select...</option>
                      <option value="1000">₹  1,000</option>
                      <option value="5000">₹  5,000</option>
                      <option value="10000">₹  10,000</option>
                    </select>
                  </div>
                </div>

                <div className="min-w-[170px]">
                  <label className="text-md font-medium text-gray-700">Max Price:</label>
                  <div className="relative mt-1">
                    <HiOutlineCurrencyDollar className="absolute left-3 top-2.5 text-green-500 text-[20px]" />
                    <select
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select...</option>
                      <option value="20000">₹  20,000</option>
                      <option value="50000">₹  50,000</option>
                      <option value="100000">₹  100,000</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSearch()}
                className="bg-green-600 text-white px-6 py-2 mt-4 rounded-md hover:bg-green-700 transition-all"
              >
                🔎 Search
              </button>
            </div>
          </div>

          {/* Properties */}
          <div className="lg:mt-24 mt-16">
            {filteredProperties.length === 0 ? (
              <p className="text-center text-red-500 mt-10">No properties found.</p>
            ) : (
              <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-[30px] mt-8">
                {filteredProperties.map((property) => {
                  const imageSrc = `/uploads/${getParsedImage(property.image).replace(/^\/+/, "")}`;

                  // Agar title missing hai => Article Property card
                  if (!property.title) {
                    return (
                      <div
                        key={property.id}
                        className="group rounded-xl bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md overflow-hidden transition-shadow duration-300"
                      >
                        <div className="flex items-center  ">
                        <Image
                          src={imageSrc}
                          alt="Article Property"
                          width={500}
                          height={300}
                          className="w-full h-40 object-cover"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/agency/logo1.webp";
                          }}
                          
                        />
                       {/* <span className="text-green-600 font-bold text-[18px] ">101Acres</span> */}
                        </div>
                        {property.description && (
                          <div className="p-2">
                            <p className="text-gray-700 leading-snug mb-1 " style={{ lineHeight: 1.2 }}>
                              {expanded[property.id]
                                ? property.description
                                : property.description.slice(0, 80) +
                                (property.description.length > 80 ? "..." : "")}
                            </p>

                            {property.description.length > 100 && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() =>
                                    setExpanded((prev) => ({
                                      ...prev,
                                      [property.id]: !prev[property.id],
                                    }))
                                  }
                                  className="text-blue-600 text-sm font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                >
                                  {expanded[property.id] ? "Read Less" : "Read More"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-2 pt-0">
                          <ul className="text-gray-600 text-sm space-y-1 " style={{ lineHeight: 1.2 }}>
                            <li>
                              <strong className="font-semibold">Location:</strong>{" "}
                              {property.propertyLocation || "N/A"}
                            </li>
                            <li>
                              <strong className="font-semibold">Type:</strong>{" "}
                              {property.propertyFor || "N/A"}/{property.propertyType || "N/A"}/
                              {property.residentialType || "N/A"}
                            </li>
                            <li>
                              <strong className="font-semibold">Address:</strong>{" "}
                              {property.country_name || "N/A"},
                              {property.state_name || "N/A"},
                              {property.city_name || "N/A"},
                              {property.area_name || "N/A"}
                            </li>
                          </ul>
                        </div>
                      </div>

                    );
                  }

                  // Normal Property Card
                  return (
                    <div key={property.id} className="group rounded-xl border border-gray-300 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl overflow-hidden transition duration-500">
                      <Link href={`/property-detail/${property.id}`}>
                        <Image
                          src={imageSrc}
                          alt={property.title}
                          width={500}
                          height={300}
                          className="w-full h-40 object-cover"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/property/1.jpg";
                          }}
                        />
                      </Link>

                      <div className="p-1 pt-1">
                        <div className="pb-4">
                          <Link href={`/property-detail/${property.id}`} className="text-lg font-medium hover:text-green-600 transition">
                            {property.title}
                          </Link>
                        </div>

                        <ul className="py-1 border-y border-slate-100 justify-between dark:border-gray-800 flex items-center whitespace-nowrap overflow-x-auto">
                          <li className="flex items-center ">
                            <LiaCompressArrowsAltSolid className="me-1 text-green-600" />
                            <span>{property.squareFt} ft²</span>
                          </li>
                          <li className="flex items-center ">
                            <LuBedDouble className="me-1 text-green-600" />
                            <span>{property.beds} Beds</span>
                          </li>
                          <li className="flex items-center">
                            <LuBath className="me-1 text-green-600" />
                            <span>{property.baths} Baths</span>
                          </li>
                        </ul>


                        <ul className="pt-4 flex justify-between ">
                          <li className="flex">
                            <span className="text-slate-400">Price:</span>
                            <p className="text-sm mt-1 ml-0.5 font-medium"> ₹{property.price.toLocaleString()}</p>
                          </li>
                          <li className="flex gap-1">
                            <span className="text-slate-400">Rating:</span>
                            {typeof property.rating === "number" && !isNaN(property.rating) ? (
                              <p className="text-lg font-medium text-amber-500">
                                {"★".repeat(Math.round(property.rating))}
                                <span className="text-black dark:text-white  mt-1 ml-1">({property.rating})</span>
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 mt-1">No rating</p>
                            )}
                          </li>
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <Switcher />
    </>
  );
}
