'use client'
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { FiCamera } from "react-icons/fi";

export default function PropertyImage(){
    let [isOpen, setIsOpen] = useState<boolean>(false);

    let [photoIndex, setActiveIndex] = useState<number>(0);

    const images = [
        '/images/property/single/1.jpg',
        '/images/property/single/2.jpg',
        '/images/property/single/3.jpg',
        '/images/property/single/4.jpg',
        '/images/property/single/5.jpg'
      ];

      const slides = images.map((image) => ({ src: image }));
      let handleCLick = (index:number) => {
        setActiveIndex(index)
        setIsOpen(true);
    }
    return(
        <div className="md:flex mt-4">
            <div className="lg:w-1/2 md:w-1/2 p-1">
                <div className="group relative overflow-hidden">
                    <Image src="/images/property/single/1.jpg" alt="" width={0} height={0} sizes="100vw" style={{width:"100%", height:"auto"}} priority />
                    <div className="absolute inset-0 group-hover:bg-slate-900/70 duration-500 ease-in-out"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 start-0 end-0 text-center invisible group-hover:visible">
                        <Link href="#" onClick={() => handleCLick(0)} className="btn btn-icon bg-green-600 hover:bg-green-700 text-white !rounded-full lightbox"><FiCamera width={18}/></Link>
                    </div>
                </div>
            </div>

            <div className="lg:w-1/2 md:w-1/2">
                <div className="flex">
                    <div className="w-1/2 p-1">
                        <div className="group relative overflow-hidden">
                            <Image src="/images/property/single/2.jpg" alt="" width={0} height={0} sizes="100vw" style={{width:"100%", height:"auto"}} priority />
                            <div className="absolute inset-0 group-hover:bg-slate-900/70 duration-500 ease-in-out"></div>
                            <div className="absolute top-1/2 -translate-y-1/2 start-0 end-0 text-center invisible group-hover:visible">
                                <Link href="#" onClick={() => handleCLick(1)} className="btn btn-icon bg-green-600 hover:bg-green-700 text-white !rounded-full lightbox"><FiCamera width={18}/></Link>
                            </div>
                        </div>
                    </div>

                    <div className="w-1/2 p-1">
                        <div className="group relative overflow-hidden">
                            <Image src="/images/property/single/3.jpg" alt="" width={0} height={0} sizes="100vw" style={{width:"100%", height:"auto"}} priority />
                            <div className="absolute inset-0 group-hover:bg-slate-900/70 duration-500 ease-in-out"></div>
                            <div className="absolute top-1/2 -translate-y-1/2 start-0 end-0 text-center invisible group-hover:visible">
                                <Link href="#" onClick={() => handleCLick(2)} className="btn btn-icon bg-green-600 hover:bg-green-700 text-white !rounded-full lightbox"><FiCamera width={18}/></Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div className="w-1/2 p-1">
                        <div className="group relative overflow-hidden">
                            <Image src="/images/property/single/4.jpg" alt="" width={0} height={0} sizes="100vw" style={{width:"100%", height:"auto"}} priority />
                            <div className="absolute inset-0 group-hover:bg-slate-900/70 duration-500 ease-in-out"></div>
                            <div className="absolute top-1/2 -translate-y-1/2 start-0 end-0 text-center invisible group-hover:visible">
                                <Link href="#" onClick={() => handleCLick(3)} className="btn btn-icon bg-green-600 hover:bg-green-700 text-white !rounded-full lightbox"><FiCamera width={18}/></Link>
                            </div>
                        </div>
                    </div>

                    <div className="w-1/2 p-1">
                        <div className="group relative overflow-hidden">
                            <Image src="/images/property/single/5.jpg" alt="" width={0} height={0} sizes="100vw" style={{width:"100%", height:"auto"}} priority />
                            <div className="absolute inset-0 group-hover:bg-slate-900/70 duration-500 ease-in-out"></div>
                            <div className="absolute top-1/2 -translate-y-1/2 start-0 end-0 text-center invisible group-hover:visible">
                                <Link href="#" onClick={() => handleCLick(4)} className="btn btn-icon bg-green-600 hover:bg-green-700 text-white !rounded-full lightbox"><FiCamera width={18}/></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Lightbox open={isOpen} close={() => setIsOpen(false)} slides={slides} index={photoIndex}/>
        </div>
    )
}