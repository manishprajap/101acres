import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Facebook, Twitter, Instagram } from 'react-feather';

import Navbar from '../landing/components/navbar';
import FormOne from '../landing/components/formOne';
import Switcher from '../landing/components/switcher';

import {propertiesDetails} from "../data/data";

import { LiaCompressArrowsAltSolid } from 'react-icons/lia';
import { LuBath, LuBedDouble } from 'react-icons/lu';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PropertiesDetails{
    id: number;
    image: string;
    name: string;
    square: number;
    beds: number;
    baths: number;
    price: number;
    rating: number;
}

export default function ListMap(){
    return(
        <>
        <Navbar topnavClass="!bg-white dark:!bg-slate-900" navClass={''} tagline={false}/>
        <section className="relative">
                <div className="container-fluid">
                    <div className="grid lg:grid-cols-2 md:grid-cols-2">
                        <div>
                            <div className="relative mt-12 md:p-8 py-8 px-3">
                                <div className="grid grid-cols-1">
                                   <FormOne/>
                                </div>
                                <div className="grid lg:grid-cols-1 grid-cols-1 mt-8 gap-[30px]">
                                    {propertiesDetails.map((item:PropertiesDetails, index:number) => (
                                        <div key={index} className="group rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl dark:hover:shadow-xl shadow-gray-200 dark:shadow-gray-700 dark:hover:shadow-gray-700 overflow-hidden ease-in-out duration-500 w-full mx-auto xl:max-w-4xl">
                                            <div className="md:flex">
                                                <div className="relative md:shrink-0">
                                                    <img className='h-full w-full object-cover xl:w-96' src={item.image} alt=""/>
                                                    <div className="absolute top-4 end-4">
                                                        <Link href="#" className="btn btn-icon bg-white dark:bg-slate-900 shadow-sm shadow-gray-200 dark:shadow-gray-700 !rounded-full text-slate-100 dark:text-slate-700 focus:text-red-600 dark:focus:text-red-600 hover:text-red-600 dark:hover:text-red-600"><i className="mdi mdi-heart mdi-18px"></i></Link>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="md:pb-4 pb-6">
                                                        <Link href={`/property-detail/${item.id}`} className="text-lg hover:text-green-600 font-medium ease-in-out duration-500">10765 Hillshire Ave, Baton Rouge, LA 70810, USA</Link>
                                                    </div>

                                                    <ul className="py-6 border-y border-slate-100 dark:border-gray-800 flex items-center list-none">
                                                        <li className="flex items-center me-4">
                                                            <LiaCompressArrowsAltSolid width={20}  className="me-2 text-green-600 text-2xl"/>
                                                            <span>{item.square}sqf</span>
                                                        </li>

                                                        <li className="flex items-center me-4">
                                                            <LuBedDouble width={20}  className="me-2 text-green-600 text-2xl"/>
                                                            <span>{item.beds} Beds</span>
                                                        </li>

                                                        <li className="flex items-center">
                                                            <LuBath width={20}  className="me-2 text-green-600 text-2xl"/>
                                                            <span>{item.baths} Baths</span>
                                                        </li>
                                                    </ul>

                                                    <ul className="md:pt-4 pt-6 flex justify-between items-center list-none">
                                                        <li>
                                                            <span className="text-slate-400">Price</span>
                                                            <p className="text-lg font-medium">${item.price}</p>
                                                        </li>

                                                        <li>
                                                            <span className="text-slate-400">Rating</span>
                                                            <ul className="text-lg font-medium text-amber-400 list-none">
                                                                <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                                <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                                <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                                <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                                <li className="inline ms-1"><i className="mdi mdi-star"></i></li>
                                                                <li className="inline ms-1 text-black dark:text-white">{item.rating}(30)</li>
                                                            </ul>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid md:grid-cols-12 grid-cols-1 mt-8">
                                    <div className="md:col-span-12 text-center">
                                        <nav>
                                            <ul className="inline-flex items-center -space-x-px">
                                                <li>
                                                    <Link href="#" className="w-10 h-10 inline-flex justify-center items-center mx-1 !rounded-full text-slate-400 bg-white dark:bg-slate-900 hover:text-white shadow-xs shadow-gray-200 dark:shadow-gray-700 hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600">
                                                        <FiChevronLeft className="text-[20px]"/>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="#" className="w-10 h-10 inline-flex justify-center items-center mx-1 !rounded-full text-slate-400 hover:text-white bg-white dark:bg-slate-900 shadow-xs shadow-gray-200 dark:shadow-gray-700 hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600">1</Link>
                                                </li>
                                                <li>
                                                    <Link href="#" className="w-10 h-10 inline-flex justify-center items-center mx-1 !rounded-full text-slate-400 hover:text-white bg-white dark:bg-slate-900 shadow-xs shadow-gray-200 dark:shadow-gray-700 hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600">2</Link>
                                                </li>
                                                <li>
                                                    <Link href="#" aria-current="page" className="z-10 w-10 h-10 inline-flex justify-center items-center mx-1 !rounded-full text-white bg-green-600 shadow-xs shadow-gray-200 dark:shadow-gray-700">3</Link>
                                                </li>
                                                <li>
                                                    <Link href="#" className="w-10 h-10 inline-flex justify-center items-center mx-1 !rounded-full text-slate-400 hover:text-white bg-white dark:bg-slate-900 shadow-xs shadow-gray-200 dark:shadow-gray-700 hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600">4</Link>
                                                </li>
                                                <li>
                                                    <Link href="#" className="w-10 h-10 inline-flex justify-center items-center mx-1 !rounded-full text-slate-400 bg-white dark:bg-slate-900 hover:text-white shadow-xs shadow-gray-200 dark:shadow-gray-700 hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600">
                                                        <FiChevronRight className="text-[20px]"/>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>


                            </div>

                            <footer className="relative bg-neutral-900">
                                <div className="py-[30px] px-0">
                                    <div className="container text-center px-6">
                                        <div className="grid md:grid-cols-2 items-center gap-6">
                                            <div className="md:text-start text-center">
                                                <p className="mb-0 text-gray-300">© {(new Date().getFullYear())}{" "} Hously. Design & Develop with <i className="mdi mdi-heart text-red-600"></i> by <Link rel="noreferrer" href="https://shreethemes.in/" target="_blank" className="text-reset">Shreethemes</Link>.</p>
                                            </div>

                                            <ul className="list-none md:text-end text-center">
                                                <li className="inline ms-1"><Link href="#" className="btn btn-icon btn-sm text-gray-400 hover:text-white border !border-gray-800 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><Facebook className="h-4 w-4" /></Link></li>
                                                <li className="inline ms-1"><Link href="#" className="btn btn-icon btn-sm text-gray-400 hover:text-white border !border-gray-800 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><Instagram className="h-4 w-4" /></Link></li>
                                                <li className="inline ms-1"><Link href="#" className="btn btn-icon btn-sm text-gray-400 hover:text-white border !border-gray-800 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><Twitter className="h-4 w-4" /></Link></li>
                                                <li className="inline ms-1"><Link href="#" className="btn btn-icon btn-sm text-gray-400 hover:text-white border !border-gray-800 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><Linkedin className="h-4 w-4" /></Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </footer>

                        </div>

                        <div className="relative md:block hidden">
                            <div className="map border-0 fixed w-full leading-[0]">
                                <iframe title="grid-iframe" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39206.002432144705!2d-95.4973981212445!3d29.709510002925988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640c16de81f3ca5%3A0xf43e0b60ae539ac9!2sGerald+D.+Hines+Waterwall+Park!5e0!3m2!1sen!2sin!4v1566305861440!5m2!1sen!2sin" style={{ border: 0 }} className="w-full h-screen" allowFullScreen></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Switcher />
        </>
    )
}