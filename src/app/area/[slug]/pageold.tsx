"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { LuBedDouble, LuBath } from "react-icons/lu";
import Navbar from "@/app/landing/components/navbar";
import FormThree from "@/app/landing/components/formThree";
import Footer from "@/app/landing/components/footer";
import Switcher from "@/app/landing/components/switcher";


interface Props {
  params: { slug: string };
}

const parseImages = (imageString: string): string[] => {
  try {
    return JSON.parse(imageString);
  } catch (err) {
    return [];
  }
};

export default function AreaPage({ params }: Props) {
  const { slug } = params;
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/properties-by-area?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setProperties(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
              Featured Property
            </h3>
          </div>
        </div>
       
      </section>

      
        <section className="relative md:pb-24 pb-16">
                <div className="container">
                  <div className="grid grid-cols-1 justify-center">
                    <div className="relative -mt-32">
                      <FormThree />
                    </div>
                  </div>
                </div>
      <div className="container lg:mt-24 mt-16">
                {loading ? (
          <p className="text-center text-slate-400">Loading property...</p>
        ) : properties.length === 0 ? (
          <p className="text-center text-red-500">No properties found.</p>
        ) : (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
            {properties.map((property) => {
              const images = parseImages(property.image);
              const thumbnail = images[0] || "/images/default-property.jpg";

              return (
                <div
                  key={property.id}
                  className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl overflow-hidden transition duration-500"
                >
                  <Link href={`/landing/property-detail/${property.id}`}>
                    <Image
                      src={thumbnail}
                      alt={property.title}
                      width={500}
                      height={300}
                      className="w-full h-60 object-cover"
                    />
                  </Link>

                  <div className="p-6">
                    <div className="pb-4">
                      <Link
                        href={`/property-detail/${property.id}`}
                        className="text-lg font-medium hover:text-green-600 transition"
                      >
                        {property.title}
                      </Link>
                    </div>

                    <ul className="py-4 border-y border-slate-100 dark:border-gray-800 flex items-center">
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

                    <ul className="pt-4 flex justify-between items-center">
                      <li>
                        <span className="text-slate-400">Price</span>
                        <p className="text-sm font-medium">
                          ${property.price.toLocaleString()}
                        </p>
                      </li>
                      <li>
                        <span className="text-slate-400">Rating</span>
                        {typeof property.rating === "number" &&
                        !isNaN(property.rating) ? (
                          <p className="text-lg font-medium text-amber-500">
                            {"★".repeat(Math.round(property.rating))}
                            <span className="text-black dark:text-white ml-1">
                              ({property.rating})
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">No rating</p>
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
        </section>
      <Footer />
      <Switcher />
    </>
  );
}
