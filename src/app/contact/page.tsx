import React from 'react';

import Link from 'next/link';
import Image from 'next/image';

import Navbar from '../landing/components/navbar'
import Footer from '../landing/components/footer'
import Switcher from '../landing/components/switcher';

import { conatctDetails } from '../data/data';
import { FiHexagon } from 'react-icons/fi';
import { IconType } from 'react-icons';

interface ConatctDetails {
    title: string;
    description: string;
    contact: string;
    Icon: IconType;
}

export default function Contact() {
    return (
        <>
            <Navbar navClass={''} topnavClass={''} tagline={false} />

            <section className="relative lg:py-24 py-16">
                <div className="container">
                    <div className="grid md:grid-cols-12 grid-cols-1 items-center gap-[30px]">
                        <div className="lg:col-span-7 md:col-span-6">
                            <Image src="/images/svg/contact.svg" alt="" width={0} height={0} sizes='100vw' style={{ width: "100%", height: "auto" }} />
                        </div>

                        <div className="lg:col-span-5 md:col-span-6">
                            <div className="lg:me-5">
                                <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm shadow-gray-200 dark:shadow-gray-700 p-6">
                                    <h3 className="mb-6 text-2xl leading-normal font-medium">Get in touch !</h3>

                                    <form >
                                        <div className="grid lg:grid-cols-12 lg:gap-6">
                                            <div className="lg:col-span-6 mb-5">
                                                <label htmlFor="name" className="font-medium">Your Name:</label>
                                                <input name="name" id="name" type="text" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Name :" />
                                            </div>

                                            <div className="lg:col-span-6 mb-5">
                                                <label htmlFor="email" className="font-medium">Your Email:</label>
                                                <input name="email" id="email" type="email" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Email :" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1">
                                            <div className="mb-5">
                                                <label htmlFor="subject" className="font-medium">Your Question:</label>
                                                <input name="subject" id="subject" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2" placeholder="Subject :" />
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="comments" className="font-medium">Your Comment:</label>
                                                <textarea name="comments" id="comments" className="form-input border !border-gray-200 dark:!border-gray-800 mt-2 textarea" placeholder="Message :"></textarea>
                                            </div>
                                        </div>
                                        <button type="submit" id="submit" name="send" className="btn bg-green-600 hover:bg-green-700 text-white rounded-md">Send Message</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="container lg:mt-24 mt-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-[30px]">
                        {conatctDetails.map((item: ConatctDetails, index: number) => {
                            const Icon = item.Icon
                            return (
                                <div className="text-center px-6" key={index}>
                                    <div className="relative overflow-hidden text-transparent -m-3">
                                        <FiHexagon className="h-32 w-32 fill-green-600/5 mx-auto" />
                                        <div className="absolute top-2/4 -translate-y-2/4 start-0 end-0 mx-auto text-green-600 rounded-xl transition-all duration-500 ease-in-out text-4xl flex align-middle justify-center items-center">
                                            <Icon width={30} height={30} />
                                        </div>
                                    </div>

                                    <div className="content mt-7">
                                        <h5 className="title h5 text-xl font-medium">{item.title}</h5>
                                        <p className="text-slate-400 mt-3">{item.description}</p>

                                        <div className="mt-5">
                                            <Link href="tel:+152534-468-854" className="btn btn-link text-green-600 hover:text-green-600 after:bg-green-600 transition duration-500">{item.contact}</Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="container-fluid relative mt-20">
                    <div className="grid grid-cols-1">
                        <div className="w-full leading-[0] border-0">
                            <iframe title="contact-iframe" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d28005.851098419724!2d77.0787293!3d28.6677605!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d04709a55ca61%3A0x733c78dcf34281ce!2sPaschim%20Vihar%2C%20Delhi!5e0!3m2!1sen!2sin!4v1692468943407!5m2!1sen!2sin" style={{ border: '0' }} className="w-full h-[500px]" allowFullScreen></iframe>

                        </div>
                    </div>
                </div>
            </section>
            <Footer />
            <Switcher />
        </>
    )
}