'use client'
import React from "react"
import Link from "next/link"

export default function Print(){
    return(
    <div className="mt-6">
        <Link href="" onClick={()=>window.print()} className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md">Print</Link>
    </div>
    )
}