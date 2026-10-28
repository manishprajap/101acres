import React from 'react'
import Link from "next/link";

import { FiClock, FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiTwitter } from 'react-icons/fi'

export default function Tagline() {
  return (
       <div className="tagline bg-slate-900">
            <div className="container relative">                
                <div className="grid grid-cols-1">
                    <div className="flex items-center justify-between">
                        <ul className="list-none">
                            <li className="inline-flex items-center">
                                <FiClock className="text-green-600 size-4"/>
                                <span className="ms-2 text-slate-300">Mon-Sat: 9am to 6pm</span>
                            </li>
                            <li className="inline-flex items-center ms-2">
                                <FiMapPin className="text-green-600 size-4"/>
                                <span className="ms-2 text-slate-300">Houston, USA 485</span>
                            </li>
                        </ul>

                        <ul className="list-none">
                            <li className="inline-flex items-center">
                                <FiMail className="text-green-600 size-4"/>
                                <a href="mailto:contact@example.com" className="ms-2 text-slate-300 hover:text-slate-200">contact@example.com</a>
                            </li>
                            <li className="inline-flex items-center ms-2">
                                <ul className="list-none">
                                    <li className="inline-flex mb-0"><Link href="#!" className="text-slate-300 hover:text-green-600"><FiFacebook className="size-4 align-middle" title="facebook"/></Link></li>
                                    <li className="inline-flex ms-2 mb-0"><Link href="#!" className="text-slate-300 hover:text-green-600"><FiInstagram className="size-4 align-middle" title="instagram"/></Link></li>
                                    <li className="inline-flex ms-2 mb-0"><Link href="#!" className="text-slate-300 hover:text-green-600"><FiTwitter className="size-4 align-middle" title="twitter"/></Link></li>
                                    <li className="inline-flex ms-2 mb-0"><Link href="tel:+152534-468-854" className="text-slate-300 hover:text-green-600"><FiPhone className="size-4 align-middle" title="phone"/></Link></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
  )
}