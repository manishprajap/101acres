import React from "react";
import Link from "next/link";

import Navbar from "../landing/components/navbar";
import Footer from "../landing/components/footer";
import Accordion from "../landing/components/accordion";
import { FiArrowRight } from "react-icons/fi";
import Switcher from "../landing/components/switcher";


export default function Terms(){
    return(
        <>
          <Navbar navClass="navbar-white" topnavClass={""} tagline={false} />
          <section
                style={{ backgroundImage: "url('/images/bg/01.jpg')" }}
                className="relative table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover">
                <div className="absolute inset-0 bg-slate-900/80"></div>
                <div className="container relative">
                    <div className="grid grid-cols-1 text-center mt-10">
                        <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">Terms & Services</h3>
                    </div>
                </div>
            </section>
            <div className="relative">
                <div className="shape overflow-hidden z-1 text-white dark:text-slate-900">
                    <svg viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z" fill="currentColor"></path>
                    </svg>
                </div>
            </div>
            <section className="relative lg:py-24 py-16">
                <div className="container">
                    <div className="md:flex justify-center">
                        <div className="md:w-3/4">
                            <div className="p-6 bg-white dark:bg-slate-900 shadow-sm shadow-gray-200 dark:shadow-gray-700 rounded-md">
                                <h5 className="text-xl font-medium mb-4">Introduction :</h5>
                                <p className="text-slate-400">It seems that only fragments of the original text remain in the Lorem Ipsum texts used today. One may speculate that over the course of time certain letters were added or deleted at various positions within the text.</p>

                                <h5 className="text-xl font-medium mb-4 mt-8">User Agreements :</h5>
                                <p className="text-slate-400">The most well-known dummy text is the Lorem Ipsum, which is said to have <b className="text-danger-600">originated</b> in the 16th century. Lorem Ipsum is <b className="text-danger-600">composed</b> in a pseudo-Latin language which more or less <b className="text-danger-600">corresponds</b> to  proper Latin. It contains a series of real Latin words. This ancient dummy text is also <b className="text-danger-600">incomprehensible</b>, but it imitates the rhythm of most European languages in Latin script. The <b className="text-danger-600">advantage</b> of its Latin origin and the relative <b className="text-danger-600">meaninglessness</b> of Lorum Ipsum is that the text does not attract attention to itself or distract the viewer s <b className="text-danger-600">attention</b> from the layout.</p>
                                <p className="text-slate-400 mt-3">There is now an <b className="text-danger-600">abundance</b> of readable dummy texts. These are usually used when a text is <b className="text-danger-600">required purely</b> to fill a space. These alternatives to the classic Lorem Ipsum texts are often amusing and tell short, funny or <b className="text-danger-600">nonsensical</b> stories.</p>
                                <p className="text-slate-400 mt-3">It seems that only <b className="text-danger-600">fragments</b> of the original text remain in the Lorem Ipsum texts used today. One may speculate that over the course of time certain letters were added or deleted at various positions within the text.</p>

                                <h5 className="text-xl font-medium mb-4 mt-8">Restrictions :</h5>
                                <p className="text-slate-400">You are specifically restricted from all of the following :</p>
                                <ul className="list-none text-slate-400 mt-3">
                                    <li className="flex mt-2"><FiArrowRight className=" text-green-600 align-middle me-2"/> <span>Digital Marketing Solutions for Tomorrow</span></li>
                                    <li className="flex mt-2"><FiArrowRight className=" text-green-600 align-middle me-2"/> <span>Our Talented & Experienced Marketing Agency</span></li>
                                    <li className="flex mt-2"><FiArrowRight className=" text-green-600 align-middle me-2"/> <span>Create your own skin to match your brand</span></li>
                                    <li className="flex mt-2"><FiArrowRight className=" text-green-600 align-middle me-2"/> <span>Digital Marketing Solutions for Tomorrow</span></li>
                                    <li className="flex mt-2"><FiArrowRight className=" text-green-600 align-middle me-2"/> <span>Our Talented & Experienced Marketing Agency</span></li>
                                    <li className="flex mt-2"><FiArrowRight className=" text-green-600 align-middle me-2"/> <span>Create your own skin to match your brand</span></li>
                                </ul>

                                <h5 className="text-xl font-medium mt-8">Users Question & Answer :</h5>

                               <Accordion/>

                                <div className="mt-6">
                                    <Link href="#" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md">Accept</Link>
                                    <Link href="#" className="btn bg-transparent hover:bg-green-600 border border-green-600 text-green-600 hover:text-white rounded-md ms-2">Decline</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
           
            <Footer />
            <Switcher />
        </>
    )
}