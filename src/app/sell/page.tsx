import React from "react";

import Navbar from '../landing/components/navbar'
import Footer from '../landing/components/footer'
import Switcher from "../landing/components/switcher";
import Feature from "../landing/components/feature";
import GetInTuch from "../landing/components/get-in-touch";
import Brokerage from "../landing/components/brokerage";


export default function Sell(){
    return(
        <>
          <Navbar navClass="navbar-white" topnavClass={""} tagline={false} />
          <section
                style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
                className="relative table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover">
                <div className="absolute inset-0 bg-slate-900/80"></div>
                <div className="container relative">
                    <div className="grid grid-cols-1 text-center mt-10">
                        <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">Sell Faster Save Thousands.</h3>
                    </div>
                </div>
            </section>
            <div className="relative">
                <div className="shape overflow-hidden z-1 text-white dark:text-slate-900">
                    <svg viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z" fill="currentColor"></path>
                    </svg>
                </div>
            </div>
            <section className="relative md:pb-24 pb-16">
                <Feature />
                <div className="container lg:mt-24 mt-16">
                    <div className="grid grid-cols-1 pb-8 text-center">
                        <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">Brokerage Calculator</h3>

                        <p className="text-slate-400 max-w-xl mx-auto">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>
                    </div>

                    <div className="md:flex justify-center mt-8">
                        <div className="lg:w-3/5 md:w-4/5">
                            <div className="p-6 shadow-sm shadow-gray-200 dark:shadow-gray-700 rounded-md" role="form">
                                <ul className="list-none flex justify-between">
                                    <li className="h6">Min $ 10000</li>
                                    <li className="h6">Max $ 200000</li>
                                </ul>

                                <Brokerage/>
                            </div>
                        </div>
                    </div>
                </div>
               <GetInTuch/>
            </section>
            <Footer />
            <Switcher />
        </>
    )
}