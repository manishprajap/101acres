'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link"

export default function ChatSetting(){
    let [ show, setShow ] = useState<boolean>(false);

    useEffect(() =>{
        let closeModal = () =>{
            setShow(false)
        }
        document.addEventListener('mousedown', closeModal);
        
        return()=>{
            document.removeEventListener('mousedown', closeModal);
        }
    })
    return(
        <div className="dropdown relative">
            <button onClick={()=>setShow(true)} className="dropdown-toggle items-center" type="button">
                <span className="h-8 w-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-[20px] text-center bg-green-600/5 hover:bg-green-600 border-green-600/10 hover:border-green-600 text-green-600 hover:text-white rounded-md"><i className="mdi mdi-dots-vertical"></i></span>
            </button>
            <div className={`${show ? 'show' : 'hidden'} dropdown-menu absolute end-0 m-0 mt-4 z-10 w-44 rounded-md overflow-hidden bg-white dark:bg-slate-900 shadow-sm shadow-gray-200 dark:shadow-gray-700`}>
                <ul className="py-2 text-start">
                    <li>
                        <Link href="" className="block py-1.5 px-4 hover:text-green-600"><i className="mdi mdi-account-outline"></i> Profile</Link>
                    </li>
                    <li className="ms-0">
                        <Link href="" className="block py-1.5 px-4 hover:text-green-600"><i className="mdi mdi-cog-outline"></i> Profile Settings</Link>
                    </li>
                    <li className="ms-0">
                        <Link href="" className="block py-1.5 px-4 hover:text-green-600"><i className="mdi mdi-trash-can-outline"></i> Delete</Link>
                    </li>
                </ul>
            </div>
        </div>
    )
}