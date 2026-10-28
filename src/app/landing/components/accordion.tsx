'use client'
import { accordion } from "@/app/data/data";
import React, { useState } from "react";


export default function Accordion(){
    let [activeIndex, setActiveIndex] = useState<number>(0);

    let toggleAccordion = (index:number) => {
        if (activeIndex === index) {
            setActiveIndex(0);
        } else {
            setActiveIndex(index);
        }
    }
    return(
        <>
        <div id="accordion-collapse" data-accordion="collapse" className="mt-6">
            {accordion.map((section, index) => (
                <div key={index}

                    className="relative shadow-sm shadow-gray-200 dark:shadow-gray-700 rounded-md overflow-hidden mt-4">
                    <h2 className="text-base font-medium" id="accordion-collapse-heading-1">
                        <button type="button" onClick={() => toggleAccordion(index)}
                            className={`flex justify-between items-center p-5 w-full font-medium text-left ${activeIndex === index ? 'bg-gray-50 dark:bg-slate-800 text-green-600' : ''}`}>
                            <span>{section.title}</span>
                            <svg className="w-4 h-4 rotate-180 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                        </button>
                    </h2>
                    {activeIndex === index && (
                        <div id="accordion-collapse-body-1" aria-labelledby="accordion-collapse-heading-1">
                            <div className="p-5">
                                <p className="text-slate-400 dark:text-gray-400"> {section.content}</p>
                            </div>
                        </div>
                    )}
                </div>


            ))}
        </div>
        </>
    )
}