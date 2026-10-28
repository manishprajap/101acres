"use client";
import React, { useState, useEffect } from "react";
import { counterData } from "../data/data";
import Navbar from "../landing/components/navbar";
import About from "../landing/components/about";
import Feature from "../landing/components/feature";
import Counter from "../landing/components/counter";
import Team from "../landing/components/team";
import ClientTwo from "../landing/components/client-two";
import GetInTuch from "../landing/components/get-in-touch";
import Footer from "../landing/components/footer";
import Switcher from "../landing/components/switcher";

interface CounterData {
  title: string;
  target: number;
}

export default function Aboutus() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2 seconds ka fake loading delay
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen text-white bg-transparent">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-20 w-20"></div>
      {/* loader CSS inline */}
      <style>{`
        .loader {
          border-top-color: rgb(110, 189, 36);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


  return (
    <>
      <Navbar navClass="navbar-white" topnavClass={""} tagline={false} />
      <section
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="relative table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover"
      >
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">
              About Us
            </h3>
          </div>
        </div>
      </section>
      <div className="relative">
        <div className="shape overflow-hidden z-1 text-white dark:text-slate-900">
          <svg
            viewBox="0 0 2880 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>
      <section className="relative md:pb-24 pb-16">
        <About />
        <Feature />
      </section>
      <section
        style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
        className="relative py-24 bg-no-repeat bg-center bg-fixed bg-cover"
      >
        <div className="absolute inset-0 bg-slate-900/60"></div>
        <div className="container relative">
          <div className="grid lg:grid-cols-12 grid-cols-1 md:text-start text-center justify-center">
            <div className="lg:col-start-2 lg:col-span-10">
              <div className="grid md:grid-cols-3 grid-cols-1 items-center">
                {counterData.map((item: CounterData, index: number) => {
                  return (
                    <div className="counter-box text-center" key={index}>
                      <h1 className="text-white lg:text-5xl text-4xl font-semibold mb-2">
                        <Counter start={0} end={item.target}></Counter>+
                      </h1>
                      <h5 className="counter-head text-white text-lg font-medium">
                        {item.title}
                      </h5>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <Team />
      </section>
      <section className="md:pb-24 pb-16">
        <ClientTwo />
        <GetInTuch />
      </section>

      <Footer />
      <Switcher />
    </>
  );
}
