'use client'
import React from "react"
import Link from "next/link"

import dynamic from "next/dynamic";
const Select = dynamic(()=>import('react-select'),{ssr:false})

import {LuSearch} from 'react-icons/lu'
import {AiOutlineDollarCircle} from 'react-icons/ai'
import {RxHome} from 'react-icons/rx' 


export default function FormFour(){
    let Houses = [
        { value: 'AF', label: 'Apartment' },
        { value: 'AZ', label: ' Offices' },
        { value: 'BS', label: 'Townhome' },
    ]
    let minPrice = [
        { value: '1', label: '500' },
        { value: '2', label: '1000' },
        { value: '3', label: '2000' },
        { value: '4', label: '3000' },
        { value: '5', label: '4000' },
        { value: '5', label: '5000' },
        { value: '5', label: '6000' },
    ]
    let maxPrice = [
        { value: '1', label: '500' },
        { value: '2', label: '1000' },
        { value: '3', label: '2000' },
        { value: '4', label: '3000' },
        { value: '5', label: '4000' },
        { value: '5', label: '5000' },
        { value: '5', label: '6000' },
    ]
    return(
        <form action="#">
            <div className="registration-form text-dark text-start">
                <div className="grid lg:grid-cols-5 md:grid-cols-2 grid-cols-1 lg:gap-0 gap-6">
                    <div>
                        <label className="form-label text-slate-900 dark:text-white font-medium">Search : <span className="text-red-600">*</span></label>
                        <div className="filter-search-form relative filter-border mt-2">
                            <LuSearch className="icons"/>
                            <input name="name" type="text" id="job-keyword" className="form-input filter-input-box !bg-gray-50 dark:!bg-slate-800 border-0" placeholder="Search your Keywords" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="buy-properties" className="form-label text-slate-900 dark:text-white font-medium">Select Categories:</label>                                                        
                        <div className="filter-search-form relative filter-border mt-2">
                            <RxHome className=" icons"/>
                            <Select className="form-input filter-input-box !bg-gray-50 dark:!bg-slate-800 border-0" options={Houses} />

                        </div>
                    </div>

                    <div>
                        <label htmlFor="buy-min-price" className="form-label text-slate-900 dark:text-white font-medium">Min Price :</label>                                                        
                        <div className="filter-search-form relative filter-border mt-2">
                            <AiOutlineDollarCircle className="icons"/>
                            <Select className="form-input filter-input-box !bg-gray-50 dark:!bg-slate-800 border-0" options={minPrice} />

                        </div>
                    </div>

                    <div>
                        <label htmlFor="buy-max-price" className="form-label text-slate-900 dark:text-white font-medium">Max Price :</label>                                                        
                        <div className="filter-search-form relative mt-2">
                            <AiOutlineDollarCircle className="icons"/>
                            <Select className="form-input filter-input-box !bg-gray-50 dark:!bg-slate-800 border-0" options={maxPrice} />

                        </div>
                    </div>

                    <div className="lg:mt-6">
                        <input type="submit" id="search-buy" name="search" className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white searchbtn submit-btn w-full !h-[60px] lg:rounded-none rounded mt-2" value="Search" />
                    </div>
                </div>
            </div>
        </form>
    )
}