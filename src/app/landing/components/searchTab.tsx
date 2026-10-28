'use client'
import React,{useState} from "react";
import { FiSearch } from "react-icons/fi";

export default function SearchTab(){
    let [activeTabIndex, setActiveIndex] = useState<number>(0);

    let handleTabClick = (tabIndex:number) => {
        setActiveIndex(tabIndex);
    };
    return(
        <>
        <div className="relative mt-8">
            <div className="grid grid-cols-1">
                <ul className="inline-block sm:w-fit w-full flex-wrap justify-center text-center p-4 bg-white dark:bg-slate-900 rounded-t-xl shadow-sm shadow-gray-200 dark:shadow-gray-700" id="myTab" data-tabs-toggle="#StarterContent" role="tablist">
                    <li role="presentation" className="inline-block">
                        <button onClick={() => handleTabClick(0)} className={`px-6 py-2 text-base font-medium !rounded-full w-full transition-all duration-500 ease-in-out ${activeTabIndex === 0 ? 'text-white bg-green-600' : 'hover:text-green-600'}`} id="buy-home-tab" data-tabs-target="#buy-home" type="button" role="tab" aria-controls="buy-home" aria-selected="true">Buy</button>
                    </li>
                    <li role="presentation" className="inline-block">
                        <button onClick={() => handleTabClick(1)} className={`px-6 py-2 text-base font-medium !rounded-full w-full transition-all duration-500 ease-in-out ${activeTabIndex === 1 ? 'text-white bg-green-600' : 'hover:text-green-600'}`} id="sell-home-tab" data-tabs-target="#sell-home" type="button" role="tab" aria-controls="sell-home" aria-selected="false">Sell</button>
                    </li>
                    <li role="presentation" className="inline-block">
                        <button onClick={() => handleTabClick(2)} className={`px-6 py-2 text-base font-medium !rounded-full w-full transition-all duration-500 ease-in-out ${activeTabIndex === 2 ? 'text-white bg-green-600' : 'hover:text-green-600'}`} id="rent-home-tab" data-tabs-target="#rent-home" type="button" role="tab" aria-controls="rent-home" aria-selected="false">Rent</button>
                    </li>
                </ul>

                <div id="StarterContent" className="p-6 bg-white dark:bg-slate-900 rounded-ss-none rounded-se-none md:rounded-se-xl rounded-xl shadow-sm shadow-gray-200 dark:shadow-gray-700">
                    {activeTabIndex === 0 && (
                        <div id="buy-home" role="tabpanel" aria-labelledby="buy-home-tab">
                            <div className="subcribe-form z-1">
                                <form className="relative max-w-2xl mx-auto">
                                    <FiSearch className="w-5 h-5 absolute top-[47%] -translate-y-1/2 start-4" />
                                    <input type="name" id="search_name" name="name" className="rounded-full bg-white dark:bg-slate-900 shadow-sm dark:shadow-gray-700 !ps-12" placeholder="City, Address, Zip :" />
                                    <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white !rounded-full">Find Out</button>
                                </form>
                            </div>
                        </div>
                    )}
                    {activeTabIndex === 1 && (
                        <div id="sell-home" role="tabpanel" aria-labelledby="sell-home-tab">
                            <div className="subcribe-form z-1">
                                <form className="relative max-w-2xl mx-auto">
                                    <FiSearch className="w-5 h-5 absolute top-[47%] -translate-y-1/2 start-4" />
                                    <input type="name" id="search_name" name="name" className="rounded-full bg-white dark:bg-slate-900 shadow-sm dark:shadow-gray-700 !ps-12" placeholder="City, Address, Zip :" />
                                    <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white !rounded-full">Find Out</button>
                                </form>
                            </div>
                        </div>
                    )}
                    {activeTabIndex === 2 && (
                        <div id="rent-home" role="tabpanel" aria-labelledby="rent-home-tab">
                            <div className="subcribe-form z-1">
                                <form className="relative max-w-2xl mx-auto">
                                    <FiSearch className="w-5 h-5 absolute top-[47%] -translate-y-1/2 start-4" />
                                    <input type="name" id="search_name" name="name" className="rounded-full bg-white dark:bg-slate-900 shadow-sm dark:shadow-gray-700 !ps-12" placeholder="City, Address, Zip :" />
                                    <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white !rounded-full">Find Out</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    )
}