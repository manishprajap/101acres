'use client'
import React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const TinySlider = dynamic(()=>import('tiny-slider-react'),{ssr:false})
import 'tiny-slider/dist/tiny-slider.css';
import Image from 'next/image'
import { partnerData } from "@/app/data/data";

let images = ['/images/property/1.jpg','/images/property/2.jpg','/images/property/4.jpg']

export default function HomeBanner() {
    const settings = {
        container: '.tiny-single',
        items: 1,
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        nav: false,
        speed: 800,
        gutter: 0,
      };

  return (
    <>
    <section className="relative py-24">
        <div className="absolute inset-0 opacity-40 dark:opacity-[0.03] bg-no-repeat bg-bottom bg-cover" style={{backgroundImage:`url('/images/map.svg')`}}></div>
        <div className="container relative mt-10">
            <div className="grid md:grid-cols-12 grid-cols-1 items-center gap-[30px]">
                <div className="md:col-span-4">
                    <div className="md:text-start text-center">
                        <h1 className="font-bold lg:leading-normal leading-normal text-4xl lg:text-5xl">Lets Find a Home Thats Perfect For You!</h1>

                        <div className="mt-4">
                            <Link href="#" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md md:mt-20">Learn More <i className="mdi mdi-arrow-right ms-1 align-middle"></i></Link>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-5">
                    <div className="!rounded-full shadow-lg shadow-gray-200 dark:shadow-gray-800 relative overflow-hidden border-8 border-white dark:border-slate-900">
                        <div className="grid grid-cols-1 relative">
                            <div className="tiny-single">
                                <TinySlider settings={settings}>
                                    {images.map((item,index)=>{
                                        return(
                                            <div className="tiny-slide" key={index}>
                                                <img src={item} className="object-cover w-full lg:h-[600px] md:h-[500px]" alt=""/>
                                            </div>
                                        )
                                    })}
                                </TinySlider>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="md:text-end text-center">
                        <p className="text-slate-400 text-xl max-w-xl">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>

                        <div className="mt-4">
                            <ul className="list-none relative md:mt-20">
                                <li className="inline-block relative"><Link href="#"><Image src='/images/client/01.jpg' width={48} height={48} className="size-12 !rounded-full shadow-md shadow-slate-100 dark:shadow-slate-800 border-4 border-white dark:border-slate-900 relative hover:z-1 hover:scale-105 transition-all duration-500" alt=""/></Link></li>
                                <li className="inline-block relative -ms-4"><Link href="#"><Image src='/images/client/02.jpg' width={48} height={48} className="size-12 !rounded-full shadow-md shadow-slate-100 dark:shadow-slate-800 border-4 border-white dark:border-slate-900 relative hover:z-1 hover:scale-105 transition-all duration-500" alt=""/></Link></li>
                                <li className="inline-block relative -ms-4"><Link href="#"><Image src='/images/client/03.jpg' width={48} height={48} className="size-12 !rounded-full shadow-md shadow-slate-100 dark:shadow-slate-800 border-4 border-white dark:border-slate-900 relative hover:z-1 hover:scale-105 transition-all duration-500" alt=""/></Link></li>
                                <li className="inline-block relative -ms-4"><Link href="#"><Image src='/images/client/04.jpg' width={48} height={48} className="size-12 !rounded-full shadow-md shadow-slate-100 dark:shadow-slate-800 border-4 border-white dark:border-slate-900 relative hover:z-1 hover:scale-105 transition-all duration-500" alt=""/></Link></li>
                                <li className="inline-block relative -ms-4"><Link href="#"><Image src='/images/client/05.jpg' width={48} height={48} className="size-12 !rounded-full shadow-md shadow-slate-100 dark:shadow-slate-800 border-4 border-white dark:border-slate-900 relative hover:z-1 hover:scale-105 transition-all duration-500" alt=""/></Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <section className="pt-10">
            <div className="container relative">
                <div className="grid md:grid-cols-6 grid-cols-2 justify-center gap-[30px]">
                    {partnerData.map((item:string,index:number)=>{
                        return(
                            <div className="mx-auto py-4" key={index}>
                                <Image src={item} width={72} height={24} className="h-6" alt=""/>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    </section>
    </>
  )
}
