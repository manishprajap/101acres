import React from "react";
import Link from "next/link";
import Image from "next/image";

import Wrapper from "../components/wrapper";
import UplodProfileImg from "../components/uplodProfileImg";

import { propertiesData } from "../data/data";
import { FiBookmark, FiGift, FiGlobe, FiItalic, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

interface PropertiesData{
    id: number;
    image: string;
    name: string;
    sqf: string;
    beds: string;
    baths: string;
    value: string;
}

export default function Profile(){
    return(
        <Wrapper>
            <div className="container-fluid relative px-3">
                <div className="layout-specing">
                    <div className="grid grid-cols-1">
                        <div className="profile-banner relative text-transparent rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 overflow-hidden">
                            <input id="pro-banner" name="profile-banner" type="file" className="hidden"/>
                            <div className="relative shrink-0">
                                <img src='/images/bg.jpg' className="h-80 w-full object-cover" id="profile-banner" alt=""/>
                                <div className="absolute inset-0 bg-slate-900/70"></div>
                                <label className="absolute inset-0 cursor-pointer" htmlFor="pro-banner"></label>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-12 grid-cols-1">
                        <div className="xl:col-span-3 lg:col-span-4 md:col-span-4 mx-6">
                            <div className="p-6 relative rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 bg-white dark:bg-slate-900 -mt-48">
                                <UplodProfileImg/>

                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    <h5 className="text-xl font-semibold mt-4">Personal Details :</h5>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            <FiMail className="fea icon-ex-md text-slate-400 me-3 w-6 h-6"/>
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Email :</h6>
                                                <Link href="" className="text-slate-400">calvin@hotmail.com</Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <FiBookmark className="fea icon-ex-md text-slate-400 me-3 w-6 h-6"/>
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Skills :</h6>
                                                <Link href="" className="text-slate-400">html</Link>, <Link href="" className="text-slate-400">css</Link>, <Link href="" className="text-slate-400">js</Link>, <Link href="" className="text-slate-400">mysql</Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <FiItalic className="fea icon-ex-md text-slate-400 me-3 w-6 h-6"/>
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Language :</h6>
                                                <Link href="" className="text-slate-400">English</Link>, <Link href="" className="text-slate-400">Japanese</Link>, <Link href="" className="text-slate-400">Chinese</Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <FiGlobe className="fea icon-ex-md text-slate-400 me-3 w-6 h-6" />
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Website :</h6>
                                                <Link href="" className="text-slate-400">www.cristina.com</Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <FiGift className="fea icon-ex-md text-slate-400 me-3 w-6 h-6"/>
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Birthday :</h6>
                                                <p className="text-slate-400 mb-0">2nd March, 1996</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <FiMapPin className="fea icon-ex-md text-slate-400 me-3 w-6 h-6"/>
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Location :</h6>
                                                <Link href="" className="text-slate-400">Beijing, China</Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-3">
                                            <FiPhone className="fea icon-ex-md text-slate-400 me-3 w-6 h-6"/>
                                            <div className="flex-1">
                                                <h6 className="text-green-600 dark:text-white font-medium mb-0">Cell No :</h6>
                                                <Link href="" className="text-slate-400">(+12) 1254-56-4896</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-9 lg:col-span-8 md:col-span-8 mt-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="p-6 relative rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 bg-white dark:bg-slate-900">
                                    <h5 className="text-xl font-semibold">Calvin Carlo</h5>
                        
                                    <p className="text-slate-400 mt-3">I have started my career as a trainee and prove my self and achieve all the milestone with good guidance and reach up to the project manager. In this journey, I understand all the procedure which make me a good developer, team leader, and a project manager.</p>
                                </div>

                                <div className="p-6 relative rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 bg-white dark:bg-slate-900">
                                    <h5 className="text-xl font-semibold">My Property :</h5>
                
                                    <div className="grid lg:grid-cols-3 md:grid-cols-2 mt-6 gap-6">
                                        {propertiesData.slice(0,6).map((item:PropertiesData, index:number) =>{
                                            return(
                                            <div className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl dark:hover:shadow-xl shadow-gray-200 dark:shadow-gray-700 dark:hover:shadow-gray-700 overflow-hidden ease-in-out duration-500" key={index}>
                                                <div className="relative" key={index}>
                                                    <Image src={item.image} width={0} height={0} sizes="100vw" style={{width:'100%', height:'auto'}} alt=""/>
                        
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
                                                            <i className="mdi mdi-arrow-expand-all text-2xl me-2 text-green-600"></i>
                                                            <span>{item.sqf}</span>
                                                        </li>
                        
                                                        <li className="flex items-center me-4">
                                                            <i className="mdi mdi-bed text-2xl me-2 text-green-600"></i>
                                                            <span>{item.beds}</span>
                                                        </li>
                        
                                                        <li className="flex items-center">
                                                            <i className="mdi mdi-shower text-2xl me-2 text-green-600"></i>
                                                            <span>{item.baths}</span>
                                                        </li>
                                                    </ul>
                        
                                                    <ul className="pt-6 flex justify-between items-center list-none">
                                                        <li>
                                                            <span className="text-slate-400">Price</span>
                                                            <p className="text-lg font-medium">{item.value}</p>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Wrapper>
    )
}