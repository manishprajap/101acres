'use client'
import React, { useEffect, useState } from "react";
import Navbar from "../app/landing/components/navbar";
import GetInTuch from "../app/landing/components/get-in-touch";
import FormThree from "../app/landing/components/formThree";
import Feature from "../app/landing/components/feature";
//import Subscription from "./pricing/page";
// import About from "./components/about";
import Footer from "../app/landing/components/footer";
import Property from "../app/landing/components/property";
import Client from "../app/landing/components/client";
import Switcher from "../app/landing/components/switcher";
import Help from "../app/landing/components/help";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const images: string[] = [
    '/images/bg/01.jpg',
    '/images/bg/02.jpg',
    '/images/bg/03.jpg',
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isOpen, setOpen] = useState<boolean>(false); // Define isOpen state

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change background every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar navClass={""} topnavClass={""} tagline={false} />


      {/* Hero Start  */}
      <section className="relative mt-20">
        <div className="container-fluid md:mx-4 mx-2">
          <div style={{ backgroundImage: `url(${images[currentImageIndex]})` }} className="relative pt-40 pb-52 table w-full rounded-2xl shadow-md overflow-hidden bg-no-repeat bg-center bg-cover" id="home">
            <div className="absolute inset-0 bg-slate-900/60"></div>

            <div className="container relative">
              <div className="grid grid-cols-1">
                <div className="md:text-start text-center">
                  <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-5xl mb-6">We will help you find <br /> your <span className="text-green-600">Wonderful</span> home</h1>
                  <p className="text-white/70 text-xl max-w-xl">A great platform to buy, sell and rent your properties without any agent or commissions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Hero End */}
      <section className="relative md:pb-24 pb-16">
        <div className="container">
          <div className="grid grid-cols-1 justify-center">
            <div className="relative -mt-32">
              <FormThree />
            </div>
          </div>
        </div>
        <Property />




        {/* <Feature /> */}
        {/* <Subscription /> */}
        <Client />
        <Help />
        <GetInTuch />
      </section>
      <Footer />
      <Switcher />
    </>
  );
}
