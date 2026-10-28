'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"
import { reviewData } from '../data/data'

interface ReviewData{
    image: string;
    name: string;
    title: string;
    desc: string;
}

export default function Client() {
  return (
    <div className="">
    <ResponsiveMasonry
        columnsCountBreakPoints={{350: 1, 750: 2, 900: 3 , 1200:4}}
    >
        <Masonry>
            {reviewData.map((item:ReviewData,index:number) =>{
            return(
                <div className="picture-item p-3" key={index}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:shadow-gray-800 p-6">
                        <div className="flex items-center pb-6 border-b border-gray-100 dark:border-gray-800">
                            <Image src={item.image} width={64} height={64} className="h-16 w-16 rounded-full shadow-sm dark:shadow-gray-800" alt=""/>

                            <div className="ps-4">
                                <Link href="" className="text-lg hover:text-green-600 duration-500 ease-in-out">{item.name}</Link>
                                <p className="text-slate-400">{item.title}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-slate-400">{item.desc}</p>
                            <ul className="list-none mb-0 text-amber-400 mt-2">
                                <li className="inline"><i className="mdi mdi-star"></i></li>
                                <li className="inline"><i className="mdi mdi-star"></i></li>
                                <li className="inline"><i className="mdi mdi-star"></i></li>
                                <li className="inline"><i className="mdi mdi-star"></i></li>
                                <li className="inline"><i className="mdi mdi-star"></i></li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
            })}
        </Masonry>
    </ResponsiveMasonry>
</div>
  )
}
