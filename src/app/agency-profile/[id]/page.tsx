'use client'
import React from 'react'

import { FiArrowRight, FiFacebook, FiInstagram, FiLinkedin, FiPhone, FiTwitter } from 'react-icons/fi'
import Link from 'next/link'
import { LiaBathSolid, LiaCompressArrowsAltSolid } from 'react-icons/lia'
import { BiBed } from 'react-icons/bi'
import Image from 'next/image'


import { useParams } from "next/navigation";
import { agencyData, agentData, properties } from '@/app/data/data'
import Navbar from '@/app/landing/components/navbar'
import Footer from '@/app/landing/components/footer'
import Switcher from '@/app/landing/components/switcher'

interface BlogData{
    id: number;
    image: string;
    name: string;
    title: string;
}

export default function Page() {
    const params = useParams(); 
    const id = parseInt(String(params?.id || 0));
    const data:BlogData | undefined = agencyData.find((item) => item?.id === id);

  return (
    <>
        <Navbar navClass={''} topnavClass={''} tagline={false}/>
        <section className="relative md:py-24 pt-24 pb-16">
            <div className="container relative">
                <div className="grid grid-cols-1">
                    <div className="p-6 rounded-md bg-green-600/10 dark:bg-green-600/20">
                        <div className="md:flex items-center">
                            <Image src={data?.image ?? ""} width={112} height={112} className="!rounded-full size-28" alt=""/>

                            <div className="md:ms-4 md:mt-0 mt-4 md:flex justify-between items-end">
                                <div>
                                    <h5 className="text-2xl font-medium">{data?.name} <span className="text-base md:inline-block md:mt-0 mt-2"><span className="text-slate-400"><span className="mdi mdi-circle-medium align-middle md:inline-block hidden"></span>Real Estate Agency</span></span></h5>

                                    <ul className="list-none mt-2 md:flex items-center md:divide-x-[1px] divide-slate-400">
                                        <li className="md:inline-flex flex">
                                            <ul className="text-amber-400 list-none">
                                                <li className="inline"><i className="mdi mdi-star align-middle"></i></li>
                                                <li className="inline"><i className="mdi mdi-star align-middle"></i></li>
                                                <li className="inline"><i className="mdi mdi-star align-middle"></i></li>
                                                <li className="inline"><i className="mdi mdi-star align-middle"></i></li>
                                                <li className="inline"><i className="mdi mdi-star align-middle"></i></li>
                                                <li className="inline text-black dark:text-white">4.84(30)</li>
                                            </ul>
                                        </li>

                                        <li className="md:inline-flex flex items-center md:mx-2 md:mt-0 mt-2 md:px-2"><FiPhone className="size-4 align-middle text-green-600 me-2"/> +(458) 456-7854</li>

                                        <li className="md:inline-flex flex items-center md:mx-2 md:mt-0 mt-2 md:px-2">
                                                <ul className="list-none">
                                                <li className="inline me-1 rtl:me-0 ms-0 rtl:ms-1"><Link href="" className="btn btn-icon btn-sm border border-gray-300 dark:border-gray-400 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600 dark:hover:border-green-600"><FiFacebook className="size-4"/></Link></li>

                                                <li className="inline me-1 rtl:me-0 ms-0 rtl:ms-1"><Link href="" className="btn btn-icon btn-sm border border-gray-300 dark:border-gray-400 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600 dark:hover:border-green-600"><FiInstagram className="size-4"/></Link></li>
                                                <li className="inline me-1 rtl:me-0 ms-0 rtl:ms-1"><Link href="" className="btn btn-icon btn-sm border border-gray-300 dark:border-gray-400 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600 dark:hover:border-green-600"><FiTwitter className="size-4"/></Link></li>
                                                <li className="inline me-1 rtl:me-0 ms-0 rtl:ms-1"><Link href="" className="btn btn-icon btn-sm border border-gray-300 dark:border-gray-400 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600 dark:hover:border-green-600"><FiLinkedin className="size-4"/></Link></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container relative mt-6">
                <div className="grid md:grid-cols-12 grid-cols-1 gap-[30px]">
                    <div className="lg:col-span-4 md:col-span-5 order-1 md:order-1">
                        <div className="p-6 rounded shadow-sm shadow-gray-200 dark:shadow-gray-700 sticky top-20">
                            <h5 className="text-xl font-medium mb-4">Contact us</h5>

                            <form>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label htmlFor="name" className="font-medium">Your Name:</label>
                                        <input name="name" id="name" type="text" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Name :"/>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="font-medium">Your Email:</label>
                                        <input name="email" id="email" type="email" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Email :"/>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="font-medium">Your Question:</label>
                                        <input name="subject" id="subject" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Subject :"/>
                                    </div>

                                    <div>
                                        <label htmlFor="comments" className="font-medium">Your Comment:</label>
                                        <textarea name="comments" id="comments" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2 textarea" placeholder="Message :"></textarea>
                                    </div>

                                    <button type="submit" id="submit" name="send" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md">Send Message</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8 md:col-span-7 order-1 md:order-2">
                        <h5 className="text-xl font-medium">About us</h5>
                        
                        <p className="text-slate-400 mt-3">Your real estate business needs a successful company name to better sell real estate and get found in more website search results and stand out on social media sites. Hello real estate agents, here is your inspiration list of catchy, unique, clever and cool, names and logos for your new small business.</p>
                        <p className="text-slate-400 mt-3">Real Estates favorite three words - Location, Location, Location - Says it all.  A well-designed logo using the best fonts can communicate your realty company benefits in just a few words, attracting potential clients - both buyers and seller listings. This list features abstract real estate logos, modern styles, classic emblems and icon designs.</p>

                        <h5 className="text-xl font-medium mt-6">Our Agents</h5>

                        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-4 gap-[30px]">
                        {agentData.slice(0,6).map((item,index)=>{
                            return(
                                <div className="group text-center" key={index}>
                                    <div className="relative inline-block mx-auto size-52 !rounded-full overflow-hidden">
                                        <Image src={item.image} width={0} height={0} sizes='100vw' style={{width:'100%', height:'auto'}} className="" alt=""/>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black size-52 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out"></div>

                                        <ul className="list-none absolute start-0 end-0 -bottom-20 group-hover:bottom-5 transition-all duration-500 ease-in-out">
                                            <li className="inline ms-1 rtl:me-1"><Link href="" className="btn btn-icon btn-sm !rounded-full border border-green-600 bg-green-600 hover:border-green-600 hover:bg-green-600 text-white"><FiFacebook className="size-4"/></Link></li>
                                            <li className="inline ms-1 rtl:me-1"><Link href="" className="btn btn-icon btn-sm !rounded-full border border-green-600 bg-green-600 hover:border-green-600 hover:bg-green-600 text-white"><FiInstagram className="size-4"/></Link></li>
                                            <li className="inline ms-1 rtl:me-1"><Link href="" className="btn btn-icon btn-sm !rounded-full border border-green-600 bg-green-600 hover:border-green-600 hover:bg-green-600 text-white"><FiLinkedin className="size-4"/></Link></li>
                                        </ul>
                                    </div>

                                    <div className="content mt-3">
                                        <Link href={`/agent-profile/${item.id}`} className="text-xl font-medium hover:text-green-600 transition-all duration-500 ease-in-out">{item.name}</Link>
                                        <p className="text-slate-400">{item.position}</p>
                                    </div>
                                </div>
                            )
                            })}
                        </div>
                        
                        <h5 className="text-xl font-medium mt-6">Our Listings</h5>

                        <div className="grid lg:grid-cols-2 grid-cols-1 mt-4 gap-[30px]">
                            {properties.slice(0,6).map((item,index)=>{
                                return(
                                    <div className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl dark:hover:shadow-xl shadow-gray-200 dark:shadow-gray-700 dark:hover:shadow-gray-700 overflow-hidden ease-in-out duration-500" key={index}>
                                        <div className="relative">
                                            <Image src={item.image} width={0} height={0} sizes='100vw' style={{width:'100%', height:'auto'}} alt=""/>
                
                                            <div className="absolute top-4 end-4">
                                                <Link href="#" className="btn btn-icon bg-white dark:bg-slate-900 shadow-sm shadow-gray-200 dark:shadow-gray-700 !rounded-full text-slate-100 dark:text-slate-700 focus:text-red-600 dark:focus:text-red-600 hover:text-red-600 dark:hover:text-red-600"><i className="mdi mdi-heart text-[20px]"></i></Link>
                                            </div>
                                        </div>
                
                                        <div className="p-6">
                                            <div className="pb-6">
                                                <Link href={`/property-detail/${item.id}`} className="text-lg hover:text-green-600 font-medium ease-in-out duration-500">{item.name}</Link>
                                            </div>
                
                                            <ul className="py-6 border-y border-slate-100 dark:border-gray-800 flex items-center list-none">
                                                <li className="flex items-center me-4">
                                                    <LiaCompressArrowsAltSolid className="text-2xl me-2 text-green-600"/>
                                                    <span>8000sqf</span>
                                                </li>
                
                                                <li className="flex items-center me-4">
                                                    <BiBed className="text-2xl me-2 text-green-600"/>
                                                    <span>4 Beds</span>
                                                </li>
                
                                                <li className="flex items-center">
                                                    <LiaBathSolid className="text-2xl me-2 text-green-600"/>
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
                                                        <li className="inline"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline"><i className="mdi mdi-star"></i></li>
                                                        <li className="inline text-black dark:text-white">5.0(30)</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
        
                        <div className="md:flex justify-center text-center mt-6">
                            <div className="md:w-full">
                                <Link href="/grid" className="btn btn-link text-green-600 hover:text-green-600 after:bg-green-600 transition duration-500">View More Properties <FiArrowRight className="ms-1"/></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        <Switcher/>
    </>
  )
}
