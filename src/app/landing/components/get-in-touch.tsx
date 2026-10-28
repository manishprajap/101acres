import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BsPencil } from 'react-icons/bs'

import { FiChevronRight, FiDribbble, FiFacebook, FiInstagram, FiLinkedin, FiMail, FiMapPin, FiPhone, FiShoppingCart, FiTwitter } from "react-icons/fi";
export default function GetInTuch(){
    return(
        <>
          <div className="relative w-full">
                                <div className="relative  bg-white dark:bg-slate-900 lg:px-8 mx-20 py-10 rounded-xl  overflow-hidden">
                                    {/* <div className="grid md:grid-cols-2 grid-cols-1 items-center gap-[30px]"> */}
                                   {/* <div className=" text-center">
                                        
                                        <span className="text-gray-800 text-center  mb-6 font-semibold " style={{ fontSize: '30px', marginBottom:'15px'}}>Trusted by</span>

                                        <div className="grid grid-cols-5 font-xl mt-5">
                                            <div className="border border-gray-200 flex items-center justify-center h-36">
                                                <Image
                                                    src="/images/img1.png"
                                                    alt="Logo 1"
                                                    width={100}
                                                    height={100}
                                                    className="object-contain grayscale"
                                                />
                                            </div>
                                            <div className="border border-gray-200 flex items-center justify-center h-36">
                                                <Image
                                                    src="/images/img2.png"
                                                    alt="Logo 2"
                                                    width={200}
                                                    height={200}
                                                    className="object-contain grayscale"
                                                />
                                            </div>
                                            <div className="border border-gray-200 flex items-center justify-center h-36">
                                                <Image
                                                    src="/images/img3.png"
                                                    alt="Logo 3"
                                                    width={200}
                                                    height={200}
                                                    className="object-contain grayscale"
                                                />
                                            </div>
                                            <div className="border border-gray-200 flex items-center justify-center h-36">
                                                <Image
                                                    src="/images/img4.png"
                                                    alt="Logo 4"
                                                    width={200}
                                                    height={200}
                                                    className="object-contain grayscale"
                                                />
                                            </div>
                                            <div className="border border-gray-200 flex items-center justify-center h-36">
                                                <Image
                                                    src="/images/img5.png"
                                                    alt="Logo 5"
                                                    width={200}
                                                    height={200}

                                                    className="object-contain grayscale"
                                                />
                                            </div>
                                        </div> 



                                    </div>*/}
                                    {/* </div> */}

                                </div>

                            </div>
        <div className="container lg:mt-24 mt-16">
        <div className="grid grid-cols-1 text-center">
            <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-medium text-black dark:text-white">Have Question ? Get in touch!</h3>

            <p className="text-slate-400 max-w-xl mx-auto">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>

            <div className="mt-6">
                <Link href="/contact" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md"><FiPhone className="align-middle me-2"/> Contact us</Link>
            </div>
        </div>
    </div>
    </>
    )
}