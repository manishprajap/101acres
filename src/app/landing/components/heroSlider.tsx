// @ts-nocheck
'use client'
import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay} from 'swiper/modules';

import 'swiper/css';


export default function HeroSlider(){
    return(
        <section className="swiper-slider-hero relative block h-screen" id="home">
            <div className="swiper-container absolute end-0 top-0 size-full">
                <Swiper className="swiper-wrapper"   
                    modules={[Autoplay]} autoplay={{
                    delay: 3000, // 3 seconds
                    disableOnInteraction: false,
                    loop :true,
                    speed:5000
                }}>
                    <SwiperSlide className="swiper-slide flex items-center overflow-hidden">
                        <div className="slide-inner absolute end-0 top-0 size-full slide-bg-image flex items-center bg-center;" style={{backgroundImage:`url('/images/bg/01.jpg')`, height:'100vh'}}>
                            <div className="absolute inset-0 bg-slate-900/70"></div>
                            <div className="container relative">
                                <div className="grid grid-cols-1">
                                    <div className="text-center">
                                        <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-5xl mb-6">Easy way to find your <br/> dream property</h1>
                                        <p className="text-white/70 text-xl max-w-xl mx-auto">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>
                                        
                                        <div className="mt-6">
                                            <a href="" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md">See More</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> 
                    </SwiperSlide> 

                    <SwiperSlide className="swiper-slide flex items-center overflow-hidden">
                        <div className="slide-inner absolute end-0 top-0 size-full slide-bg-image flex items-center bg-center;" style={{backgroundImage:`url('/images/bg/02.jpg')`, height:'100vh'}}>
                            <div className="absolute inset-0 bg-slate-900/70"></div>
                            <div className="container relative">
                                <div className="grid grid-cols-1">
                                    <div className="text-center">
                                        <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-5xl mb-6">We will help you find <br/> your Wonderful home</h1>
                                        <p className="text-white/70 text-xl max-w-xl mx-auto">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>
                                        
                                        <div className="mt-6">
                                            <a href="" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md">See More</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> 
                    </SwiperSlide>
                </Swiper>


                <div className="swiper-button-next bg-transparent size-[35px] leading-[35px] -mt-[30px] bg-none border border-solid border-white/50 text-white hover:bg-green-600 hover:border-green-600 rounded-full text-center"></div>
                <div className="swiper-button-prev bg-transparent size-[35px] leading-[35px] -mt-[30px] bg-none border border-solid border-white/50 text-white hover:bg-green-600 hover:border-green-600 rounded-full text-center"></div>
            </div>
        </section>
    )
}