'use client'
import React, { useState } from "react";
import Image from "next/image"

export default function UplodProfileImg(){
    
    let [file, setFile] = useState('/images/client/07.jpg');

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            setFile(URL.createObjectURL(e.target.files[0]));
        }
    }
    return(
        <div className="profile-pic text-center mb-5">
            <input id="pro-img" name="profile-image" type="file" className="hidden" onChange={handleChange} />
            <div>
                <div className="relative h-24 w-24 mx-auto">
                    <Image src={file} width={96} height={95} className="rounded-full shadow-sm shadow-gray-200 dark:shadow-gray-700 ring-4 ring-slate-50 dark:ring-slate-800" id="profile-image" alt=""/>
                    <label className="absolute inset-0 cursor-pointer" htmlFor="pro-img"></label>
                </div>
              
                <div className="mt-4">
                    <h5 className="text-lg font-semibold">Calvin Carlo</h5>
                    <p className="text-slate-400">calvin@hotmail.com</p>
                </div>
            </div>
        </div>
    )
}