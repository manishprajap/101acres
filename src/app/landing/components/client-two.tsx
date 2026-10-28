'use client'
import React from "react";
import dynamic from 'next/dynamic';
import Image from "next/image";

const TinySlider = dynamic(() => import("tiny-slider-react"),{ssr:false});
import 'tiny-slider/dist/tiny-slider.css';
import { review } from "@/app/data/data";


interface Review{
    id: string;
    profile: string;
    name: string;
    designation: string;
    description: string;
}


const settings = {
    controls: false,
    mouseDrag: true,
    loop: true,
    rewind: true,
    autoplay: true,
    autoplayButtonOutput: false,
    autoplayTimeout: 3000,
    navPosition: "bottom",
    speed: 400,
    gutter: 12,
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
};

export default function ClientTwo() {
    return (
        <>
            <div className="container lg:mt-24 mt-16">
                <div className="grid grid-cols-1 pb-8 text-center">
                    <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">What Our Client Say ?</h3>

                    <p className="text-slate-400 max-w-xl mx-auto">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>
                </div>

                <div className="flex justify-center relative mt-8">
                    <div className="relative w-full">   
                        <div className="tiny-three-item">
                            <TinySlider settings={settings} >
                                {review.map((el:Review, index:number) => (
                                    <div className="tiny-slide" key={index}>
                                        <div className="text-center mx-3">
                                            <p className="text-lg text-slate-400 italic">  {el.description}  </p>

                                            <div className="text-center mt-5">
                                                <ul className="text-xl font-medium text-amber-400 list-none mb-2">
                                                    <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                    <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                    <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                    <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                    <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                </ul>

                                                <Image src={el.profile} className="h-14 w-14 !rounded-full shadow-md shadow-gray-200 dark:shadow-gray-700 mx-auto" alt="" width={56} height={56} priority />
                                                <h6 className="mt-2 fw-semibold">{el.name}</h6>
                                                <span className="text-slate-400 text-sm">{el.designation}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </TinySlider>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

}


