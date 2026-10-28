import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter
} from "react-icons/fi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { AiFillPinterest } from "react-icons/ai";

export default function Footer() {
  return (
    <footer className="relative bg-slate-900 dark:bg-slate-800 mt-24">
      <div className="container">
        <div className="grid grid-cols-1">
          <div className="relative py-16">
            {/* Subscribe area (currently unused) */}
            <div className="relative w-full">
              <div className="grid md:grid-cols-12 grid-cols-1 gap-[30px] ">
                {/* Logo & Description */}
                <div className="lg:col-span-4 md:col-span-12">
                  <Link href="/" className="text-[22px] focus:outline-none">
                    <Image src="/images/logo1.png" alt="Logo" width={80} height={28} />
                  </Link>
                  <p className="mt-6 text-gray-300">
                    A great platform to buy, sell and rent your properties without any agents or commissions.
                  </p>
                </div>

                {/* Company Links */}
                <div className="lg:col-span-2 md:col-span-4">
                  <h5 className="text-lg font-semibold tracking-wide text-white">Company</h5>
                  <ul className="list-none mt-6">
                    <li className="mt-[10px]"><Link href="/aboutus" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> About Us</Link></li>
                    <li className="mt-[10px]"><Link href="/landing/area" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> Area</Link></li>
                    <li className="mt-[10px]"><Link href="/featured-property" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> Properties</Link></li>
                    <li className="mt-[10px]"><Link href="https://properties.101acres.com/category/blog/" className="inline-flex text-slate-400 hover:text-slate-300 duration-300" target="_blank"><MdKeyboardArrowRight className="me-1 text-xl" /> Blog</Link></li>
                    <li className="mt-[10px]"><Link href="/faqs" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> FAQs</Link></li>
                  </ul>
                </div>

                {/* Useful Links */}
                <div className="lg:col-span-3 md:col-span-4">
                  <h5 className="text-lg font-semibold tracking-wide text-white">Useful Links</h5>
                  <ul className="list-none mt-6">
                    <li><Link href="#" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> Terms of Services</Link></li>
                    <li className="mt-[10px]"><Link href="#" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> Privacy Policy</Link></li>
                    <li className="mt-[10px]"><Link href="/featured-property" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> Listing</Link></li>
                    <li className="mt-[10px]"><Link href="/contact" className="inline-flex text-slate-400 hover:text-slate-300 duration-300"><MdKeyboardArrowRight className="me-1 text-xl" /> Contact</Link></li>
                  </ul>
                </div>

                {/* Contact Details */}
                <div className="lg:col-span-3 md:col-span-4">
                  <h5 className="text-lg font-semibold tracking-wide text-white">Contact Details</h5>
                  <div className="flex mt-6">
                    <FiMapPin className="size-5 text-green-600 me-3" />
                    <span className="text-slate-400">Delhi, India</span>
                  </div>
                  <div className="flex mt-6">
                    <FiMail className="size-5 text-green-600 me-3" />
                    <Link href="mailto:admin@properties.101acres.com" className="text-slate-400 hover:text-slate-300">admin@properties.101acres.com</Link>
                  </div>
                  <div className="flex mt-6">
                    <FiPhone className="size-5 text-green-600 me-3" />
                    <Link href="tel:+919555901605" className="text-slate-400 hover:text-slate-300">+91-9217703975</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="py-[30px] px-0 border-t border-gray-800 dark:border-gray-700">
                    <div className="container text-center">
                        <div className="grid md:grid-cols-2 items-center gap-6">
                            <div className="md:text-start text-center">
                                <p className="mb-0 text-gray-300">©{(new Date().getFullYear())}{" "} 101Acres. Design & Develop with <i className="mdi mdi-heart text-red-600"></i> by <Link href="https://aarnatechxperts.in/" target="_blank" className="text-reset">Aarna Tech Xperts</Link>.</p>
                            </div>

                            <ul className="list-none md:text-end text-center">

                                <li className="inline ms-1"><Link href="https://www.linkedin.com/uas/login?session_redirect=https%3A%2F%2Fwww.linkedin.com%2FshareArticle%3Furl%3Dhttps%253A%252F%252Fproperties.101acres.com%252Fcontact%252F" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiLinkedin className="h-4 w-4"></FiLinkedin></Link></li>
                                <li className="inline ms-1"><Link href="https://www.facebook.com/sharer.php?u=" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiFacebook className="h-4 w-4"></FiFacebook></Link></li>
                                <li className="inline ms-1"><Link href="https://www.pinterest.com/pin/create/link/?url=https%3A%2F%2Fproperties.101acres.com%2Fcontact%2F&media=" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><AiFillPinterest className="h-4 w-4"></AiFillPinterest></Link></li>
                                <li className="inline ms-1"><Link href="https://twitter.com/share?url=" target="_blank" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiTwitter className="h-4 w-4"></FiTwitter></Link></li>
                                <li className="inline ms-1"><Link href="mailto:support@shreethemes.in" className="btn btn-icon btn-sm text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-green-600 dark:hover:border-green-600 hover:bg-green-600 dark:hover:bg-green-600"><FiMail className="h-4 w-4"></FiMail></Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
    </footer>
  );
}
