import React from 'react';
import Navbar from "../landing/components/navbar";
import Link from 'next/link';
import { agencyData } from '../data/data';
import GetInTuch from "../landing/components/get-in-touch";
import Footer from "../landing/components/footer";

import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi';
import Image from 'next/image';
import Switcher from "../landing/components/switcher";

interface AgencyData{
    id: number;
    image: string;
    name: string;
    title: string;
}

export default function Page() {
  return (
    <>
    <Navbar navClass="navbar-white" topnavClass={''} tagline={false}/>

    <section className="relative table w-full py-32 lg:py-36 bg-no-repeat bg-center bg-cover" style={{backgroundImage:'url("/images/bg/01.jpg")'}}>
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="container relative">
            <div className="grid grid-cols-1 text-center mt-10">
                <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">Agencies</h3>
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
        <div className="container relative">
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-[30px]">
                {agencyData.map((item:AgencyData,index:number)=>{
                return(
                    <div className="group text-center" key={index}>
                        <div className="relative inline-block mx-auto size-64 !rounded-full overflow-hidden shadow-sm shadow-gray-200 dark:shadow-gray-700">
                            <Image src={item.image} width={0} height={0} sizes='100vw' style={{width:'100%', height:'auto'}} className="" alt=""/>
                        </div>

                        <div className="content mt-3">
                            <Link href={`/agency-profile/${item.id}`} className="text-xl font-medium hover:text-green-600 transition-all duration-500 ease-in-out">{item.name}</Link>
                            <p className="text-slate-400">{item.title}</p>

                            <ul className="list-none mt-2">
                                <li className="inline ms-1 rtl:me-1 rtl:ms-0"><Link href="" className="btn btn-icon btn-sm border border-gray-100 dark:border-gray-800 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600"><FiFacebook className="size-4"/></Link></li>
                                <li className="inline ms-1 rtl:me-1 rtl:ms-0"><Link href="" className="btn btn-icon btn-sm border border-gray-100 dark:border-gray-800 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600"><FiInstagram className="size-4"/></Link></li>
                                <li className="inline ms-1 rtl:me-1 rtl:ms-0"><Link href="" className="btn btn-icon btn-sm border border-gray-100 dark:border-gray-800 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600"><FiTwitter className="size-4"/></Link></li>
                                <li className="inline ms-1 rtl:me-1 rtl:ms-0"><Link href="" className="btn btn-icon btn-sm border border-gray-100 dark:border-gray-800 rounded-md text-slate-400 hover:border-green-600 hover:text-white hover:bg-green-600"><FiLinkedin className="size-4"/></Link></li>
                            </ul>
                        </div>
                    </div>
                )
                })}
            </div>
        </div>

        <GetInTuch/>
    </section>
    <Footer/>
    <Switcher/>
    </>
  )
}
