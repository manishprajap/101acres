"use client"; // This is a client component 👈🏽
import React, { useState, useEffect } from "react";
import Link from "next/link";


import * as Scroll from 'react-scroll';
import { FiArrowUp, FiMoon, FiSun } from "react-icons/fi";

var scroll = Scroll.animateScroll;

export default function Switcher() {
    let [scrollToTops, setScrollToTops] = useState(false); 

  useEffect(()=>{
    if (typeof window !== "undefined") {
        window.addEventListener("scroll", ()=>{
            setScrollToTops(window.scrollY >= 500)
        });
      }
      window.scrollTo(0, 0)
  },[])
    const scrollToTop = () => {
        scroll.scrollToTop({
            duration: 500,
            smooth: true,
        });
    }
const changeMode = (mode:'mode' | 'layout', event:React.MouseEvent<HTMLElement>) => {
    switch (mode) {
        case 'mode':
            if (document.documentElement.className.includes("dark")) {
                document.documentElement.className = 'light'
            } else {
                document.documentElement.className = 'dark'
            }
            break;
        case 'layout':
            if ((event.target as HTMLElement)?.innerText === "LTR") {
                document.documentElement.dir = "ltr"
            }
            else {
                document.documentElement.dir = "rtl"
            }
            break;

        default:
            break;
    }
}


    return (
        <>
            {/* <!-- Switcher --> */}
            <div className="fixed top-1/4 -left-2 z-3">
                <span className="relative inline-block rotate-90">
                    <input type="checkbox" className="checkbox opacity-0 absolute" id="chk" onClick={(event) => changeMode('mode', event)} />
                    <label className="label bg-slate-900 dark:bg-white shadow-sm shadow-gray-200 dark:shadow-gray-700 cursor-pointer !rounded-full flex justify-between items-center p-1 w-14 h-8" htmlFor="chk">
                        <FiMoon className="text-yellow-500" width={18}/>
                        <FiSun className="text-yellow-500" width={18}/>
                        <span className="ball bg-white dark:bg-slate-900 !rounded-full absolute top-[2px] start-[2px] w-7 h-7"></span>
                    </label>
                </span>
            </div>

            {/* <!-- Switcher --> */}

            {/* <!-- LTR & RTL Mode Code --> */}
            <div className="fixed top-[40%] -left-3 z-50">
                <Link href="#" id="switchRtl">
                    <span className="py-1 px-3 relative inline-block rounded-b-md -rotate-90 bg-white dark:bg-slate-900 shadow-md dark:shadow-sm dark:shadow-gray-800 font-semibold rtl:block ltr:hidden" onClick={(event) => changeMode('layout', event)}>LTR</span>
                    <span className="py-1 px-3 relative inline-block rounded-b-md -rotate-90 bg-white dark:bg-slate-900 shadow-md dark:shadow-sm dark:shadow-gray-800 font-semibold ltr:block rtl:hidden" onClick={(event) => changeMode('layout', event)}>RTL</span>
                </Link>
            </div>

            <Link  href="#" onClick={scrollToTop}
                id="back-to-top" className={`${!scrollToTops ? "hidden":"back-to-top fixed text-lg !rounded-full z-10 bottom-5 end-5 h-9 w-9 text-center bg-green-600 text-white justify-center items-center flex"}`}><FiArrowUp width={18}/></Link>
            {/* <!-- LTR & RTL Mode Code --> */}

        </>
    );

}
