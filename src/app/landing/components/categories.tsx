import React from "react";
import Image from "next/image";
import Link from "next/link";
import { listingData } from "@/app/data/data";

interface ListData{
    image: string;
    title: string;
    noOfListing: number;
}

export default function Categories(){
    return(
        <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-2 mt-8 md:gap-[30px] gap-3">
            {listingData.map((item:ListData,index:number) =>{
                return(
                    <div className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl dark:hover:shadow-xl shadow-gray-200 dark:shadow-gray-700 dark:hover:shadow-gray-700 overflow-hidden ease-in-out duration-500" key={index}>
                        <Image src={item.image} width={0} height={0} sizes="100vw" style={{width:'100%', height:'auto'}} alt="" />
                        <div className="p-4">
                            <Link href="#" className="text-xl font-medium hover:text-green-600">{item.title}</Link>
                            <p className="text-slate-400 text-sm mt-1">{item.noOfListing}{" "}Listings</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}