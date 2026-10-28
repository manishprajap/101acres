'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { LiaCompressArrowsAltSolid } from 'react-icons/lia';
import { LuBath, LuBedDouble } from 'react-icons/lu';
import { FiPhone, FiCamera } from 'react-icons/fi';

import Navbar from '@/app/landing/components/navbar';
import Footer from '@/app/landing/components/footer';
import Switcher from '@/app/landing/components/switcher';

import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function PropertiesDetail() {
  const params = useParams();
  const propertyId = parseInt(params?.id as string, 10);

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/property-detail/${propertyId}`);
        const data = await res.json();

        setProperty(data);
      } catch (error) {
        console.error('Failed to fetch property:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) fetchProperty();
  }, [propertyId]);

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!property) return <p className="text-center mt-20">Property not found.</p>;

  // ✅ SAFELY PARSE IMAGES
  const images: string[] = (() => {
    try {
      return Array.isArray(property?.image)
        ? property.image
        : JSON.parse(property?.image || '[]');
    } catch {
      return [];
    }
  })();

  const slides = images.map((src) => ({
    src: `/uploads/${src.replace(/^\/+/, '')}` // adjust path if needed
  }));

  const handleClick = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  // ✅ DYNAMIC "FOR SALE" / "FOR RENT" LABEL
  // DB column is `property_For` and stores "Sale" or "Rent".
  const isForRent = String(property?.propertyFor ?? '').toLowerCase().includes('rent');
  const listingLabel = isForRent ? 'For Rent' : 'For Sale';

  const DEFAULT_MAP_URL =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.564201114947!2d80.9238528!3d26.8566528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399be2c3c737d6f7%3A0x5788d9c6b4a4c97f!2sYour%20Place!5e0!3m2!1sen!2sin!4v16987654321";

  // ✅ MORE ROBUST MAP URL BUILDER
  // Handles 3 cases so the map actually reflects the property's address:
  // 1) An already-ready embed URL (from Google's "Share > Embed a map")
  // 2) A regular Google Maps link that contains coordinates (...@lat,lng,zoom...)
  // 3) Plain text saved directly — an address, place name, or a "lat,lng" pair
  // NOTE: shortened share links like maps.app.goo.gl/xyz can't be parsed
  // reliably client-side — store a full address or "lat,lng" instead.
  const getMapUrl = (location?: string) => {
    if (!location) return DEFAULT_MAP_URL;

    if (location.includes('/maps/embed')) return location;

    const coordsMatch = location.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      const [, lat, lng] = coordsMatch;
      return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  };

  return (
    <>
      <Navbar navClass={''} topnavClass={''} tagline={false} />
      <section className="relative md:pb-24 pb-16 mt-20">
        <div className="container-fluid px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
            {images.map((img: string, index: number) => (
              <div key={index} className="group relative overflow-hidden">
                <Image
                  src={`/uploads/${img.replace(/^\/+/, '')}`}
                  alt={`Property Image ${index + 1}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  unoptimized
                />
                <div className="absolute inset-0 group-hover:bg-slate-900/70 duration-500 ease-in-out"></div>
                <div className="absolute top-1/2 -translate-y-1/2 start-0 end-0 text-center invisible group-hover:visible">
                  <button
                    onClick={() => handleClick(index)}
                    className="btn btn-icon bg-green-600 hover:bg-green-700 text-white !rounded-full"
                  >
                    <FiCamera width={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Lightbox open={isOpen} close={() => setIsOpen(false)} slides={slides} index={photoIndex} />
        </div>

        <div className="container md:mt-24 mt-16">
          <div className="md:flex">
            <div className="lg:w-2/3 md:w-1/2 md:p-4 px-3">
              <h4 className="text-2xl font-medium">{property.title}</h4>
              <ul className="py-6 flex items-center list-none">
                <li className="flex items-center lg:me-6 me-4">
                  <LiaCompressArrowsAltSolid className="lg:text-3xl text-2xl me-2 text-green-600" />
                  <span className="lg:text-xl">{property.area} sqf</span>
                </li>
                {property.bed != null && (
                  <li className="flex items-center lg:me-6 me-4">
                    <LuBedDouble className="lg:text-3xl text-2xl me-2 text-green-600" />
                    <span className="lg:text-xl">{property.bed} Beds</span>
                  </li>
                )}
                {property.bath != null && (
                  <li className="flex items-center">
                    <LuBath className="lg:text-3xl text-2xl me-2 text-green-600" />
                    <span className="lg:text-xl">{property.bath} Baths</span>
                  </li>
                )}
              </ul>

              <p className="text-slate-400 mt-4">{property.description}</p>

				<div className="w-full leading-[0] border-0 mt-6">
				  <iframe
					title="map"
					src={getMapUrl(property?.googleLocation)}
					className="w-full h-[500px]"
					allowFullScreen
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
					style={{ border: 0 }}
				  />
				</div>
            </div>

            <div className="lg:w-1/3 md:w-1/2 md:p-4 px-3 mt-8 md:mt-0">
              <div className="sticky top-20">
                <div className="rounded-md bg-slate-50 dark:bg-slate-800 shadow-sm shadow-gray-200 dark:shadow-gray-700">
                  <div className="flex gap-2 px-6 pt-4">
                    <p>Type:</p>
                    <span className="bg-green-600/10 text-green-600 text-sm px-2.5 py-0.75 rounded h-6">
                      {property.propertyType}
                    </span>
                  </div>
                  <div className="p-6">
                    <h5 className="text-2xl font-medium">Price:</h5>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xl font-medium">₹ {property.price}</span>
                      <span className="bg-green-600/10 text-green-600 text-sm px-2.5 py-0.75 rounded h-6">
                        {listingLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="p-1 w-1/2">
                      <Link href="#" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md w-full">
                        Book Now
                      </Link>
                    </div>
                    <div className="p-1 w-1/2">
                      <Link href="#" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md w-full">
                        Offer Now
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <h3 className="mb-6 text-xl leading-normal font-medium text-black dark:text-white">
                    Have Question? Get in touch!
                  </h3>
                  <div className="mt-6">
                    <Link
                      href="/contact"
                      className="btn bg-transparent hover:bg-green-600 border border-green-600 text-green-600 hover:text-white rounded-md"
                    >
                      <FiPhone className="align-middle me-2" /> Contact us
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <Switcher />
    </>
  );
}