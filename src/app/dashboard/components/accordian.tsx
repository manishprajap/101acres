'use client'
import React,{useState} from "react"

import { accordianData } from "../data/data"
import { FiChevronDown } from "react-icons/fi"

interface AccordianData{
    title: string;
    desc: string;
}

export default function Accordian(){
    let [ accordion1, setAccordion1 ] = useState(0)
    return(
        <div id="accordion-collapse" data-accordion="collapse" className="mt-6">
            {accordianData.map((item:AccordianData, index:number) =>{
                return(
                    <div className="relative shadow-sm shadow-gray-200 dark:shadow-gray-700 rounded-md overflow-hidden mt-4" key={index}>
                        <h2 className="text-base font-semibold" id="accordion-collapse-heading-1">
                            <button type="button" className={`${accordion1 === index ? ' bg-gray-50 dark:bg-slate-800 text-green-600' :' text-dark dark:text-white'} flex justify-between items-center p-5 w-full font-medium text-start`} onClick={() =>setAccordion1(index)}>
                                <span>{item.title}</span>
                                <FiChevronDown className={`${accordion1 === index ? 'rotate-180' : ''} w-4 h-4 shrink-0`}/>
                            </button>
                        </h2>
                        <div className={accordion1 === index ? '' : 'hidden'}>
                            <div className="p-5">
                                <p className="text-slate-400 dark:text-gray-400">{item.desc}</p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}