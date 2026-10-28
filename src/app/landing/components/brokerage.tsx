'use client'
import React, { useState } from "react";

export default function Brokerage(){
    let [value, setValue] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    }
    let isValue = value
    let brokerage = (parseFloat(isValue as string) * 0.01).toFixed(2);

    return(
        <>
        <div className="row">
            <div className="col-sm-12 mb-4">
                <label htmlFor="slider" className="form-label"></label>
                <input id="slider" onChange={(e) =>handleChange(e) } type="range" defaultValue="10000" min="10000" max="200000" className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
            </div>
        </div>

        <ul className="list-none text-center md:flex justify-between">
            <li>
                <ul className="text-md-start brokerage-form list-none">
                    <li className="font-medium"><label className="control-label">Total Value ($)</label></li>
                    <li><input type="hidden" id="amount" className="form-control" /><span className="text-green-600">$</span> <p className="inline-block h5 text-green-600" id="amount-label">{isValue}</p></li>
                </ul>
            </li>

            <li className="mt-2 mt-sm-0">
                <ul className="text-md-end brokerage-form list-none">
                    <li className="font-medium"><label className="control-label">Brokerage Fee ($)</label></li>
                    <li><input type="hidden" id="saving" className="form-control" /><span className="text-green-600">$</span> <p className="inline-block h5 text-green-600" id="saving-label">{brokerage}</p></li>
                </ul>
            </li>
        </ul>
        </>
    )
}
