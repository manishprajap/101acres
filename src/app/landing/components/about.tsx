"use client"; // This is a client component 👈🏽
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function About() {
    const [isOpen, setOpen] = useState(false)

    return (
        <>
            <div className="container lg:mt-24 mt-16">
                <div className="grid lg:grid-cols-12 grid-cols-1 items-center gap-[30px]">

                    <div className="px-6 py-12 w-full text-center lg:col-span-12">
                        <h4 className="text-gray-800 text-lg font-semibold tracking-widest uppercase mb-2">Our Company</h4>
                        <h1 className="text-5xl font-bold text-gray-900 mb-12">Who we are</h1>

                        <div className="max-w-7xl mx-auto text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Global Presence */}
                                <div>
                                    <h2 className="text-xl text-green-800 font-bold uppercase mb-4">Global Presence</h2>
                                    <p className="text-green-600 font-semibold text-lg leading-relaxed mb-4">
                                        At 101 Acres Properties, our global presence defines our commitment to excellence in the real estate industry.
                                        With a passion for connecting people with their ideal properties, we have established ourselves as a trusted
                                        name in international real estate service. Our diverse team of experts combines extensive market knowledge with
                                        a deep understanding of local cultures and trends.
                                    </p>
                                    <p className="text-gray-700 leading-relaxed">
                                        From luxurious residences to prime commercial spaces, we offer a comprehensive range of properties across the
                                        globe. Backed by a legacy of professionalism and integrity, we continue to set new standards for client
                                        satisfaction, making dreams of owning exceptional properties worldwide a reality.
                                    </p>
                                </div>

                                {/* Responsibility */}
                                <div>
                                    <h2 className="text-xl text-green-800 font-bold uppercase mb-4">Responsibility</h2>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        At 101 Acres Properties, we take our responsibilities seriously. As a leading real estate company, we understand
                                        the significance of guiding clients through their property journeys with care and expertise. Our commitment
                                        goes beyond transactions – we prioritize building lasting relationships based on trust and transparency. We
                                        strive to provide accurate and up-to-date information, enabling clients to make informed decisions.
                                    </p>
                                    <p className="text-gray-700 leading-relaxed">
                                        From initial consultations to property viewings and negotiations, we shoulder the responsibility of ensuring a
                                        smooth and seamless experience. With a dedication to ethical practices and customer satisfaction, we’re here to
                                        fulfill our responsibilities as your trusted partner in the world of real estate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="bg-[url('/images/about1.jpg')] bg-cover bg-center bg-no-repeat h-screen flex items-center justify-center"
            >

            </div>


            <div className="max-w-7xl mx-auto text-left mt-15">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Global Presence */}
                    <div>
                        <h2 className="text-xl text-green-800 font-bold uppercase mb-4">Responsibility</h2>
                        <p className="text-gray-700  text-lg leading-relaxed mb-4">
                            At 101 Acres Properties, we take pride in upholding a diverse range of responsibilities integral to our ethos. As a leading real estate company, we are resolutely committed to not just meeting but exceeding the expectations of our clients. Our responsibilities extend to curating a portfolio of properties that exemplify quality and value. We diligently analyze market trends to offer insights that empower clients to make well-informed choices.


                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Navigating the complexities of transactions, we prioritize safeguarding our clients’ interests throughout negotiations and documentation. With an unwavering dedication to ethical practices, professionalism, and client-centricity, we embrace our responsibilities as stewards of seamless, trustworthy, and rewarding real estate journeys.
                        </p>
                    </div>

                    {/* Responsibility */}
                    <div>
                        <h2 className="text-xl text-green-800 font-bold uppercase mb-4">Our Mission</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            At 101 Acres Properties, our mission is to redefine the real estate experience. We are driven by the commitment to provide unparalleled services that transform property transactions into seamless and enriching journeys. With a focus on innovation, transparency, and client empowerment, we aim to set new industry benchmarks. Our mission encompasses assisting clients in finding not just properties, but homes that resonate with their dreams and aspirations.


                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            By merging cutting-edge technology with personalized guidance, we strive to make property search, buying, and selling an efficient and satisfying process. With every interaction, we stand dedicated to realizing our mission of shaping the future of real estate.
                        </p>
                    </div>
                </div>
            </div>



            {isOpen &&
                <div className="flex bg-[#00000099] overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
                    <div className="relative p-1 w-full max-w-2xl max-h-full">
                        <div className="relative bg-white rounded-lg shadow-xs dark:bg-gray-700">
                            <div className="flex items-center justify-between p-1 border-b rounded-t dark:border-gray-600 border-gray-200">
                                <button type="button" onClick={() => setOpen(!isOpen)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                    </svg>
                                    <span className="sr-only">Close modal</span>
                                </button>
                            </div>
                            <div className="p-1 md:p-1 space-y-4">
                                <iframe width="100%" height="400" src="https://www.youtube.com/embed/yba7hPeTSjk?playlist=yba7hPeTSjk&loop=1"></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>
    );

}
