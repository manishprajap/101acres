import React from "react";
import Link from "next/link";
// import Image from 'next/image';
import { HiOutlineEnvelope } from "react-icons/hi2";
import { BsPencil } from "react-icons/bs";
import { MdKeyboardArrowRight } from "react-icons/md";
import { FiDribbble, FiFacebook, FiInstagram, FiLinkedin, FiMail, FiMapPin, FiPhone, FiShoppingCart, FiTwitter } from "react-icons/fi";
import { BiLogoBehance } from "react-icons/bi";


export default function FooterLight() {

    return (
        <>
            <footer className="relative bg-slate-50 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 mt-24">
                <div className="container">
                    <div className="grid grid-cols-1">
                        <div className="relative py-16">
                            {/* <!-- Subscribe --> */}
                            <div className="relative w-full">
                                <div className="relative -top-40 dark:bg-slate-900 lg:px-8 px-6 py-10 rounded-xl shadow-lg dark:shadow-gray-700 overflow-hidden">
                                    <div className="grid md:grid-cols-2 grid-cols-1 items-center gap-[30px]">
                                       
                                    </div>

                                    <div className="absolute -top-5 -start-5">
                                        <HiOutlineEnvelope className="lg:text-[150px] text-7xl text-white/5 ltr:-rotate-45 rtl:rotate-45" />
                                    </div>

                                    <div className="absolute -bottom-5 -end-5">
                                        <BsPencil className="lg:text-[150px] text-7xl text-white/5 rtl:-rotate-90" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-12 grid-cols-1 gap-[30px] -mt-24">
                                    <div className="lg:col-span-4 md:col-span-12">
                                        <Link href="#" className="text-[22px] focus:outline-none">
                                            <img src='/images/logo1.png' alt="" className="dark:block hidden" />
                                            <img src='/images/logo1.png' alt="" className="dark:hidden block" />
                                        </Link>
                                        <p className="mt-6 text-slate-400">A great plateform to buy, sell and rent your properties without any agent or commisions.</p>

                                    </div>

                                    <div className="lg:col-span-2 md:col-span-4">
                                        <h5 className="tracking-[1px] text-slate-900 dark:text-white font-semibold">Company</h5>
                                        <ul className="list-none footer-list mt-6">
                                            <li><Link href="/aboutus" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> About us</Link></li>
                                            <li className="mt-[10px]"><Link href="/features" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Services</Link></li>
                                            <li className="mt-[10px]"><Link href="/pricing" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Pricing</Link></li>
                                            <li className="mt-[10px]"><Link href="/blog" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Blog</Link></li>
                                            <li className="mt-[10px]"><Link href="/auth-login" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Login</Link></li>
                                        </ul>
                                    </div>

                                    <div className="lg:col-span-3 md:col-span-4">
                                        <h5 className="tracking-[1px] text-slate-900 dark:text-white font-semibold">Usefull Links</h5>
                                        <ul className="list-none footer-list mt-6">
                                            <li><Link href="/terms" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Terms of Services</Link></li>
                                            <li className="mt-[10px]"><Link href="/privacy" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Privacy Policy</Link></li>
                                            <li className="mt-[10px]"><Link href="/listing-one" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Listing</Link></li>
                                            <li className="mt-[10px]"><Link href="/contact" className="text-slate-400 inline-flex hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-400 duration-500 ease-in-out"><MdKeyboardArrowRight className="me-1 text-xl" /> Contact</Link></li>
                                        </ul>
                                    </div>

                                    <div className="lg:col-span-3 md:col-span-4">
                                        <h5 className="tracking-[1px] text-slate-900 dark:text-white font-semibold">Contact Details</h5>
                                        <div className="flex mt-6">
                                            <FiMapPin className="size-5 text-green-600 me-3" />
                                            <div className="">
                                                <h6 className="text-slate-400 mb-2">C/54 Northwest Freeway, <br /> Suite 558, <br /> Houston, USA 485</h6>
                                                <Link href="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39206.002432144705!2d-95.4973981212445!3d29.709510002925988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640c16de81f3ca5%3A0xf43e0b60ae539ac9!2sGerald+D.+Hines+Waterwall+Park!5e0!3m2!1sen!2sin!4v1566305861440!5m2!1sen!2sin" data-type="iframe" className="text-green-600 hover:text-green-700 duration-500 ease-in-out lightbox">View on Google map</Link>
                                            </div>
                                        </div>

                                        <div className="flex mt-6">
                                            <FiMail className="size-5 text-green-600 me-3" />
                                            <div className="">
                                                <Link href="mailto:contact@example.com" className="text-slate-400 duration-500 ease-in-out">contact@example.com</Link>
                                            </div>
                                        </div>

                                        <div className="flex mt-6">
                                            <FiPhone className="size-5 text-green-600 me-3" />
                                            <div className="">
                                                <Link href="tel:+152534-468-854" className="text-slate-400 duration-500 ease-in-out">+152 534-468-854</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <!-- Subscribe --> */}
                        </div>
                    </div>
                </div>

                <div className="py-[30px] px-0 border-t border-gray-200 dark:border-gray-700">
                    <div className="container text-center">
                        <div className="grid md:grid-cols-2 items-center gap-6">
                            <div className="md:text-start text-center">
                                <p className="mb-0 text-slate-400">© <script type="text/javascript" id="www-widgetapi-script" src="https://www.youtube.com/s/player/d87d581f/www-widgetapi.vflset/www-widgetapi.js"></script><script id="iframe_api" src="https://www.youtube.com/iframe_api"></script>{(new Date().getFullYear())}{" "} Hously. Design & Develop with <i className="mdi mdi-heart text-red-600"></i> by <Link href="https://shreethemes.in/" target="_blank" className="text-reset">Shreethemes</Link>.</p>
                            </div>

                            <ul className="list-none md:text-end text-center">
                                <li className="inline ms-1"><Link href="https://1.envato.market/hously-react" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiShoppingCart className="size-4" /></Link></li>
                                <li className="inline ms-1"><Link href="https://dribbble.com/shreethemes" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiDribbble className="size-4" /></Link></li>
                                <li className="inline ms-1"><Link href="https://www.behance.net/shreethemes" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><BiLogoBehance className="align-baseline" /></Link></li>
                                <li className="inline ms-1"><Link href="http://linkedin.com/company/shreethemes" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiLinkedin className="size-4" /></Link></li>
                                <li className="inline ms-1"><Link href="https://www.facebook.com/shreethemes" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiFacebook className="size-4" /></Link></li>
                                <li className="inline ms-1"><Link href="https://www.instagram.com/shreethemes/" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiInstagram className="size-4" /></Link></li>
                                <li className="inline ms-1"><Link href="https://twitter.com/shreethemes" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiTwitter className="size-4" /></Link></li>
                                <li className="inline ms-1"><Link href="mailto:support@shreethemes.in" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-200 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiMail className="size-4" /></Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );

}