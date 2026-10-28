"use client"; // This is a client component 👈🏽
import React, { useState } from "react";
import Image from "next/image";

export default function BuyTab() {
    let [activeTabIndex, setactiveTabIndex] = useState<number>(0);

    let handleTabClick = (tabIndex:number) => {
        setactiveTabIndex(tabIndex)
    };


    return (
        <>
            <div className="container lg:mt-24 mt-16">
                <div className="grid md:grid-cols-12 grid-cols-1 gap-[30px]">
                    <div className="lg:col-span-4 md:col-span-5">
                        <div className="sticky top-20">
                            <ul className="flex-column text-center p-6 bg-white dark:bg-slate-900 shadow-sm shadow-gray-200 dark:shadow-gray-700 rounded-md" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
                                <li role="presentation">
                                    <button className={`px-4 py-2 text-base font-medium rounded-md w-full mt-3 transition-all duration-500 ease-in-out ${activeTabIndex === 0 ? 'text-white bg-green-600' : 'dark:hover:bg-slate-800 dark:hover:text-white hover:bg-gray-50 hover:text-green-600'}`}
                                        onClick={() => handleTabClick(0)}>Pre Approval Letter</button>
                                </li>
                                <li role="presentation">
                                    <button className={`px-4 py-2 text-base font-medium rounded-md w-full mt-3 transition-all duration-500 ease-in-out ${activeTabIndex === 1 ? 'text-white bg-green-600' : 'dark:hover:bg-slate-800 dark:hover:text-white hover:bg-gray-50 hover:text-green-600'}`}
                                        onClick={() => handleTabClick(1)}>Schedule a Showing</button>
                                </li>
                                <li role="presentation">
                                    <button className={`px-4 py-2 text-base font-medium rounded-md w-full mt-3 transition-all duration-500 ease-in-out ${activeTabIndex === 2 ? 'text-white bg-green-600' : 'dark:hover:bg-slate-800 dark:hover:text-white hover:bg-gray-50 hover:text-green-600'}`}
                                        onClick={() => handleTabClick(2)}>Submit an Offer</button>
                                </li>
                                <li role="presentation">
                                    <button className={`px-4 py-2 text-base font-medium rounded-md w-full mt-3 transition-all duration-500 ease-in-out ${activeTabIndex === 3 ? 'text-white bg-green-600' : 'dark:hover:bg-slate-800 dark:hover:text-white hover:bg-gray-50 hover:text-green-600'}`}
                                        onClick={() => handleTabClick(3)}>Property Inspection</button>
                                </li>
                                <li role="presentation">
                                    <button className={`px-4 py-2 text-base font-medium rounded-md w-full mt-3 transition-all duration-500 ease-in-out ${activeTabIndex === 4 ? 'text-white bg-green-600' : 'dark:hover:bg-slate-800 dark:hover:text-white hover:bg-gray-50 hover:text-green-600'}`}
                                        onClick={() => handleTabClick(4)}>Appraisal</button>
                                </li>
                                <li role="presentation">
                                    <button className={`px-4 py-2 text-base font-medium rounded-md w-full mt-3 transition-all duration-500 ease-in-out ${activeTabIndex === 5 ? 'text-white bg-green-600' : 'dark:hover:bg-slate-800 dark:hover:text-white hover:bg-gray-50 hover:text-green-600'}`}
                                        onClick={() => handleTabClick(5)}>Closing Deal</button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-8 md:col-span-7">
                        <div id="myTabContent">
                            {activeTabIndex === 0 && (
                                <div className="">
                                    <Image src="/images/svg/Agent_Monochromatic.svg" alt="" priority width={404} height={304} />
                                    <div className="mt-6">
                                        <h5 className="font-medium text-xl">Pre Approval Letter</h5>
                                        <p className="text-slate-400 mt-3">Most buyers think the first step is finding their dream house, but the truth is finding the funding is the first step. Hously streamlines the Loan Pre-Approval process with our ecosystem of Premier Partners or simply upload your own Pre-Approval letter.</p>
                                    </div>
                                </div>
                            )}
                            {activeTabIndex === 1 && (
                                <div >
                                    <Image src="/images/svg/presentation_Flatline.svg" alt=""  priority width={404} height={304} />
                                    <div className="mt-6">
                                        <h5 className="font-medium text-xl">Schedule a Showing</h5>
                                        <p className="text-slate-400 mt-3">Hously allows a buyer to schedule an instant showing and gain a private viewing without the need for multiple parties to be involved. You pick the time that works for you!</p>
                                    </div>
                                </div>
                            )}
                            {activeTabIndex === 2 && (
                                <div>
                                    <Image src="/images/svg/session_Flatline.svg" alt="" priority width={404} height={304} />
                                    <div className="mt-6">
                                        <h5 className="font-medium text-xl">Submit an Offer</h5>
                                        <p className="text-slate-400 mt-3">Hously walks a buyer through the purchase agreement process making the paperwork appear effortless. With our custom workflows and progress analytics, you will always know where your purchase stands. No more phone tag and unreturned emails!</p>
                                    </div>
                                </div>
                            )}
                            {activeTabIndex === 3 && (
                                <div id="inspection">
                                    <Image src="/images/svg/Startup_Flatline.svg" alt="" priority width={404} height={304}  />
                                    <div className="mt-6">
                                        <h5 className="font-medium text-xl">Property Inspection</h5>
                                        <p className="text-slate-400 mt-3">No one wants to buy a lemon. Book an inspection with a licensed inspector, then submit the repair requests all via the Hously platform.</p>
                                    </div>
                                </div>
                            )}
                            {activeTabIndex === 4 && (
                                <div>
                                    <Image src="/images/svg/team_Flatline.svg" alt="" priority width={404} height={304}  />
                                    <div className="mt-6">
                                        <h5 className="font-medium text-xl">Appraisal</h5>
                                        <p className="text-slate-400 mt-3">Hously monitors the appraisal process ensuring the home you are purchasing meets or exceeds the price you are paying.</p>
                                    </div>
                                </div>
                            )}
                            {activeTabIndex === 5 && (
                                <div>
                                    <Image src="/images/svg/Team_meeting_Two.svg" alt="" priority width={404} height={304}   />
                                    <div className="mt-6">
                                        <h5 className="font-medium text-xl">Closing Deal</h5>
                                        <p className="text-slate-400 mt-3">Finally the closing packet is sent to the Title office, and the day has come… You have Hously the home of your dreams!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

}
