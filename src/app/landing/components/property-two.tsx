"use client"; // This is a client component 👈🏽
import React from "react";
import dynamic from 'next/dynamic';
import Link from "next/link";
import Image from "next/image";

import {propertiesDetails} from "@/app/data/data";

interface propertyData{
    id: number;
    image: string;
    name: string;
    square: number;
    beds: number;
    baths: number;
    price: number;
    rating: number;
}

const TinySlider = dynamic(() => import("tiny-slider-react"),{ssr:false});
import 'tiny-slider/dist/tiny-slider.css';

import {LiaCompressArrowsAltSolid} from 'react-icons/lia'
import { LuBath, LuBedDouble } from "react-icons/lu";


const settings = {
    controls: true,
    mouseDrag: true,
    loop: true,
    rewind: true,
    autoplay: true,
    autoplayButtonOutput: false,
    autoplayTimeout: 3000,
    navPosition: "bottom",
    controlsText: ['<i class="mdi mdi-chevron-left "></i>', '<i class="mdi mdi-chevron-right"></i>'],
    nav: false,
    speed: 400,
    gutter: 0,
    responsive: {
        992: {
            items: 3
        },

        767: {
            items: 2
        },

        320: {
            items: 1
        },
    },
}

export default function PropertyTwo() {
    return (
        <>
            <div className="container lg:mt-24 mt-16">
                <div className="grid grid-cols-1 pb-8 text-center">
                    <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">Featured Properties</h3>

                    <p className="text-slate-400 max-w-xl mx-auto">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>
                </div>

                <div className="grid grid-cols-1 mt-8 relative">
                    <div className="tiny-home-slide-three">
                        <TinySlider settings={settings} >
                            {propertiesDetails.map((item:propertyData, index:number) => (
                                <div className="tiny-slide" key={index}>
                                    <div className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md dark:hover:shadow-md shadow-gray-200 dark:shadow-gray-700 dark:hover:shadow-gray-700 overflow-hidden ease-in-out duration-500 m-3">
                                        <div className="relative">
                                            <Image src={item.image} alt=""  width={0} height={0} sizes="100vw" style={{width:"100%" , height:"100%"}} priority />

                                            <div className="absolute top-4 end-4">
                                                <Link href="#" className="btn btn-icon bg-white dark:bg-slate-900 shadow-sm shadow-gray-200 dark:shadow-gray-700 !rounded-full text-slate-100 dark:text-slate-700 focus:text-red-600 dark:focus:text-red-600 hover:text-red-600 dark:hover:text-red-600"><i className="mdi mdi-heart mdi-18px"></i></Link>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="pb-6">
                                                <Link href={`/property-detail/${item.id}`} className="text-lg hover:text-green-600 font-medium ease-in-out duration-500">{item.name}</Link>

                                            </div>

                                            <ul className="py-6 border-y border-slate-100 dark:border-gray-800 flex items-center list-none">
                                                <li className="flex items-center me-4">
                                                    <LiaCompressArrowsAltSolid className="me-2 text-green-600 text-2xl" width={20}/>
                                                    <span>8000sqf</span>
                                                </li>

                                                <li className="flex items-center me-4">
                                                    <LuBedDouble className="me-2 text-green-600 text-2xl" width={20}/>
                                                    <span>4 Beds</span>
                                                </li>

                                                <li className="flex items-center">
                                                    <LuBath className="me-2 text-green-600 text-2xl" width={20}/>
                                                    <span>4 Baths</span>
                                                </li>
                                            </ul>

                                            <ul className="pt-6 flex justify-between items-center list-none">
                                                <li>
                                                    <span className="text-slate-400">Price</span>
                                                    <p className="text-lg font-medium">$5000</p>
                                                </li>

                                                <li>
                                                    <span className="text-slate-400">Rating</span>
                                                    <ul className="text-lg font-medium text-amber-400 list-none">
                                                        <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline ms-1 text-black dark:text-white">5.0(30)</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </TinySlider>
                    </div>
                </div>
            </div>


        </>
    );
}
